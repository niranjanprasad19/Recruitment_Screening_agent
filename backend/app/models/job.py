"""
RSA MVP Enhanced — Job Description Model
==========================================
SQLAlchemy ORM model for job descriptions.
Uses JSON columns for cross-database compatibility.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, DateTime, LargeBinary, JSON
from app.database import Base


class Job(Base):
    """Represents a job description for candidate matching."""
    
    __tablename__ = "jobs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(500), nullable=False)
    company = Column(String(300), nullable=True, default="")
    department = Column(String(200), nullable=True, default="")
    location = Column(String(300), nullable=True, default="")
    
    # Original and processed content
    original_text = Column(Text, nullable=True)
    compressed_data = Column(JSON, nullable=True)
    embedding = Column(LargeBinary, nullable=True)
    
    # Extracted fields
    required_skills = Column(JSON, nullable=True)    # List of required skills
    preferred_skills = Column(JSON, nullable=True)   # List of preferred skills
    experience_range = Column(String(50), nullable=True)  # e.g. "3-5"
    education_requirement = Column(String(200), nullable=True)
    salary_range = Column(String(100), nullable=True)
    
    # Status
    status = Column(String(20), default="uploaded")  # uploaded, processing, compressed, error
    is_active = Column(String(5), default="true")    # Whether job is currently active
    
    # Company/auth context
    company_id = Column(String(36), nullable=True)
    created_by = Column(String(36), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Job(id={self.id}, title='{self.title}', status='{self.status}')>"
