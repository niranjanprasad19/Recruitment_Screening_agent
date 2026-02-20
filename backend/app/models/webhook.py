"""
RSA MVP Enhanced — Webhook Log Model
======================================
Tracks webhook delivery attempts to ATS systems.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON
from app.database import Base


class WebhookLog(Base):
    """Tracks webhook delivery attempts."""
    
    __tablename__ = "webhook_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(String(50), nullable=False)
    payload = Column(JSON, nullable=True)
    response_status = Column(Integer, nullable=True)
    response_body = Column(String(5000), nullable=True)
    error = Column(String(1000), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<WebhookLog(event='{self.event_type}', status={self.response_status})>"
