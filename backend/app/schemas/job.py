"""
RSA MVP Enhanced — Job Description Pydantic Schemas
====================================================
Request/response validation for job endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class JobCreate(BaseModel):
    """Schema for creating a job description."""
    title: str = Field(..., min_length=1, max_length=500)
    company: Optional[str] = None
    department: Optional[str] = None
    description_text: Optional[str] = None


class JobCompressedData(BaseModel):
    """Schema for compressed/structured job description data."""
    summary: str = ""
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    responsibilities: List[str] = []
    experience_range: str = ""
    education_requirements: str = ""
    benefits: List[str] = []


class JobResponse(BaseModel):
    """Response schema for a single job description."""
    id: UUID
    title: str
    company: Optional[str] = None
    department: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    experience_range: Optional[str] = None
    education_requirements: Optional[str] = None
    status: str
    compressed_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    """Response schema for a list of jobs."""
    jobs: List[JobResponse]
    total: int
    page: int = 1
    per_page: int = 20
