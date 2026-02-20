"""
RSA MVP Enhanced — Audit Log Model
====================================
Tracks all significant operations for GDPR compliance.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, JSON
from app.database import Base


class AuditLog(Base):
    """Audit log for tracking all significant operations."""
    
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = Column(String(50), nullable=False)   # candidate, job, match_session
    entity_id = Column(String(36), nullable=True)
    action = Column(String(50), nullable=False)         # created, processed, deleted, exported
    details = Column(JSON, nullable=True)
    user_id = Column(String(36), nullable=True)
    company_id = Column(String(36), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<AuditLog(action='{self.action}', entity='{self.entity_type}:{self.entity_id}')>"
