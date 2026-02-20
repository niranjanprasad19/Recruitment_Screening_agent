"""
RSA MVP Enhanced — Resume Upload Router
=========================================
Handles resume file uploads, listing, and processing.
Fixed to work with SQLite (no PostgreSQL needed).
"""

import os
import uuid
import logging
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, Query, BackgroundTasks, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import settings
from app.models.candidate import Candidate
from app.models.audit import AuditLog
from app.services.parser import FileParser
from app.services.compressor import ResumeCompressor
from app.services.bias import BiasDetector

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/resumes", tags=["Resumes"])


def process_resume_background(candidate_id: str, file_path: str, db_url: str):
    """
    Background task to process a resume:
    1. Parse file → extract text
    2. Detect & neutralize bias
    3. Compress into structured JSON via NLP
    4. Generate embeddings for semantic matching
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    
    engine = create_engine(db_url, connect_args=connect_args)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    candidate = None
    try:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            logger.error(f"Candidate {candidate_id} not found for processing")
            return
        
        # Step 1: Parse file
        candidate.status = "parsing"
        db.commit()
        
        raw_text = FileParser.parse(file_path)
        candidate.original_text = raw_text
        candidate.status = "parsed"
        db.commit()
        
        # Step 2: Bias detection & neutralization
        bias_analysis = BiasDetector.analyze(raw_text)
        neutralized_text, changes = BiasDetector.neutralize(raw_text)
        candidate.bias_flags = bias_analysis
        
        # Step 3: NLP compression
        candidate.status = "compressing"
        db.commit()
        
        compressed = ResumeCompressor.compress_resume(neutralized_text, use_llm=False)
        
        candidate.compressed_data = compressed
        candidate.name = candidate.name or compressed.get("name", "")
        candidate.skills = compressed.get("skills", [])
        candidate.experience_years = compressed.get("total_experience_years", 0)
        candidate.education = str(compressed.get("education", ""))
        
        # Step 4: Generate embedding (optional — may fail without model)
        try:
            from app.services.matcher import MatchingEngine
            embedding = MatchingEngine.generate_embedding(neutralized_text)
            candidate.embedding = embedding
        except Exception as e:
            logger.warning(f"Embedding generation skipped for {candidate_id}: {e}")
        
        candidate.status = "compressed"
        db.commit()
        
        # Audit log
        audit = AuditLog(
            entity_type="candidate",
            entity_id=candidate_id,
            action="processed",
            details={
                "bias_flags": len(bias_analysis.get("flags", [])),
                "skills_found": len(compressed.get("skills", [])),
            }
        )
        db.add(audit)
        db.commit()
        
        logger.info(f"✅ Successfully processed resume for candidate {candidate_id}")
        
    except Exception as e:
        logger.error(f"❌ Error processing candidate {candidate_id}: {e}")
        if candidate:
            candidate.status = "error"
            try:
                db.commit()
            except Exception:
                db.rollback()
    finally:
        db.close()


@router.post("/upload", status_code=201)
async def upload_resume(
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
):
    """
    Upload a resume file for processing.
    
    Accepts PDF, DOCX, or TXT files up to 10MB.
    The file will be parsed, compressed, and embedded in the background.
    """
    # Validate file
    error = FileParser.validate_file(
        file.filename,
        settings.max_upload_bytes,
        file.size or 0
    )
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create candidate record
    candidate = Candidate(
        name=name or "",
        email=email or "",
        file_path=file_path,
        file_name=file.filename,
        file_type=file_ext.lstrip("."),
        status="uploaded",
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    
    # Process in background
    background_tasks.add_task(
        process_resume_background,
        str(candidate.id),
        file_path,
        settings.DATABASE_URL,
    )
    
    return {
        "id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "file_name": file.filename,
        "status": candidate.status,
        "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
    }


@router.post("/upload-batch", status_code=202)
async def upload_resumes_batch(
    files: List[UploadFile] = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
):
    """
    Upload multiple resume files for batch processing.
    Accepts up to 100 files. Returns immediately, processes in background.
    """
    if len(files) > 100:
        raise HTTPException(status_code=400, detail="Maximum 100 files per batch")
    
    results = []
    errors = []
    
    for file in files:
        error = FileParser.validate_file(
            file.filename,
            settings.max_upload_bytes,
            file.size or 0
        )
        if error:
            errors.append({"filename": file.filename, "error": error})
            continue
        
        # Save file
        os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Create candidate record
        candidate = Candidate(
            file_path=file_path,
            file_name=file.filename,
            file_type=file_ext.lstrip("."),
            status="uploaded",
        )
        db.add(candidate)
        db.commit()
        db.refresh(candidate)
        
        # Queue background processing
        background_tasks.add_task(
            process_resume_background,
            str(candidate.id),
            file_path,
            settings.DATABASE_URL,
        )
        
        results.append({
            "id": str(candidate.id),
            "filename": file.filename,
            "status": "queued",
        })
    
    return {
        "message": f"Queued {len(results)} resumes for processing",
        "queued": results,
        "errors": errors,
    }


@router.get("")
async def list_candidates(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """List all uploaded candidates with pagination."""
    query = db.query(Candidate)
    
    if status:
        query = query.filter(Candidate.status == status)
    
    total = query.count()
    candidates = query.order_by(Candidate.created_at.desc()) \
        .offset((page - 1) * per_page) \
        .limit(per_page) \
        .all()
    
    return {
        "candidates": [
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "phone": c.phone,
                "skills": c.skills or [],
                "experience_years": float(c.experience_years) if c.experience_years else 0,
                "education": c.education,
                "status": c.status,
                "file_name": c.file_name,
                "created_at": c.created_at.isoformat() if c.created_at else None,
                "updated_at": c.updated_at.isoformat() if c.updated_at else None,
            }
            for c in candidates
        ],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/{candidate_id}")
async def get_candidate(candidate_id: str, db: Session = Depends(get_db)):
    """Get detailed information about a specific candidate."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {
        "id": candidate.id,
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "skills": candidate.skills or [],
        "experience_years": float(candidate.experience_years) if candidate.experience_years else 0,
        "education": candidate.education,
        "status": candidate.status,
        "original_text": candidate.original_text,
        "compressed_data": candidate.compressed_data,
        "bias_flags": candidate.bias_flags,
        "file_name": candidate.file_name,
        "file_type": candidate.file_type,
        "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
        "updated_at": candidate.updated_at.isoformat() if candidate.updated_at else None,
        "expires_at": candidate.expires_at.isoformat() if candidate.expires_at else None,
    }


@router.get("/{candidate_id}/download")
async def download_resume(candidate_id: str, db: Session = Depends(get_db)):
    """Download the original resume file."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    if not candidate.file_path or not os.path.exists(candidate.file_path):
        raise HTTPException(status_code=404, detail="Resume file not found on server")
    
    return FileResponse(
        path=candidate.file_path,
        filename=candidate.file_name,
        media_type='application/octet-stream'
    )


@router.delete("/{candidate_id}", status_code=204)
async def delete_candidate(candidate_id: str, db: Session = Depends(get_db)):
    """Delete a candidate and associated files (GDPR compliance)."""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Delete file
    if candidate.file_path and os.path.exists(candidate.file_path):
        os.remove(candidate.file_path)
    
    # Audit log
    audit = AuditLog(
        entity_type="candidate",
        entity_id=candidate_id,
        action="deleted",
        details={"name": candidate.name}
    )
    db.add(audit)
    
    db.delete(candidate)
    db.commit()
