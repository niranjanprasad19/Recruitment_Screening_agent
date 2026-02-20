"""
RSA MVP Enhanced — Matching Engine Router
===========================================
Handles matching sessions: run, status, and results.
Fixed for SQLite compatibility.
"""

import uuid
import logging
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.config import settings
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.match import MatchSession, MatchResult
from app.models.audit import AuditLog
from app.services.matcher import MatchingEngine
from app.services.bias import BiasDetector

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/match", tags=["Matching"])


class MatchConfig(BaseModel):
    skill_weight: float = 0.30
    experience_weight: float = 0.20
    education_weight: float = 0.10
    title_weight: float = 0.10
    stability_weight: float = 0.15
    growth_weight: float = 0.15
    semantic_weight: float = 0.0
    bias_check: bool = True


class MatchRunRequest(BaseModel):
    job_id: str
    candidate_ids: Optional[list] = None
    config: Optional[MatchConfig] = None


def run_matching_background(session_id: str, db_url: str):
    """Background task that runs the full matching pipeline."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    
    connect_args = {}
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    
    engine = create_engine(db_url, connect_args=connect_args)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    session = None
    try:
        session = db.query(MatchSession).filter(MatchSession.id == session_id).first()
        if not session:
            logger.error(f"Match session {session_id} not found")
            return
        
        session.status = "processing"
        session.started_at = datetime.utcnow()
        db.commit()
        
        # Load job
        job = db.query(Job).filter(Job.id == session.job_id).first()
        if not job or not job.compressed_data:
            session.status = "failed"
            db.commit()
            logger.error(f"Job {session.job_id} not ready for matching")
            return
        
        # Load candidates
        candidate_query = db.query(Candidate).filter(Candidate.status == "compressed")
        
        config = session.config or {}
        candidate_ids = config.get("candidate_ids")
        if candidate_ids:
            candidate_query = candidate_query.filter(Candidate.id.in_(candidate_ids))
        
        candidates = candidate_query.all()
        session.total_candidates = len(candidates)
        db.commit()
        
        if not candidates:
            session.status = "completed"
            session.completed_at = datetime.utcnow()
            db.commit()
            return
        
        # Match config
        match_config = {
            "skill_weight": config.get("skill_weight", settings.DEFAULT_SKILL_WEIGHT),
            "experience_weight": config.get("experience_weight", settings.DEFAULT_EXPERIENCE_WEIGHT),
            "education_weight": config.get("education_weight", settings.DEFAULT_EDUCATION_WEIGHT),
            "title_weight": config.get("title_weight", 0.15),
            "stability_weight": config.get("stability_weight", 0.15),
            "growth_weight": config.get("growth_weight", 0.15),
            "semantic_weight": config.get("semantic_weight", settings.DEFAULT_SEMANTIC_WEIGHT),
        }
        
        job_payload = job.compressed_data or {}
        job_payload["title"] = job.title
        
        results = []
        for i, candidate in enumerate(candidates):
            try:
                match_result = MatchingEngine.compute_match(
                    candidate_data=candidate.compressed_data or {},
                    job_data=job_payload,
                    candidate_embedding=candidate.embedding,
                    job_embedding=job.embedding,
                    config=match_config,
                )
                
                bias_adjusted = False
                if config.get("bias_check", True) and candidate.bias_flags:
                    if candidate.bias_flags.get("risk_level") in ("medium", "high"):
                        bias_adjusted = True
                
                result = MatchResult(
                    session_id=session_id,
                    candidate_id=candidate.id,
                    overall_score=match_result["overall_score"],
                    skill_score=match_result["skill_score"],
                    experience_score=match_result["experience_score"],
                    education_score=match_result["education_score"],
                    semantic_score=match_result["semantic_score"],
                    score_breakdown=match_result.get("score_breakdown"),
                    bias_adjusted=bias_adjusted,
                )
                db.add(result)
                results.append(result)
                
                session.processed_candidates = i + 1
                db.commit()
                
            except Exception as e:
                logger.error(f"Error matching candidate {candidate.id}: {e}")
                continue
        
        # Rank by score
        results.sort(key=lambda r: float(r.overall_score or 0), reverse=True)
        for rank, result in enumerate(results, 1):
            result.rank = rank
        
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"✅ Matching session {session_id} completed: {len(results)} candidates")
        
    except Exception as e:
        logger.error(f"❌ Error in matching session {session_id}: {e}")
        if session:
            session.status = "failed"
            try:
                db.commit()
            except Exception:
                db.rollback()
    finally:
        db.close()


@router.post("/run", status_code=202)
async def run_matching(
    request: MatchRunRequest,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
):
    """Initiate a matching session."""
    job = db.query(Job).filter(Job.id == request.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status != "compressed":
        raise HTTPException(
            status_code=400,
            detail=f"Job is not ready for matching (status: {job.status}). Wait for processing to complete."
        )
    
    config_dict = request.config.model_dump() if request.config else {
        "skill_weight": settings.DEFAULT_SKILL_WEIGHT,
        "experience_weight": settings.DEFAULT_EXPERIENCE_WEIGHT,
        "education_weight": settings.DEFAULT_EDUCATION_WEIGHT,
        "title_weight": 0.15,
        "stability_weight": 0.15,
        "growth_weight": 0.15,
        "semantic_weight": settings.DEFAULT_SEMANTIC_WEIGHT,
        "bias_check": True,
    }
    
    if request.candidate_ids:
        config_dict["candidate_ids"] = request.candidate_ids
    
    session = MatchSession(
        job_id=request.job_id,
        status="pending",
        config=config_dict,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    background_tasks.add_task(
        run_matching_background, str(session.id), settings.DATABASE_URL,
    )
    
    return {
        "id": session.id,
        "job_id": session.job_id,
        "job_title": job.title,
        "status": session.status,
        "total_candidates": 0,
        "processed_candidates": 0,
        "progress_percent": 0.0,
        "created_at": session.created_at.isoformat() if session.created_at else None,
    }


@router.get("/sessions")
async def list_sessions(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
):
    """List all matching sessions."""
    sessions = db.query(MatchSession) \
        .order_by(desc(MatchSession.created_at)) \
        .offset((page - 1) * per_page) \
        .limit(per_page) \
        .all()
    
    result = []
    for s in sessions:
        job = db.query(Job).filter(Job.id == s.job_id).first()
        if not job:
            continue

        progress = (s.processed_candidates / s.total_candidates * 100) if s.total_candidates and s.total_candidates > 0 else 0
        
        result.append({
            "id": s.id,
            "job_id": s.job_id,
            "job_title": job.title,
            "status": s.status,
            "total_candidates": s.total_candidates or 0,
            "processed_candidates": s.processed_candidates or 0,
            "progress_percent": round(progress, 1),
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
        })
    
    return result


@router.get("/results/{session_id}")
async def get_match_results(
    session_id: str,
    top_n: Optional[int] = Query(None, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get ranked match results for a completed session."""
    session = db.query(MatchSession).filter(MatchSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Match session not found")
    
    job = db.query(Job).filter(Job.id == session.job_id).first()
    
    results_query = db.query(MatchResult) \
        .filter(MatchResult.session_id == session_id) \
        .order_by(MatchResult.rank)
    
    if top_n:
        results_query = results_query.limit(top_n)
    
    results = results_query.all()
    
    result_list = []
    for r in results:
        candidate = db.query(Candidate).filter(Candidate.id == r.candidate_id).first()
        result_list.append({
            "id": r.id,
            "candidate_id": r.candidate_id,
            "candidate_name": candidate.name if candidate else "Unknown",
            "candidate_email": candidate.email if candidate else None,
            "overall_score": float(r.overall_score or 0),
            "skill_score": float(r.skill_score or 0),
            "experience_score": float(r.experience_score or 0),
            "education_score": float(r.education_score or 0),
            "semantic_score": float(r.semantic_score or 0),
            "bias_adjusted": r.bias_adjusted or False,
            "rank": r.rank,
            "candidate_skills": candidate.skills if candidate and candidate.skills else [],
            "candidate_experience_years": float(candidate.experience_years) if candidate and candidate.experience_years else None,
        })
    
    progress = (session.processed_candidates / session.total_candidates * 100) if session.total_candidates and session.total_candidates > 0 else 0
    
    return {
        "session": {
            "id": session.id,
            "job_id": session.job_id,
            "job_title": job.title if job else "Unknown",
            "status": session.status,
            "total_candidates": session.total_candidates or 0,
            "processed_candidates": session.processed_candidates or 0,
            "progress_percent": round(progress, 1),
        },
        "results": result_list,
        "total": len(result_list),
    }


@router.get("/status/{session_id}")
async def get_session_status(session_id: str, db: Session = Depends(get_db)):
    """Get the current processing status of a matching session."""
    session = db.query(MatchSession).filter(MatchSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Match session not found")
    
    progress = (session.processed_candidates / session.total_candidates * 100) if session.total_candidates and session.total_candidates > 0 else 0
    
    return {
        "session_id": str(session.id),
        "status": session.status,
        "total_candidates": session.total_candidates or 0,
        "processed_candidates": session.processed_candidates or 0,
        "progress_percent": round(progress, 1),
    }
