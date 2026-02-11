"""
RSA MVP Enhanced — Candidate Pydantic Schemas
==============================================
Request/response validation for candidate endpoints.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class CandidateCreate(BaseModel):
    """Schema for creating a candidate (via text input, not file upload)."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    resume_text: Optional[str] = None


class CandidateCompressedData(BaseModel):
    """Schema for the compressed/structured resume data."""
    summary: str = ""
    skills: List[str] = []
    experience: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []
    certifications: List[str] = []
    total_experience_years: float = 0.0


class CandidateResponse(BaseModel):
    """Response schema for a single candidate."""
    id: UUID
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[float] = None
    education: Optional[str] = None
    status: str
    compressed_data: Optional[Dict[str, Any]] = None
    bias_flags: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CandidateListResponse(BaseModel):
    """Response schema for a list of candidates."""
    candidates: List[CandidateResponse]
    total: int
    page: int = 1
    per_page: int = 20
