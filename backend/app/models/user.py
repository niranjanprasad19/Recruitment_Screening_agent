"""
RSA MVP Enhanced — User Model & Auth
======================================
User model for role-based authentication.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean
from app.database import Base


class User(Base):
    """User model for authentication."""
    
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(300), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
    name = Column(String(300), nullable=False)
    
    # Role: admin, recruiter, hiring_manager, viewer
    role = Column(String(30), default="recruiter")
    
    # Company isolation
    company_id = Column(String(36), nullable=True)
    company_name = Column(String(300), nullable=True)
    
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<User(email='{self.email}', role='{self.role}')>"
