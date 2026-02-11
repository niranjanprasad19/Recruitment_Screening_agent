"""
RSA MVP Enhanced — Matching Engine Service
============================================
Semantic matching using sentence-transformer embeddings
with cosine similarity. Supports customizable weights
and multi-dimensional scoring.
"""

import numpy as np
import pickle
import logging
from typing import Dict, List, Any, Optional, Tuple
from scipy.spatial.distance import cosine

logger = logging.getLogger(__name__)

# Global model cache
_embedding_model = None


def get_embedding_model():
    """Lazy-load the sentence-transformer model (cached after first load)."""
    global _embedding_model
    if _embedding_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
            logger.info("Loaded sentence-transformer model: all-MiniLM-L6-v2")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
    return _embedding_model


class MatchingEngine:
    """
    Multi-dimensional matching engine that combines:
    1. Semantic similarity (sentence embeddings)
    2. Skill overlap scoring
    3. Experience alignment
    4. Education matching
    
    All scores are weighted and combined into a final match score.
    """
    
    @staticmethod
    def generate_embedding(text: str) -> bytes:
        """
        Generate a sentence embedding for the given text.
        
        Args:
            text: Input text to embed.
        
        Returns:
            Serialized numpy array as bytes.
        """
        model = get_embedding_model()
        # Truncate to model's max length
        truncated = text[:512]
        embedding = model.encode(truncated)
        return pickle.dumps(embedding)
    
    @staticmethod
    def compute_cosine_similarity(embedding_a: bytes, embedding_b: bytes) -> float:
        """
        Compute cosine similarity between two serialized embeddings.
        
        Returns:
            Similarity score between 0.0 and 1.0.
        """
        vec_a = pickle.loads(embedding_a)
        vec_b = pickle.loads(embedding_b)
        
        # cosine() returns distance, not similarity
        similarity = 1.0 - cosine(vec_a, vec_b)
        return max(0.0, min(1.0, similarity))
    
    @staticmethod
    def compute_skill_score(
        candidate_skills: List[str],
        required_skills: List[str],
        preferred_skills: List[str] = None
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Compute skill overlap score between candidate and job requirements.
        
        Uses fuzzy matching for skill comparison.
        
        Returns:
            Tuple of (score, breakdown_dict)
        """
        if not required_skills:
            return 0.5, {"matched": [], "missing": [], "extra": []}
        
        # Normalize skills to lowercase for comparison
        candidate_lower = {s.lower().strip() for s in (candidate_skills or [])}
        required_lower = {s.lower().strip() for s in required_skills}
        preferred_lower = {s.lower().strip() for s in (preferred_skills or [])}
        
        # Exact + fuzzy matching
        matched_required = candidate_lower & required_lower
        missing_required = required_lower - candidate_lower
        
        # Fuzzy matching for partial matches
        fuzzy_matches = set()
        for cs in candidate_lower:
            for rs in missing_required.copy():
                if cs in rs or rs in cs:
                    fuzzy_matches.add(rs)
                    missing_required.discard(rs)
        
        matched_required |= fuzzy_matches
        
        # Score calculation
        required_score = len(matched_required) / len(required_lower) if required_lower else 0
        
        # Bonus for preferred skills
        matched_preferred = candidate_lower & preferred_lower if preferred_lower else set()
        preferred_bonus = (len(matched_preferred) / len(preferred_lower) * 0.15) if preferred_lower else 0
        
        final_score = min(1.0, required_score * 0.85 + preferred_bonus)
        
        breakdown = {
            "matched_required": list(matched_required),
            "missing_required": list(missing_required),
            "matched_preferred": list(matched_preferred),
            "extra_skills": list(candidate_lower - required_lower - preferred_lower),
            "required_coverage": f"{len(matched_required)}/{len(required_lower)}",
        }
        
        return round(final_score, 4), breakdown
    
    @staticmethod
    def compute_experience_score(
        candidate_years: float,
        job_experience_range: str
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Score experience alignment.
        
        Returns:
            Tuple of (score, breakdown_dict)
        """
        import re
        
        # Parse job experience range
        range_match = re.search(r'(\d+)\s*[-–to]+\s*(\d+)', job_experience_range or "")
        single_match = re.search(r'(\d+)\+?', job_experience_range or "")
        
        if range_match:
            min_years = float(range_match.group(1))
            max_years = float(range_match.group(2))
        elif single_match:
            min_years = float(single_match.group(1))
            max_years = min_years + 3  # Default range
        else:
            # No requirement specified — neutral score
            return 0.5, {"status": "No experience requirement specified"}
        
        candidate_years = candidate_years or 0
        
        # Scoring logic
        if min_years <= candidate_years <= max_years:
            score = 1.0
            status = "Perfect match"
        elif candidate_years > max_years:
            # Overqualified — slight penalty
            overshoot = candidate_years - max_years
            score = max(0.6, 1.0 - (overshoot * 0.05))
            status = "Overqualified"
        elif candidate_years > 0:
            # Underqualified — proportional score
            score = max(0.1, candidate_years / min_years)
            status = "Underqualified"
        else:
            score = 0.1
            status = "No experience data"
        
        breakdown = {
            "candidate_years": candidate_years,
            "required_range": f"{min_years}-{max_years} years",
            "status": status,
        }
        
        return round(min(1.0, score), 4), breakdown
    
    @staticmethod
    def compute_education_score(
        candidate_education: str,
        job_education: str
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Score education alignment.
        
        Returns:
            Tuple of (score, breakdown_dict)
        """
        edu_hierarchy = {
            "phd": 5, "doctorate": 5,
            "master": 4, "mba": 4, "m.tech": 4, "m.sc": 4, "m.e": 4, "m.a": 4,
            "bachelor": 3, "b.tech": 3, "b.sc": 3, "b.e": 3, "b.a": 3,
            "diploma": 2, "associate": 2,
            "certificate": 1, "high school": 0,
        }
        
        candidate_edu = (candidate_education or "").lower()
        job_edu = (job_education or "").lower()
        
        # Find highest education level for candidate and job
        candidate_level = 0
        job_level = 0
        
        for keyword, level in edu_hierarchy.items():
            if keyword in candidate_edu:
                candidate_level = max(candidate_level, level)
            if keyword in job_edu:
                job_level = max(job_level, level)
        
        if job_level == 0:
            return 0.5, {"status": "No education requirement specified"}
        
        if candidate_level >= job_level:
            score = 1.0
            status = "Meets or exceeds requirement"
        elif candidate_level == job_level - 1:
            score = 0.7
            status = "Below requirement (close)"
        else:
            score = max(0.2, candidate_level / job_level)
            status = "Below requirement"
        
        breakdown = {
            "candidate_level": candidate_level,
            "job_level": job_level,
            "status": status,
        }
        
        return round(score, 4), breakdown
    
    @staticmethod
    def compute_match(
        candidate_data: Dict[str, Any],
        job_data: Dict[str, Any],
        candidate_embedding: bytes,
        job_embedding: bytes,
        config: Dict[str, float] = None
    ) -> Dict[str, Any]:
        """
        Compute the complete multi-dimensional match score.
        
        Args:
            candidate_data: Compressed candidate JSON data.
            job_data: Compressed job description JSON data.
            candidate_embedding: Serialized candidate embedding.
            job_embedding: Serialized job embedding.
            config: Weight configuration for scoring dimensions.
        
        Returns:
            Complete scoring result with breakdown.
        """
        config = config or {
            "skill_weight": 0.4,
            "experience_weight": 0.3,
            "education_weight": 0.2,
            "semantic_weight": 0.1,
        }
        
        # 1. Skill matching
        skill_score, skill_breakdown = MatchingEngine.compute_skill_score(
            candidate_data.get("skills", []),
            job_data.get("required_skills", []),
            job_data.get("preferred_skills", [])
        )
        
        # 2. Experience matching
        exp_score, exp_breakdown = MatchingEngine.compute_experience_score(
            candidate_data.get("total_experience_years", 0),
            job_data.get("experience_range", "")
        )
        
        # 3. Education matching
        edu_text = ""
        if candidate_data.get("education"):
            if isinstance(candidate_data["education"], list):
                edu_text = " ".join(
                    e.get("degree", "") for e in candidate_data["education"]
                )
            else:
                edu_text = str(candidate_data["education"])
        
        edu_score, edu_breakdown = MatchingEngine.compute_education_score(
            edu_text,
            job_data.get("education_requirements", "")
        )
        
        # 4. Semantic similarity
        semantic_score = 0.5  # Default
        if candidate_embedding and job_embedding:
            try:
                semantic_score = MatchingEngine.compute_cosine_similarity(
                    candidate_embedding, job_embedding
                )
            except Exception as e:
                logger.warning(f"Semantic similarity computation failed: {e}")
        
        # Weighted overall score
        overall = (
            skill_score * config["skill_weight"] +
            exp_score * config["experience_weight"] +
            edu_score * config["education_weight"] +
            semantic_score * config["semantic_weight"]
        )
        
        return {
            "overall_score": round(overall, 4),
            "skill_score": round(skill_score, 4),
            "experience_score": round(exp_score, 4),
            "education_score": round(edu_score, 4),
            "semantic_score": round(semantic_score, 4),
            "score_breakdown": {
                "skills": skill_breakdown,
                "experience": exp_breakdown,
                "education": edu_breakdown,
                "weights": config,
            },
        }
