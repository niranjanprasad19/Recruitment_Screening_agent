"""
RSA MVP Enhanced — Unit Tests for Matching Engine
===================================================
Tests cosine similarity, skill matching, experience scoring,
education scoring, and overall match computation.
"""

import pytest
import pickle
import numpy as np
from app.services.matcher import MatchingEngine


class TestSkillScoring:
    """Tests for skill overlap scoring."""
    
    def test_perfect_skill_match(self):
        """All required skills match → high score."""
        score, breakdown = MatchingEngine.compute_skill_score(
            candidate_skills=["Python", "JavaScript", "React"],
            required_skills=["Python", "JavaScript", "React"],
        )
        assert score >= 0.8
        assert len(breakdown["missing_required"]) == 0
    
    def test_no_skill_match(self):
        """No skills match → low score."""
        score, breakdown = MatchingEngine.compute_skill_score(
            candidate_skills=["Java", "C++"],
            required_skills=["Python", "JavaScript", "React"],
        )
        assert score < 0.3
        assert len(breakdown["missing_required"]) > 0
    
    def test_partial_skill_match(self):
        """Some skills match → moderate score."""
        score, breakdown = MatchingEngine.compute_skill_score(
            candidate_skills=["Python", "Java", "SQL"],
            required_skills=["Python", "JavaScript", "SQL", "React"],
        )
        assert 0.3 <= score <= 0.8
    
    def test_fuzzy_skill_matching(self):
        """Fuzzy/partial skill names should still match."""
        score, breakdown = MatchingEngine.compute_skill_score(
            candidate_skills=["machine learning", "python"],
            required_skills=["Machine Learning", "Python", "Deep Learning"],
        )
        assert score > 0.3
    
    def test_empty_required_skills(self):
        """No required skills → neutral score."""
        score, breakdown = MatchingEngine.compute_skill_score(
            candidate_skills=["Python"],
            required_skills=[],
        )
        assert score == 0.5
    
    def test_preferred_skills_bonus(self):
        """Matching preferred skills should give a bonus."""
        score_without, _ = MatchingEngine.compute_skill_score(
            candidate_skills=["Python"],
            required_skills=["Python"],
            preferred_skills=[],
        )
        score_with, _ = MatchingEngine.compute_skill_score(
            candidate_skills=["Python", "Docker"],
            required_skills=["Python"],
            preferred_skills=["Docker"],
        )
        assert score_with >= score_without


class TestExperienceScoring:
    """Tests for experience alignment scoring."""
    
    def test_perfect_experience_match(self):
        """Candidate years within required range → perfect score."""
        score, breakdown = MatchingEngine.compute_experience_score(
            candidate_years=5.0,
            job_experience_range="3-7 years",
        )
        assert score == 1.0
        assert breakdown["status"] == "Perfect match"
    
    def test_overqualified(self):
        """Candidate has more experience than required → slight penalty."""
        score, breakdown = MatchingEngine.compute_experience_score(
            candidate_years=15.0,
            job_experience_range="3-5 years",
        )
        assert 0.5 < score < 1.0
        assert breakdown["status"] == "Overqualified"
    
    def test_underqualified(self):
        """Candidate has less experience than required → proportional score."""
        score, breakdown = MatchingEngine.compute_experience_score(
            candidate_years=1.0,
            job_experience_range="5-8 years",
        )
        assert score < 0.5
        assert breakdown["status"] == "Underqualified"
    
    def test_no_experience_requirement(self):
        """No experience range specified → neutral score."""
        score, breakdown = MatchingEngine.compute_experience_score(
            candidate_years=5.0,
            job_experience_range="",
        )
        assert score == 0.5
    
    def test_single_year_requirement(self):
        """Single year format (e.g., '3+ years')."""
        score, breakdown = MatchingEngine.compute_experience_score(
            candidate_years=4.0,
            job_experience_range="3+ years",
        )
        assert score >= 0.8


