"""
RSA MVP Enhanced — Unit Tests for Bias Detection
==================================================
"""

import pytest
from app.services.bias import BiasDetector


class TestBiasDetection:
    """Tests for the bias detection service."""
    
    def test_detect_gendered_language(self):
        """Should detect gendered terms in text."""
        text = "The chairman led the team. The salesman managed accounts."
        analysis = BiasDetector.analyze(text)
        
        assert analysis["has_bias_indicators"] is True
        assert any(f["category"] == "gendered_language" for f in analysis["flags"])
    
    def test_detect_age_indicators(self):
        """Should detect age-related information."""
        text = "John Smith, age: 35, born in 1990. Date of birth: 01/15/1990."
        analysis = BiasDetector.analyze(text)
        
        assert analysis["has_bias_indicators"] is True
        assert any(f["category"] == "age_indicators" for f in analysis["flags"])
    
    def test_detect_demographic_info(self):
        """Should detect demographic information."""
        text = "Marital status: Married. Nationality: American."
        analysis = BiasDetector.analyze(text)
        
        assert analysis["has_bias_indicators"] is True
        assert any(f["category"] == "demographic_information" for f in analysis["flags"])
    
    def test_clean_text_no_bias(self):
        """Clean text should not trigger bias detection."""
        text = "Experienced software engineer with 5 years in Python development."
        analysis = BiasDetector.analyze(text)
        
        assert analysis["has_bias_indicators"] is False
        assert analysis["risk_level"] == "low"
    
    def test_neutralize_gendered_terms(self):
        """Should replace gendered terms with neutral alternatives."""
        text = "The chairman of the board and the fireman responded quickly."
        neutralized, changes = BiasDetector.neutralize(text)
        
        assert "chairperson" in neutralized.lower()
        assert "firefighter" in neutralized.lower()
        assert len(changes) >= 2
    
    def test_redact_age_info(self):
        """Should redact age-related information."""
        text = "Candidate is age: 42 with 15 years experience."
        neutralized, changes = BiasDetector.neutralize(text)
        
        assert "[REDACTED]" in neutralized
    
    def test_risk_level_calculation(self):
        """Risk level should escalate with more flags."""
        # No flags = low
        assert BiasDetector._calculate_risk_level([]) == "low"
        
        # One medium flag
        assert BiasDetector._calculate_risk_level([
            {"severity": "medium"}
        ]) == "low"
        
        # One high flag
        assert BiasDetector._calculate_risk_level([
            {"severity": "high"}
        ]) == "medium"
        
        # Multiple high flags
        assert BiasDetector._calculate_risk_level([
            {"severity": "high"},
            {"severity": "high"},
        ]) == "high"
    
    def test_pronoun_analysis(self):
        """Should analyze pronoun distribution."""
        text = "He led his team effectively. She managed her department well."
        analysis = BiasDetector.analyze(text)
        
        pronouns = analysis["pronoun_analysis"]
        assert pronouns["masculine_pronouns"] > 0
        assert pronouns["feminine_pronouns"] > 0


class TestBiasNeutralization:
    """Tests for text neutralization."""
    
    def test_preserves_non_biased_content(self):
        """Neutralization should preserve unbiased content."""
        text = "Python developer with experience in machine learning and data science."
        neutralized, changes = BiasDetector.neutralize(text)
        
        assert "Python" in neutralized
        assert "machine learning" in neutralized
        assert len(changes) == 0
    
    def test_case_insensitive_replacement(self):
        """Should handle case-insensitive replacements."""
        text = "The CHAIRMAN approved the project."
        neutralized, changes = BiasDetector.neutralize(text)
        
        assert "chairman" not in neutralized.lower() or "chairperson" in neutralized.lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
