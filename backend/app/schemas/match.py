"""
RSA MVP Enhanced — Match Pydantic Schemas
==========================================
Request/response validation for matching endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class MatchConfigSchema(BaseModel):
    """Configuration for the matching engine."""
    skill_weight: float = Field(0.4, ge=0, le=1, description="Weight for skill matching")
    experience_weight: float = Field(0.3, ge=0, le=1, description="Weight for experience matching")
    education_weight: float = Field(0.2, ge=0, le=1, description="Weight for education matching")
    semantic_weight: float = Field(0.1, ge=0, le=1, description="Weight for semantic similarity")
    bias_check: bool = Field(True, description="Enable bias detection and mitigation")


class MatchRequest(BaseModel):
    """Request to initiate a matching session."""
    job_id: UUID
    candidate_ids: Optional[List[UUID]] = None  # None means match all candidates
    config: Optional[MatchConfigSchema] = None


class MatchResultResponse(BaseModel):
    """Response for a single match result."""
    id: UUID
    candidate_id: UUID
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    overall_score: float
    skill_score: float
    experience_score: float
    education_score: float
    semantic_score: float
    score_breakdown: Optional[Dict[str, Any]] = None
    bias_adjusted: bool
    rank: Optional[int] = None
    # Candidate details for display
    candidate_skills: Optional[List[str]] = None
    candidate_experience_years: Optional[float] = None
    
    class Config:
        from_attributes = True


class MatchSessionResponse(BaseModel):
    """Response for a matching session."""
    id: UUID
    job_id: UUID
    job_title: Optional[str] = None
    status: str
    config: Optional[Dict[str, Any]] = None
    total_candidates: int
    processed_candidates: int
    progress_percent: float = 0.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    results: Optional[List[MatchResultResponse]] = None
    
    class Config:
        from_attributes = True


class MatchResultsListResponse(BaseModel):
    """Response for a list of match results."""
    session: MatchSessionResponse
    results: List[MatchResultResponse]
    total: int
