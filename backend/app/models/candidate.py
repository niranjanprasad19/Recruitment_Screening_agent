"""
RSA MVP Enhanced — Candidate (Resume) Model
============================================
SQLAlchemy ORM model for candidate/resume data.
Uses JSON columns for cross-database compatibility (SQLite + PostgreSQL).
"""

import uuid
from datetime import datetime, timedelta
from sqlalchemy import Column, String, Text, Float, DateTime, LargeBinary, JSON
from app.database import Base


class Candidate(Base):
    """Represents a candidate whose resume has been uploaded and processed."""
    
    __tablename__ = "candidates"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(300), nullable=True, default="")
    email = Column(String(300), nullable=True, default="")
    phone = Column(String(50), nullable=True, default="")
    
    # Original and processed content
    original_text = Column(Text, nullable=True)
    compressed_data = Column(JSON, nullable=True)   # Structured JSON from NLP
    embedding = Column(LargeBinary, nullable=True)   # Serialized vector
    
    # Extracted fields
    skills = Column(JSON, nullable=True)             # List of skills as JSON
    experience_years = Column(Float, nullable=True, default=0.0)
    education = Column(Text, nullable=True)
    
    # File metadata
    file_path = Column(String(1000), nullable=True)
    file_type = Column(String(20), nullable=True)
    file_name = Column(String(500), nullable=True)
    status = Column(String(20), default="uploaded")  # uploaded, parsing, parsed, compressing, compressed, error
    
    # Bias detection
    bias_flags = Column(JSON, nullable=True)
    
    # Company/auth context
    company_id = Column(String(36), nullable=True)
    uploaded_by = Column(String(36), nullable=True)
    
    # Timestamps & retention
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=90))
    
    def __repr__(self):
        return f"<Candidate(id={self.id}, name='{self.name}', status='{self.status}')>"
