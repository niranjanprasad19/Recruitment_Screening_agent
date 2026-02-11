"""
RSA MVP Enhanced — Report Pydantic Schemas
===========================================
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID


class ReportRequest(BaseModel):
    """Request to generate an export report."""
    session_id: UUID
    format: str = Field("csv", pattern="^(csv|pdf|json)$")
    top_n: Optional[int] = Field(None, ge=1, le=100, description="Top N candidates to include")


class ReportResponse(BaseModel):
    """Response containing the generated report metadata."""
    session_id: UUID
    format: str
    file_url: str
    total_candidates: int
    generated_at: str
