"""
RSA MVP Enhanced — Match Session & Result Models
==================================================
SQLAlchemy ORM models for matching operations.
Uses JSON columns for cross-database compatibility.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Float, Integer, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class MatchSession(Base):
    """Represents a matching session between candidates and a job."""
    
    __tablename__ = "match_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    job_id = Column(String(36), nullable=False)
    
    status = Column(String(20), default="pending")  # pending, processing, completed, failed
    config = Column(JSON, nullable=True)
    
    total_candidates = Column(Integer, default=0)
    processed_candidates = Column(Integer, default=0)
    
    # Company/auth context
    company_id = Column(String(36), nullable=True)
    created_by = Column(String(36), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    results = relationship("MatchResult", back_populates="session", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<MatchSession(id={self.id}, status='{self.status}')>"


class MatchResult(Base):
    """Individual match result for a candidate in a session."""
    
    __tablename__ = "match_results"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("match_sessions.id"), nullable=False)
    candidate_id = Column(String(36), nullable=False)
    
    # Multi-dimensional scores (0.0 to 1.0)
    overall_score = Column(Float, default=0.0)
    skill_score = Column(Float, default=0.0)
    experience_score = Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    semantic_score = Column(Float, default=0.0)
    
    # Detailed breakdown
    score_breakdown = Column(JSON, nullable=True)
    
    # Bias tracking
    bias_adjusted = Column(Boolean, default=False)
    
    # Ranking
    rank = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("MatchSession", back_populates="results")
    
    def __repr__(self):
        return f"<MatchResult(candidate={self.candidate_id}, score={self.overall_score})>"
