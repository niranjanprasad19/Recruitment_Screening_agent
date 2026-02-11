"""
RSA MVP Enhanced — Job Description Router
===========================================
Handles job description uploads, listing, and processing.
Fixed for SQLite compatibility.
"""

import os
import uuid
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, BackgroundTasks, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.config import settings
from app.models.job import Job
from app.models.audit import AuditLog
from app.services.parser import FileParser
from app.services.compressor import JDCompressor

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/jobs", tags=["Job Descriptions"])


class JobCreateRequest(BaseModel):
    title: str
    company: Optional[str] = ""
    department: Optional[str] = ""
    location: Optional[str] = ""
    description_text: Optional[str] = ""


def job_to_dict(job):
    """Convert a Job ORM object to a dict for JSON response."""
    return {
        "id": job.id,
        "title": job.title,
        "company": job.company or "",
        "department": job.department or "",
        "location": job.location or "",
        "status": job.status,
        "is_active": job.is_active == "true",
        "required_skills": job.required_skills or [],
        "preferred_skills": job.preferred_skills or [],
        "experience_range": job.experience_range or "",
        "education_requirement": job.education_requirement or "",
        "created_at": job.created_at.isoformat() if job.created_at else None,
        "updated_at": job.updated_at.isoformat() if job.updated_at else None,
    }


def process_jd_background(job_id: str, file_path: str = None, text: str = None, db_url: str = ""):
    """
    Background task to process a job description:
    1. Parse file (if uploaded) or use provided text
    2. Compress into structured JSON via NLP
    3. Generate embeddings for semantic matching
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    
    engine = create_engine(db_url, connect_args=connect_args)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    job = None
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found for processing")
            return
        
        # Step 1: Get text
        job.status = "parsing"
        db.commit()
        
        raw_text = text
        if file_path and not raw_text:
            raw_text = FileParser.parse(file_path)
        
        job.original_text = raw_text
        job.status = "parsed"
        db.commit()
        
        # Step 2: NLP compression
        job.status = "compressing"
        db.commit()
        
        compressed = JDCompressor.compress_jd(raw_text, use_llm=False)
        
        job.compressed_data = compressed
        job.required_skills = compressed.get("required_skills", [])
        job.preferred_skills = compressed.get("preferred_skills", [])
        job.experience_range = compressed.get("experience_range", "")
        job.education_requirement = compressed.get("education_requirements", "")
        
        # Step 3: Generate embedding (optional)
        try:
            from app.services.matcher import MatchingEngine
            embedding = MatchingEngine.generate_embedding(raw_text)
            job.embedding = embedding
        except Exception as e:
            logger.warning(f"Embedding generation skipped for job {job_id}: {e}")
        
        job.status = "compressed"
        db.commit()
        
        # Audit log
        audit = AuditLog(
            entity_type="job",
            entity_id=job_id,
            action="processed",
            details={"skills_found": len(compressed.get("required_skills", []))}
        )
        db.add(audit)
        db.commit()
        
        logger.info(f"✅ Successfully processed JD for job {job_id}")
        
    except Exception as e:
        logger.error(f"❌ Error processing job {job_id}: {e}")
        if job:
            job.status = "error"
            try:
                db.commit()
            except Exception:
                db.rollback()
    finally:
        db.close()


@router.post("/upload", status_code=201)
async def upload_job_description(
    file: Optional[UploadFile] = File(None),
    title: str = Query(..., description="Job title"),
    company: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
):
    """Upload a job description file for processing."""
    file_path = None
    
    if file:
        error = FileParser.validate_file(file.filename, settings.max_upload_bytes, file.size or 0)
        if error:
            raise HTTPException(status_code=400, detail=error)
        
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    
    job = Job(
        title=title,
        company=company or "",
        department=department or "",
        status="uploaded",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    background_tasks.add_task(
        process_jd_background, str(job.id), file_path, None, settings.DATABASE_URL,
    )
    
    return job_to_dict(job)


@router.post("/create", status_code=201)
async def create_job_from_text(
    job_data: JobCreateRequest,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
):
    """Create a job description from text input (no file upload needed)."""
    job = Job(
        title=job_data.title,
        company=job_data.company or "",
        department=job_data.department or "",
        location=job_data.location or "",
        original_text=job_data.description_text,
        status="uploaded",
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    if job_data.description_text:
        background_tasks.add_task(
            process_jd_background, str(job.id), None, job_data.description_text, settings.DATABASE_URL,
        )
    
    return job_to_dict(job)


@router.get("")
async def list_jobs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List all job descriptions with pagination."""
    query = db.query(Job)
    if status:
        query = query.filter(Job.status == status)
    
    total = query.count()
    jobs = query.order_by(Job.created_at.desc()) \
        .offset((page - 1) * per_page) \
        .limit(per_page) \
        .all()
    
    return {
        "jobs": [job_to_dict(j) for j in jobs],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/{job_id}")
async def get_job(job_id: str, db: Session = Depends(get_db)):
    """Get detailed information about a specific job description."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job_to_dict(job)


@router.delete("/{job_id}", status_code=204)
async def delete_job(job_id: str, db: Session = Depends(get_db)):
    """Delete a job description and associated data."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    audit = AuditLog(entity_type="job", entity_id=job_id, action="deleted", details={"title": job.title})
    db.add(audit)
    
    db.delete(job)
    db.commit()
