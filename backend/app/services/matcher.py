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
    def compute_title_score(
        candidate_experience: List[Dict[str, Any]],
        job_title: str
    ) -> Tuple[float, Dict[str, Any]]:
        """
        Score job title alignment based on past roles.
        """
        if not job_title:
            return 0.5, {"status": "No job title specified"}
        
        job_title_lower = job_title.lower()
        job_keywords = set(job_title_lower.split()) - {"senior", "junior", "lead", "staff", "principal", "manager", "ii", "iii", "developer", "engineer"}
        
        score = 0.0
        details = []
        
        # Check matching words in candidate's past titles
        for exp in candidate_experience:
            title = (exp.get("title") or "").lower()
            if not title:
                continue
                
            match_count = 0
            for word in title.split():
                if word in job_keywords:
                    match_count += 1
            
            # Simple keyword overlap score
            if match_count > 0:
                current_score = min(1.0, match_count / max(1, len(job_keywords)))
                # Bias towards recent experience? For now, max score across all roles
                score = max(score, current_score)
                details.append(f"{title} ({current_score:.2f})")
        
        # Boost if direct substring match
        for exp in candidate_experience:
             title = (exp.get("title") or "").lower()
             if job_title_lower in title or title in job_title_lower:
                 score = max(score, 0.9)
                 
        return round(score, 4), {"matches": details, "target": job_title}
    
        return round(score, 4), {"matches": details, "target": job_title}
    
    @staticmethod
    def _parse_duration_months(duration_str: str) -> int:
        """Helper to parse duration string (e.g. 'Jan 2020 - Present') into months."""
        import re
        from datetime import datetime
        
        if not duration_str:
            return 0
            
        # Try to find years
        years = re.findall(r'(19|20)\d{2}', duration_str)
        if len(years) >= 2:
            return (int(years[1]) - int(years[0])) * 12
        elif len(years) == 1 and ('present' in duration_str.lower() or 'current' in duration_str.lower()):
            start = int(years[0])
            now = datetime.now().year
            return (now - start) * 12
            
        return 12  # Default fallback if parsing fails (1 year)

    @staticmethod
    def compute_stability_score(experience: List[Dict[str, Any]]) -> Tuple[float, Dict[str, Any]]:
        """
        Score stability based on average tenure per job.
        Target: > 2 years per job is ideal. < 1 year is risky.
        """
        if not experience:
            return 0.5, {"status": "No experience data"}
            
        total_months = 0
        job_count = len(experience)
        
        for job in experience:
            total_months += MatchingEngine._parse_duration_months(job.get("duration", ""))
            
        avg_months = total_months / max(1, job_count)
        avg_years = avg_months / 12
        
        if avg_years >= 2.0:
            score = 1.0
            status = "High Stability (2+ years avg)"
        elif avg_years >= 1.5:
            score = 0.85
            status = "Good Stability"
        elif avg_years >= 1.0:
            score = 0.7
            status = "Average Stability"
        else:
            score = 0.4
            status = "Job Hopper Risk (<1 year avg)"
            
        return round(score, 4), {
            "avg_years": round(avg_years, 1),
            "job_count": job_count,
            "status": status
        }

    @staticmethod
    def compute_progression_score(experience: List[Dict[str, Any]]) -> Tuple[float, Dict[str, Any]]:
        """
        Score career progression/growth based on title hierarchy trend.
        """
        if not experience or len(experience) < 2:
            return 0.5, {"status": "Insufficient history for trend analysis"}
            
        # Hierarchy map
        levels = {
            "intern": 1, "trainee": 1,
            "junior": 2, "associate": 2, "analyst": 2,
            "senior": 3, "sr": 3, "consultant": 3,
            "lead": 4, "principal": 4, "staff": 4,
            "manager": 5, "head": 5, "director": 6, "vp": 7, "chief": 8
        }
        
        trajectory = []
        for job in experience: # Usually ordered most recent first?
            title_lower = (job.get("title") or "").lower()
            level = 0
            for code, rank in levels.items():
                if code in title_lower:
                    level = max(level, rank) # Take highest rank found
            trajectory.append(level)
            
        # Experience list usually [Current, Previous, Previous...]
        # So trajectory[0] is latest level.
        
        current_level = trajectory[0]
        past_levels = [l for l in trajectory[1:] if l > 0]
        
        if not past_levels:
             return 0.6, {"status": "Steady level inferred"}
             
        initial_level = past_levels[-1] # The oldest known
        
        if current_level > initial_level:
            score = 1.0
            status = "Clear Upward Growth"
        elif current_level == initial_level and current_level > 2:
            score = 0.8 # Senior staying senior is fine
            status = "Consistent Seniority"
        elif current_level < initial_level:
            score = 0.5
            status = "Detected Level Drop"
        else:
            score = 0.6
            status = "Lateral Moves"
            
        return round(score, 4), {"latest_level": current_level, "start_level": initial_level, "status": status}

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
            "skill_weight": 0.35,
            "experience_weight": 0.20,
            "education_weight": 0.10,
            "title_weight": 0.15,
            "stability_weight": 0.10,
            "growth_weight": 0.10,
            "semantic_weight": 0.0,
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
        
        # 4. Job Title matching
        title_score, title_breakdown = MatchingEngine.compute_title_score(
            candidate_data.get("experience", []),
            job_data.get("title", "")
        )
        
        # 5. Stability (Tenure)
        stability_score, stability_breakdown = MatchingEngine.compute_stability_score(
            candidate_data.get("experience", [])
        )
        
        # 6. Career Growth
        growth_score, growth_breakdown = MatchingEngine.compute_progression_score(
            candidate_data.get("experience", [])
        )
        
        # 7. Semantic similarity
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
            skill_score * config.get("skill_weight", 0.35) +
            exp_score * config.get("experience_weight", 0.20) +
            edu_score * config.get("education_weight", 0.10) +
            title_score * config.get("title_weight", 0.15) +
            stability_score * config.get("stability_weight", 0.10) +
            growth_score * config.get("growth_weight", 0.10) +
            semantic_score * config.get("semantic_weight", 0.0)
        )
        
        return {
            "overall_score": round(overall, 4),
            "skill_score": round(skill_score, 4),
            "experience_score": round(exp_score, 4),
            "education_score": round(edu_score, 4),
            "title_score": round(title_score, 4),
            "stability_score": round(stability_score, 4),
            "growth_score": round(growth_score, 4),
            "semantic_score": round(semantic_score, 4),
            "score_breakdown": {
                "skills": skill_breakdown,
                "experience": exp_breakdown,
                "education": edu_breakdown,
                "title": title_breakdown,
                "stability": stability_breakdown,
                "growth": growth_breakdown,
                "weights": config,
            },
        }
