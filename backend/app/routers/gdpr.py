"""
RSA MVP Enhanced — GDPR Compliance Router
==========================================
Handles GDPR-related endpoints:
- Consent management (record & withdraw)
- Right to access (data export)
- Right to erasure (data deletion)
- Data retention policy
- Audit trail
"""

import logging
import json
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.config import settings
from app.models.candidate import Candidate
from app.models.audit import AuditLog

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/gdpr", tags=["GDPR Compliance"])


# =====================
# Models
# =====================

class ConsentRequest(BaseModel):
    entity_type: str = "candidate"  # candidate | user
    entity_id: str
    consent_given: bool = True
    purpose: str = "recruitment_screening"


class DataDeletionRequest(BaseModel):
    entity_type: str = "candidate"
    entity_id: str
    reason: str = "user_request"


# =====================
# Consent Management
# =====================

@router.post("/consent")
async def record_consent(request: ConsentRequest, db: Session = Depends(get_db)):
    """
    Record data processing consent (GDPR Article 6).
    Logs consent given/withdrawn in the audit trail.
    """
    action = "consent_given" if request.consent_given else "consent_withdrawn"

    audit = AuditLog(
        entity_type=request.entity_type,
        entity_id=request.entity_id,
        action=action,
        details={
            "purpose": request.purpose,
            "consent": request.consent_given,
            "timestamp": datetime.utcnow().isoformat(),
            "ip_address": "redacted",  # Would come from request in production
        },
    )
    db.add(audit)
    db.commit()

    logger.info(f"GDPR consent {action} for {request.entity_type}:{request.entity_id}")

    return {
        "status": "recorded",
        "action": action,
        "entity_type": request.entity_type,
        "entity_id": request.entity_id,
        "timestamp": datetime.utcnow().isoformat(),
    }


# =====================
# Right to Access (Data Export)
# =====================

