"""
RSA MVP Enhanced — Tests for compressor (NLP extraction)
"""

import pytest
from app.services.compressor import ResumeCompressor, JDCompressor


class TestResumeCompressor:
    """Tests for resume compression service."""
    
    SAMPLE_RESUME = """
    John Smith
    Senior Software Engineer
    john.smith@email.com | (555) 123-4567
    
    PROFESSIONAL SUMMARY
    Experienced software engineer with 8+ years of experience in Python, JavaScript, 
    and cloud technologies. Proven track record in building scalable applications.
    
    SKILLS
    Python, JavaScript, React, Node.js, AWS, Docker, PostgreSQL, MongoDB, 
    Machine Learning, Agile, Git
    
    EXPERIENCE
    Senior Software Engineer - TechCorp Inc
    January 2020 - Present
    - Led development of microservices architecture serving 1M+ users
    - Implemented CI/CD pipelines reducing deployment time by 60%
    
    Software Engineer - StartupXYZ
    June 2016 - December 2019
    - Built full-stack web applications using React and Django
    - Managed PostgreSQL databases and Redis caching layers
    
    EDUCATION
    Bachelor of Science in Computer Science
    MIT - 2016
    
    CERTIFICATIONS
    AWS Certified Solutions Architect
    """
    
    def test_compress_extracts_skills(self):
        """Should extract skills from resume text."""
        result = ResumeCompressor.compress_resume(self.SAMPLE_RESUME)
        assert len(result["skills"]) > 0
        # Check for specific skills that should be found
        skills_lower = [s.lower() for s in result["skills"]]
        assert any("python" in s for s in skills_lower)
    
    def test_compress_extracts_experience_years(self):
        """Should extract experience years."""
        result = ResumeCompressor.compress_resume(self.SAMPLE_RESUME)
        assert result["total_experience_years"] >= 5
    
    def test_compress_generates_summary(self):
        """Should generate a summary."""
        result = ResumeCompressor.compress_resume(self.SAMPLE_RESUME)
        assert len(result["summary"]) > 0
    
    def test_compress_extracts_education(self):
        """Should extract education information."""
        result = ResumeCompressor.compress_resume(self.SAMPLE_RESUME)
        assert len(result["education"]) > 0
    
    def test_compress_extracts_certifications(self):
        """Should extract certifications."""
        result = ResumeCompressor.compress_resume(self.SAMPLE_RESUME)
        assert len(result["certifications"]) > 0
    
    def test_compress_handles_empty_text(self):
        """Should handle empty text gracefully."""
        result = ResumeCompressor.compress_resume("")
        assert isinstance(result, dict)
        assert "skills" in result
    
    def test_compress_returns_dict(self):
        """Should return a dictionary with expected keys."""
        result = ResumeCompressor.compress_resume(self.SAMPLE_RESUME)
        expected_keys = ["summary", "skills", "experience", "education", "certifications", "total_experience_years"]
        for key in expected_keys:
            assert key in result


class TestJDCompressor:
    """Tests for job description compression."""
    
    SAMPLE_JD = """
    Senior Python Developer
    TechCorp Inc - Engineering Department
    
    We are looking for an experienced Senior Python Developer to join our 
    growing engineering team.
    
    Required Skills:
    - Python (5+ years)
    - Django or FastAPI
    - PostgreSQL
    - Docker
    - AWS or GCP
    
    Nice to Have:
    - Machine Learning experience
    - Kubernetes
    - React
    
    Responsibilities:
    - Design and implement scalable backend services
    - Mentor junior developers
    - Participate in code reviews
    - Collaborate with product team on feature requirements
    
    Requirements:
    - 5-8 years of software development experience
    - Bachelor's degree in Computer Science or related field
    - Strong problem-solving skills
    
    Benefits:
    - Competitive salary
    - Remote work options
    - Health insurance
    """
    
    def test_compress_extracts_required_skills(self):
        """Should extract required skills from JD."""
        result = JDCompressor.compress_jd(self.SAMPLE_JD)
        assert len(result["required_skills"]) > 0
    
    def test_compress_extracts_experience_range(self):
        """Should extract experience range."""
        result = JDCompressor.compress_jd(self.SAMPLE_JD)
        assert result["experience_range"] != ""
    
    def test_compress_extracts_responsibilities(self):
        """Should extract responsibilities."""
        result = JDCompressor.compress_jd(self.SAMPLE_JD)
        assert len(result["responsibilities"]) > 0
    
    def test_compress_returns_expected_structure(self):
        """Should return dict with all expected keys."""
        result = JDCompressor.compress_jd(self.SAMPLE_JD)
        expected_keys = ["summary", "required_skills", "preferred_skills",
                         "responsibilities", "experience_range", "education_requirements"]
        for key in expected_keys:
            assert key in result


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
