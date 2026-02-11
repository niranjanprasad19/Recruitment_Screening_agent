"""
RSA MVP Enhanced — Dashboard Pydantic Schemas
===============================================
"""

from pydantic import BaseModel
from typing import List, Dict, Any


class DashboardMetrics(BaseModel):
    """Dashboard analytics response."""
    total_jobs: int = 0
    total_candidates: int = 0
    total_matches: int = 0
    avg_match_score: float = 0.0
    active_sessions: int = 0
    completed_sessions: int = 0
    
    # Chart data
    score_distribution: List[Dict[str, Any]] = []
    skill_frequency: List[Dict[str, Any]] = []
    matches_over_time: List[Dict[str, Any]] = []
    top_candidates: List[Dict[str, Any]] = []
    processing_stats: Dict[str, Any] = {}