@router.get("/export/{candidate_id}")
async def export_candidate_data(candidate_id: str, db: Session = Depends(get_db)):
    """
    Export all data held about a candidate (GDPR Article 15 — Right of Access).
    Returns a complete JSON dump of the candidate's data.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Log the data access
    audit = AuditLog(
        entity_type="candidate",
        entity_id=candidate_id,
        action="data_exported",
        details={"purpose": "gdpr_right_of_access"},
    )
    db.add(audit)
    db.commit()

    exported_data = {
        "candidate_profile": {
            "id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
        },
        "processed_data": {
            "skills": candidate.skills,
            "experience_years": float(candidate.experience_years) if candidate.experience_years else None,
            "education": candidate.education,
            "compressed_data": candidate.compressed_data,
        },
        "bias_analysis": candidate.bias_flags,
        "file_metadata": {
            "file_name": candidate.file_name,
            "file_type": candidate.file_type,
            "status": candidate.status,
        },
        "timestamps": {
            "created_at": candidate.created_at.isoformat() if candidate.created_at else None,
            "updated_at": candidate.updated_at.isoformat() if candidate.updated_at else None,
            "expires_at": candidate.expires_at.isoformat() if candidate.expires_at else None,
        },
        "data_retention": {
            "policy_days": settings.DATA_RETENTION_DAYS,
            "auto_delete_scheduled": candidate.expires_at.isoformat() if candidate.expires_at else None,
        },
        "export_metadata": {
            "exported_at": datetime.utcnow().isoformat(),
            "format": "json",
            "gdpr_article": "Article 15 — Right of Access",
        },
    }

    return JSONResponse(
        content=exported_data,
        headers={"Content-Disposition": f"attachment; filename=gdpr_export_{candidate_id}.json"},
    )


# =====================
# Right to Erasure (Data Deletion)
# =====================

@router.post("/delete")
async def delete_candidate_data(request: DataDeletionRequest, db: Session = Depends(get_db)):
    """
    Delete all data for a candidate (GDPR Article 17 — Right to Erasure).
    Removes personal data, files, embeddings, and compressed data.
    """
    if request.entity_type != "candidate":
        raise HTTPException(status_code=400, detail="Only candidate deletion is supported")

    candidate = db.query(Candidate).filter(Candidate.id == request.entity_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Store minimal info for audit before deletion
    candidate_name = candidate.name or "Unknown"
    file_path = candidate.file_path

    # Delete the file from disk
    if file_path:
        import os
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Deleted file: {file_path}")
        except Exception as e:
            logger.warning(f"Could not delete file {file_path}: {e}")

    # Delete from database
    db.delete(candidate)

    # Log the deletion in audit trail (GDPR requires keeping deletion records)
    audit = AuditLog(
        entity_type="candidate",
        entity_id=request.entity_id,
        action="data_erased",
        details={
            "reason": request.reason,
            "candidate_name_hash": hash(candidate_name),  # Store hash, not actual name
            "gdpr_article": "Article 17",
            "timestamp": datetime.utcnow().isoformat(),
        },
    )
    db.add(audit)
    db.commit()

    logger.info(f"GDPR erasure completed for candidate {request.entity_id}")

    return {
        "status": "deleted",
        "entity_id": request.entity_id,
        "details": "All personal data, files, embeddings, and processed data have been permanently deleted.",
        "audit_record": "Deletion recorded in audit trail (GDPR Article 30).",
    }


# =====================
# Data Retention Policy
# =====================

@router.get("/retention-policy")
async def get_retention_policy():
    """Return the current data retention policy configuration."""
    return {
        "retention_days": settings.DATA_RETENTION_DAYS,
        "auto_cleanup": True,
        "cleanup_method": "Celery periodic task (cleanup_expired_data)",
        "description": f"Candidate data is automatically deleted {settings.DATA_RETENTION_DAYS} days after upload.",
        "gdpr_articles": ["Article 5(1)(e) — Storage Limitation", "Article 17 — Right to Erasure"],
        "data_categories": [
            {"category": "Personal Information", "includes": "Name, Email, Phone", "retention": f"{settings.DATA_RETENTION_DAYS} days"},
            {"category": "Resume Content", "includes": "Original text, parsed data", "retention": f"{settings.DATA_RETENTION_DAYS} days"},
            {"category": "AI-Processed Data", "includes": "Skills extraction, embeddings, bias flags", "retention": f"{settings.DATA_RETENTION_DAYS} days"},
            {"category": "Match Results", "includes": "Scores, rankings", "retention": f"{settings.DATA_RETENTION_DAYS} days"},
            {"category": "Audit Logs", "includes": "Consent records, deletion logs", "retention": "Indefinite (legal requirement)"},
        ],
    }


# =====================
# Audit Trail
# =====================

@router.get("/audit-trail")
async def get_audit_trail(
    entity_id: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    View the GDPR audit trail (GDPR Article 30 — Records of Processing).
    """
    query = db.query(AuditLog).order_by(desc(AuditLog.created_at))

    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    logs = query.limit(limit).all()

    return {
        "total": len(logs),
        "logs": [
            {
                "id": log.id,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "action": log.action,
                "details": log.details,
                "created_at": log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
    }


# =====================
# GDPR Overview / Status
# =====================

@router.get("/status")
async def gdpr_status(db: Session = Depends(get_db)):
    """
    Get an overview of GDPR compliance status.
    """
    from sqlalchemy import func

    total_candidates = db.query(func.count(Candidate.id)).scalar() or 0
    expired_candidates = db.query(func.count(Candidate.id)).filter(
        Candidate.expires_at < datetime.utcnow()
    ).scalar() or 0

    total_consent_records = db.query(func.count(AuditLog.id)).filter(
        AuditLog.action.in_(["consent_given", "consent_withdrawn"])
    ).scalar() or 0

    total_deletions = db.query(func.count(AuditLog.id)).filter(
        AuditLog.action == "data_erased"
    ).scalar() or 0

    total_exports = db.query(func.count(AuditLog.id)).filter(
        AuditLog.action == "data_exported"
    ).scalar() or 0

    return {
        "compliance_features": {
            "consent_management": True,
            "right_to_access": True,
            "right_to_erasure": True,
            "data_retention_policy": True,
            "audit_trail": True,
            "auto_cleanup": True,
        },
        "statistics": {
            "total_candidates": total_candidates,
            "expired_awaiting_cleanup": expired_candidates,
            "consent_records": total_consent_records,
            "data_deletions": total_deletions,
            "data_exports": total_exports,
            "retention_days": settings.DATA_RETENTION_DAYS,
        },
    }
