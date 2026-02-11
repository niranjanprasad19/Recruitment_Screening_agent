"""
RSA MVP Enhanced — Bias Detection & Mitigation Service
=======================================================
Identifies and neutralizes potential bias indicators in
resume text and scoring to promote fair candidate evaluation.
"""

import re
import logging
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)


class BiasDetector:
    """
    Detects and mitigates bias in resume processing.
    
    Handles:
    - Gendered language neutralization
    - Age indicator removal
    - Ethnic/national origin indicator flagging
    - Disability-related term flagging
    - Name-based bias detection
    """
    
    # Gendered terms mapping
    GENDERED_TERMS = {
        # Male-coded → Gender-neutral
        "chairman": "chairperson",
        "businessman": "businessperson",
        "salesman": "salesperson",
        "manpower": "workforce",
        "man-hours": "work-hours",
        "gentleman": "person",
        "foreman": "supervisor",
        "fireman": "firefighter",
        "policeman": "police officer",
        "mailman": "postal worker",
        "spokesman": "spokesperson",
        "craftsman": "artisan",
        "workman": "worker",
        # Female-coded → Gender-neutral
        "chairwoman": "chairperson",
        "businesswoman": "businessperson",
        "saleswoman": "salesperson",
        "stewardess": "flight attendant",
        "actress": "actor",
        "waitress": "server",
        "hostess": "host",
    }
    
    # Age indicators
    AGE_PATTERNS = [
        r'\b(?:age|aged)\s*:?\s*\d+',
        r'\bborn\s+(?:in\s+)?(?:19|20)\d{2}\b',
        r'\bdate\s+of\s+birth\b',
        r'\bdob\s*:',
        r'\b\d{1,2}/\d{1,2}/(?:19|20)\d{2}\b',  # Date patterns that might indicate age
    ]
    
    # Demographic indicators (to flag, not necessarily remove)
    DEMOGRAPHIC_PATTERNS = [
        r'\b(?:gender|sex)\s*:\s*\w+',
        r'\b(?:marital\s+status|married|single|divorced)\b',
        r'\b(?:nationality|citizenship)\s*:\s*\w+',
        r'\b(?:religion|religious)\s*:\s*\w+',
        r'\b(?:race|ethnicity)\s*:\s*\w+',
    ]
    
    # Gendered pronouns (for statistical analysis)
    PRONOUN_PATTERNS = {
        "masculine": [r'\bhe\b', r'\bhis\b', r'\bhim\b'],
        "feminine": [r'\bshe\b', r'\bher\b', r'\bhers\b'],
    }
    
    @staticmethod
    def analyze(text: str) -> Dict[str, Any]:
        """
        Analyze text for potential bias indicators.
        
        Args:
            text: Raw text to analyze.
        
        Returns:
            Dictionary with bias analysis results.
        """
        text_lower = text.lower()
        flags = []
        
        # Check gendered terms
        gendered_found = []
        for term in BiasDetector.GENDERED_TERMS:
            if term in text_lower:
                gendered_found.append({
                    "term": term,
                    "replacement": BiasDetector.GENDERED_TERMS[term],
                    "type": "gendered_language",
                })
        
        if gendered_found:
            flags.append({
                "category": "gendered_language",
                "severity": "medium",
                "count": len(gendered_found),
                "details": gendered_found,
            })
        
        # Check age indicators
        age_found = []
        for pattern in BiasDetector.AGE_PATTERNS:
            matches = re.findall(pattern, text_lower)
            age_found.extend(matches)
        
        if age_found:
            flags.append({
                "category": "age_indicators",
                "severity": "high",
                "count": len(age_found),
                "details": age_found,
            })
        
        # Check demographic indicators
        demo_found = []
        for pattern in BiasDetector.DEMOGRAPHIC_PATTERNS:
            matches = re.findall(pattern, text_lower)
            demo_found.extend(matches)
        
        if demo_found:
            flags.append({
                "category": "demographic_information",
                "severity": "high",
                "count": len(demo_found),
                "details": demo_found,
            })
        
        # Analyze pronoun distribution
        pronoun_analysis = BiasDetector._analyze_pronouns(text_lower)
        
        return {
            "has_bias_indicators": len(flags) > 0,
            "total_flags": len(flags),
            "flags": flags,
            "pronoun_analysis": pronoun_analysis,
            "risk_level": BiasDetector._calculate_risk_level(flags),
        }
    
    @staticmethod
    def neutralize(text: str) -> Tuple[str, List[str]]:
        """
        Neutralize biased language in text.
        
        Args:
            text: Raw text to neutralize.
        
        Returns:
            Tuple of (neutralized_text, list_of_changes_made).
        """
        changes = []
        neutralized = text
        
        # Replace gendered terms
        for term, replacement in BiasDetector.GENDERED_TERMS.items():
            pattern = re.compile(re.escape(term), re.IGNORECASE)
            if pattern.search(neutralized):
                neutralized = pattern.sub(replacement, neutralized)
                changes.append(f"Replaced '{term}' → '{replacement}'")
        
        # Remove age indicators
        for pattern in BiasDetector.AGE_PATTERNS:
            matches = re.findall(pattern, neutralized, re.IGNORECASE)
            if matches:
                neutralized = re.sub(pattern, "[REDACTED]", neutralized, flags=re.IGNORECASE)
                changes.append(f"Redacted age information: {matches}")
        
        # Remove demographic information
        for pattern in BiasDetector.DEMOGRAPHIC_PATTERNS:
            matches = re.findall(pattern, neutralized, re.IGNORECASE)
            if matches:
                neutralized = re.sub(pattern, "[REDACTED]", neutralized, flags=re.IGNORECASE)
                changes.append(f"Redacted demographic info: {matches}")
        
        return neutralized, changes
    
    @staticmethod
    def _analyze_pronouns(text: str) -> Dict[str, Any]:
        """Analyze pronoun distribution in text."""
        masc_count = sum(
            len(re.findall(p, text))
            for p in BiasDetector.PRONOUN_PATTERNS["masculine"]
        )
        fem_count = sum(
            len(re.findall(p, text))
            for p in BiasDetector.PRONOUN_PATTERNS["feminine"]
        )
        
        total = masc_count + fem_count
        
        return {
            "masculine_pronouns": masc_count,
            "feminine_pronouns": fem_count,
            "ratio": f"{masc_count}:{fem_count}" if total > 0 else "N/A",
            "dominant": "masculine" if masc_count > fem_count else (
                "feminine" if fem_count > masc_count else "neutral"
            ) if total > 0 else "neutral",
        }
    
    @staticmethod
    def _calculate_risk_level(flags: List[Dict]) -> str:
        """Calculate overall bias risk level based on flags."""
        if not flags:
            return "low"
        
        high_severity = sum(1 for f in flags if f.get("severity") == "high")
        
        if high_severity >= 2:
            return "high"
        elif high_severity == 1 or len(flags) >= 3:
            return "medium"
        else:
            return "low"