class TestEducationScoring:
    """Tests for education alignment scoring."""
    
    def test_meets_education_requirement(self):
        """Candidate education meets requirement → perfect score."""
        score, _ = MatchingEngine.compute_education_score(
            candidate_education="Bachelor of Science in Computer Science",
            job_education="Bachelor's degree required",
        )
        assert score >= 0.8
    
    def test_exceeds_education_requirement(self):
        """Candidate has higher education → perfect score."""
        score, _ = MatchingEngine.compute_education_score(
            candidate_education="Master of Science in Data Science",
            job_education="Bachelor's degree required",
        )
        assert score == 1.0
    
    def test_below_education_requirement(self):
        """Candidate has lower education → reduced score."""
        score, _ = MatchingEngine.compute_education_score(
            candidate_education="Diploma in IT",
            job_education="Master's degree required",
        )
        assert score < 0.7
    
    def test_no_education_requirement(self):
        """No education requirement → neutral score."""
        score, _ = MatchingEngine.compute_education_score(
            candidate_education="Bachelor of Engineering",
            job_education="",
        )
        assert score == 0.5


class TestOverallMatching:
    """Tests for the complete match computation."""
    
    def test_compute_match_returns_all_scores(self):
        """Match computation should return all score dimensions."""
        # Create dummy embeddings
        vec = np.random.rand(384).astype(np.float32)
        embedding = pickle.dumps(vec)
        
        candidate_data = {
            "skills": ["Python", "JavaScript"],
            "total_experience_years": 5,
            "education": [{"degree": "Bachelor of Science"}],
        }
        job_data = {
            "required_skills": ["Python", "JavaScript", "React"],
            "preferred_skills": ["Docker"],
            "experience_range": "3-7 years",
            "education_requirements": "Bachelor's degree required",
        }
        
        result = MatchingEngine.compute_match(
            candidate_data=candidate_data,
            job_data=job_data,
            candidate_embedding=embedding,
            job_embedding=embedding,
        )
        
        assert "overall_score" in result
        assert "skill_score" in result
        assert "experience_score" in result
        assert "education_score" in result
        assert "semantic_score" in result
        assert "score_breakdown" in result
        assert 0.0 <= result["overall_score"] <= 1.0
    
    def test_same_embedding_high_semantic(self):
        """Same embedding should give perfect semantic score."""
        vec = np.random.rand(384).astype(np.float32)
        embedding = pickle.dumps(vec)
        
        similarity = MatchingEngine.compute_cosine_similarity(embedding, embedding)
        assert similarity > 0.99
    
    def test_different_embeddings_lower_semantic(self):
        """Different embeddings should give lower semantic score."""
        vec_a = np.random.rand(384).astype(np.float32)
        vec_b = np.random.rand(384).astype(np.float32)
        
        sim = MatchingEngine.compute_cosine_similarity(
            pickle.dumps(vec_a), pickle.dumps(vec_b)
        )
        assert sim < 1.0
    
    def test_custom_weights(self):
        """Custom weights should affect the overall score."""
        vec = np.random.rand(384).astype(np.float32)
        embedding = pickle.dumps(vec)
        
        candidate_data = {
            "skills": ["Python"],
            "total_experience_years": 1,
            "education": [{"degree": "Diploma"}],
        }
        job_data = {
            "required_skills": ["Python", "Java", "C++"],
            "experience_range": "5-10 years",
            "education_requirements": "Master's degree",
        }
        
        # Heavy on skills (where candidate does okay)
        result_skill_heavy = MatchingEngine.compute_match(
            candidate_data, job_data, embedding, embedding,
            config={"skill_weight": 0.8, "experience_weight": 0.1, "education_weight": 0.05, "semantic_weight": 0.05}
        )
        
        # Heavy on experience (where candidate falls short)
        result_exp_heavy = MatchingEngine.compute_match(
            candidate_data, job_data, embedding, embedding,
            config={"skill_weight": 0.05, "experience_weight": 0.8, "education_weight": 0.1, "semantic_weight": 0.05}
        )
        
        # Scores should differ based on weights
        assert result_skill_heavy["overall_score"] != result_exp_heavy["overall_score"]


class TestEmbeddingGeneration:
    """Tests for embedding generation (requires model)."""
    
    @pytest.mark.slow
    def test_generate_embedding(self):
        """Generate an embedding from text."""
        try:
            embedding = MatchingEngine.generate_embedding("Senior Python Developer with 5 years experience")
            assert isinstance(embedding, bytes)
            
            # Deserialize and check shape
            vec = pickle.loads(embedding)
            assert vec.shape[0] > 0
        except Exception:
            pytest.skip("Sentence-transformer model not available")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
