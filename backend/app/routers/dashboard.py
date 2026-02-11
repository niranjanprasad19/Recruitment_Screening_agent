"""
RSA MVP Enhanced — Dashboard & Reports Router
===============================================
Provides dashboard data: active jobs, candidates, leaderboard, rankings.
Also handles report exports.
"""

import logging
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
import io

from app.database import get_db
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.match import MatchSession, MatchResult

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["Dashboard & Reports"])


@router.get("/dashboard/metrics")
async def get_dashboard_metrics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
):
    """
    Dashboard data: active jobs, total candidates, leaderboard, rankings.
    """
    # Active jobs (status = compressed AND is_active = 'true')
    active_jobs_query = db.query(Job).filter(Job.is_active == "true")
    total_active_jobs = active_jobs_query.count()
    
    active_jobs = active_jobs_query.order_by(Job.created_at.desc()).limit(10).all()
    active_jobs_list = []
    for job in active_jobs:
        # Count candidates matched for this job
        matched = db.query(func.count(MatchResult.id)).join(
            MatchSession, MatchResult.session_id == MatchSession.id
        ).filter(MatchSession.job_id == job.id).scalar() or 0
        
        active_jobs_list.append({
            "id": job.id,
            "title": job.title,
            "company": job.company or "",
            "department": job.department or "",
            "location": job.location or "",
            "status": job.status,
            "required_skills": (job.required_skills or [])[:5],
            "candidates_matched": matched,
            "created_at": job.created_at.isoformat() if job.created_at else None,
        })
    
    # Total candidates
    total_candidates = db.query(func.count(Candidate.id)).scalar() or 0
    candidates_ready = db.query(func.count(Candidate.id)).filter(Candidate.status == "compressed").scalar() or 0
    candidates_pending = db.query(func.count(Candidate.id)).filter(Candidate.status == "uploaded").scalar() or 0
    candidates_processing = db.query(func.count(Candidate.id)).filter(
        Candidate.status.in_(["parsing", "compressing"])
    ).scalar() or 0
    candidates_error = db.query(func.count(Candidate.id)).filter(Candidate.status == "error").scalar() or 0
    
    # Leaderboard — top candidates by best overall_score
    leaderboard = []
    top_results = db.query(MatchResult).order_by(desc(MatchResult.overall_score)).limit(15).all()
    
    seen_candidates = set()
    for r in top_results:
        if r.candidate_id in seen_candidates:
            continue
        seen_candidates.add(r.candidate_id)
        
        candidate = db.query(Candidate).filter(Candidate.id == r.candidate_id).first()
        session = db.query(MatchSession).filter(MatchSession.id == r.session_id).first()
        job = db.query(Job).filter(Job.id == session.job_id).first() if session else None
        
        if candidate:
            leaderboard.append({
                "rank": len(leaderboard) + 1,
                "candidate_id": candidate.id,
                "name": candidate.name or "Unknown",
                "email": candidate.email or "",
                "overall_score": float(r.overall_score or 0),
                "skill_score": float(r.skill_score or 0),
                "experience_score": float(r.experience_score or 0),
                "education_score": float(r.education_score or 0),
                "skills": (candidate.skills or [])[:6],
                "experience_years": float(candidate.experience_years) if candidate.experience_years else 0,
                "matched_job": job.title if job else "N/A",
                "bias_adjusted": r.bias_adjusted or False,
            })
        
        if len(leaderboard) >= 10:
            break
    
    # Session stats
    total_sessions = db.query(func.count(MatchSession.id)).scalar() or 0
    completed_sessions = db.query(func.count(MatchSession.id)).filter(
        MatchSession.status == "completed"
    ).scalar() or 0
    
    # Average match score
    avg_score = db.query(func.avg(MatchResult.overall_score)).scalar()
    
    # Recent activity
    recent_candidates = db.query(Candidate).order_by(
        Candidate.created_at.desc()
    ).limit(5).all()
    
    recent_activity = []
    for c in recent_candidates:
        recent_activity.append({
            "type": "candidate",
            "name": c.name or c.file_name or "Unknown",
            "status": c.status,
            "time": c.created_at.isoformat() if c.created_at else None,
        })
    
    return {
        "active_jobs": active_jobs_list,
        "total_active_jobs": total_active_jobs,
        "total_jobs": db.query(func.count(Job.id)).scalar() or 0,
        "total_candidates": total_candidates,
        "candidates_ready": candidates_ready,
        "candidates_pending": candidates_pending,
        "candidates_processing": candidates_processing,
        "candidates_error": candidates_error,
        "leaderboard": leaderboard,
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "avg_match_score": round(float(avg_score), 4) if avg_score else 0.0,
        "recent_activity": recent_activity,
    }


class ReportExportRequest(BaseModel):
    session_id: str
    format: str = "csv"
    top_n: Optional[int] = None


@router.post("/reports/export")
async def export_report(
    request: ReportExportRequest,
    db: Session = Depends(get_db),
):
    """Export match results as CSV, PDF, or JSON."""
    session = db.query(MatchSession).filter(MatchSession.id == request.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Match session not found")
    
    if session.status != "completed":
        raise HTTPException(status_code=400, detail="Session not yet completed")
    
    job = db.query(Job).filter(Job.id == session.job_id).first()
    job_title = job.title if job else "Unknown"
    
    results_query = db.query(MatchResult).filter(
        MatchResult.session_id == request.session_id
    ).order_by(MatchResult.rank)
    
    if request.top_n:
        results_query = results_query.limit(request.top_n)
    
    db_results = results_query.all()
    
    results = []
    for r in db_results:
        candidate = db.query(Candidate).filter(Candidate.id == r.candidate_id).first()
        results.append({
            "rank": r.rank,
            "candidate_name": candidate.name if candidate else "Unknown",
            "candidate_email": candidate.email if candidate else "",
            "overall_score": float(r.overall_score or 0),
            "skill_score": float(r.skill_score or 0),
            "experience_score": float(r.experience_score or 0),
            "education_score": float(r.education_score or 0),
            "semantic_score": float(r.semantic_score or 0),
            "bias_adjusted": r.bias_adjusted or False,
        })
    
    if request.format == "csv":
        from app.services.reports import ReportGenerator
        csv_content = ReportGenerator.generate_csv(results, job_title)
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=report_{session.id}.csv"}
        )
    elif request.format == "json":
        return JSONResponse(content={"report": {"job_title": job_title, "results": results}})
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Use 'csv' or 'json'.")
