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
    
    from app.services.reports import ReportGenerator
    
    if request.format == "csv":
        csv_content = ReportGenerator.generate_csv(results, job_title)
        return StreamingResponse(
            io.StringIO(csv_content),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=report_{session.id}.csv"}
        )
    elif request.format == "json":
        return JSONResponse(content={"report": {"job_title": job_title, "results": results}})
    elif request.format == "pdf":
        pdf_bytes = ReportGenerator.generate_pdf(results, job_title)
        if not pdf_bytes:
            raise HTTPException(
                status_code=503,
                detail="PDF generation unavailable. Install 'reportlab' to enable PDF exports."
            )
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=report_{session.id}.pdf"}
        )
    else:
        raise HTTPException(status_code=400, detail="Unsupported format. Use 'csv', 'json', or 'pdf'.")


@router.get("/dashboard/job/{job_id}/analytics")
async def get_job_analytics(
    job_id: str,
    db: Session = Depends(get_db),
):
    """Per-job analytics: score distributions, skill coverage, experience breakdown, top candidates."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # All match sessions for this job
    sessions = db.query(MatchSession).filter(MatchSession.job_id == job_id).order_by(desc(MatchSession.created_at)).all()
    session_ids = [s.id for s in sessions]

    # All match results across sessions
    results = []
    if session_ids:
        results = db.query(MatchResult).filter(MatchResult.session_id.in_(session_ids)).all()

    total_matched = len(results)

    # Score distribution (buckets: 0-10, 10-20, ..., 90-100)
    score_buckets = [0] * 10
    skill_scores, exp_scores, edu_scores, sem_scores, overall_scores = [], [], [], [], []
    for r in results:
        score = float(r.overall_score or 0) * 100
        bucket = min(int(score // 10), 9)
        score_buckets[bucket] += 1
        overall_scores.append(float(r.overall_score or 0))
        skill_scores.append(float(r.skill_score or 0))
        exp_scores.append(float(r.experience_score or 0))
        edu_scores.append(float(r.education_score or 0))
        sem_scores.append(float(r.semantic_score or 0))

    score_distribution = [
        {"range": f"{i*10}-{i*10+10}", "count": score_buckets[i]} for i in range(10)
    ]

    avg = lambda lst: round(sum(lst) / len(lst), 4) if lst else 0.0

    # Top candidates for this job
    top_results = sorted(results, key=lambda r: float(r.overall_score or 0), reverse=True)[:10]
    top_candidates = []
    seen = set()
    for r in top_results:
        if r.candidate_id in seen:
            continue
        seen.add(r.candidate_id)
        candidate = db.query(Candidate).filter(Candidate.id == r.candidate_id).first()
        if candidate:
            top_candidates.append({
                "candidate_id": candidate.id,
                "name": candidate.name or "Unknown",
                "email": candidate.email or "",
                "overall_score": float(r.overall_score or 0),
                "skill_score": float(r.skill_score or 0),
                "experience_score": float(r.experience_score or 0),
                "education_score": float(r.education_score or 0),
                "skills": (candidate.skills or [])[:8],
                "experience_years": float(candidate.experience_years) if candidate.experience_years else 0,
                "bias_adjusted": r.bias_adjusted or False,
                "rank": r.rank,
            })

    # Skill coverage — what % of candidates have each required skill
    required_skills = job.required_skills or []
    skill_coverage = []
    if required_skills and results:
        cand_ids = list({r.candidate_id for r in results})
        cands = db.query(Candidate).filter(Candidate.id.in_(cand_ids)).all()
        for sk in required_skills[:12]:
            matched = sum(1 for c in cands if c.skills and sk.lower() in [s.lower() for s in c.skills])
            skill_coverage.append({
                "skill": sk,
                "matched": matched,
                "total": len(cands),
                "percent": round(matched / len(cands) * 100, 1) if cands else 0,
            })

    # Experience distribution
    exp_dist = {"0-2": 0, "3-5": 0, "6-10": 0, "10+": 0}
    if results:
        cand_ids = list({r.candidate_id for r in results})
        cands = db.query(Candidate).filter(Candidate.id.in_(cand_ids)).all()
        for c in cands:
            yr = float(c.experience_years) if c.experience_years else 0
            if yr <= 2:
                exp_dist["0-2"] += 1
            elif yr <= 5:
                exp_dist["3-5"] += 1
            elif yr <= 10:
                exp_dist["6-10"] += 1
            else:
                exp_dist["10+"] += 1

    # Session history
    session_list = []
    for s in sessions[:10]:
        session_list.append({
            "id": s.id,
            "status": s.status,
            "total_candidates": s.total_candidates or 0,
            "processed_candidates": s.processed_candidates or 0,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
        })

    # Bias stats
    bias_adjusted_count = sum(1 for r in results if r.bias_adjusted)

    return {
        "job": {
            "id": job.id,
            "title": job.title,
            "company": job.company or "",
            "department": job.department or "",
            "location": job.location or "",
            "status": job.status,
            "required_skills": required_skills,
            "created_at": job.created_at.isoformat() if job.created_at else None,
        },
        "summary": {
            "total_matched": total_matched,
            "total_sessions": len(sessions),
            "avg_overall_score": avg(overall_scores),
            "avg_skill_score": avg(skill_scores),
            "avg_experience_score": avg(exp_scores),
            "avg_education_score": avg(edu_scores),
            "avg_semantic_score": avg(sem_scores),
            "highest_score": round(max(overall_scores), 4) if overall_scores else 0.0,
            "lowest_score": round(min(overall_scores), 4) if overall_scores else 0.0,
            "bias_adjusted_count": bias_adjusted_count,
        },
        "score_distribution": score_distribution,
        "skill_coverage": skill_coverage,
        "experience_distribution": [
            {"range": k, "count": v} for k, v in exp_dist.items()
        ],
        "top_candidates": top_candidates,
        "sessions": session_list,
    }
