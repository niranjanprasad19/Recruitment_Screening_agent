"""
RSA MVP Enhanced — NLP Compressor Service
==========================================
Uses LangChain to extract and summarize skills, experience,
and qualifications from raw text into structured JSON.
"""

import json
import logging
import re
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class ResumeCompressor:
    """
    Compresses resume text into a structured JSON format
    using LangChain chains and NLP extraction.
    
    For MVP, uses a rule-based fallback when LLM is unavailable.
    """
    
    # Common skills database for extraction
    TECH_SKILLS = {
        "python", "java", "javascript", "typescript", "c++", "c#", "ruby", "go", "rust",
        "swift", "kotlin", "php", "scala", "r", "matlab", "sql", "nosql", "html", "css",
        "react", "angular", "vue", "node.js", "express", "django", "flask", "fastapi",
        "spring", "docker", "kubernetes", "aws", "azure", "gcp", "terraform", "jenkins",
        "git", "linux", "mongodb", "postgresql", "mysql", "redis", "elasticsearch",
        "machine learning", "deep learning", "nlp", "computer vision", "data science",
        "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "spark", "hadoop",
        "agile", "scrum", "devops", "ci/cd", "microservices", "rest api", "graphql",
        "figma", "photoshop", "illustrator", "ui/ux", "project management",
        "communication", "leadership", "teamwork", "problem solving", "analytical",
    }
    
    EDUCATION_KEYWORDS = {
        "bachelor", "master", "phd", "doctorate", "mba", "b.tech", "m.tech",
        "b.sc", "m.sc", "b.e", "m.e", "b.a", "m.a", "diploma", "certificate",
        "university", "college", "institute", "school", "degree",
    }
    
    @staticmethod
    def compress_resume(text: str, use_llm: bool = False) -> Dict[str, Any]:
        """
        Compress resume text into structured JSON.
        
        Args:
            text: Raw resume text content.
            use_llm: Whether to use LLM-based extraction (requires API key).
        
        Returns:
            Structured dictionary with extracted resume data.
        """
        if use_llm:
            try:
                return ResumeCompressor._compress_with_langchain(text)
            except Exception as e:
                logger.warning(f"LLM compression failed, falling back to rules: {e}")
        
        return ResumeCompressor._compress_with_rules(text)
    
    @staticmethod
    def _compress_with_langchain(text: str) -> Dict[str, Any]:
        """Use LangChain to extract structured data from resume text."""
        from langchain.prompts import PromptTemplate
        from langchain.chains import LLMChain
        from langchain_community.llms import HuggingFaceHub
        from app.config import settings
        
        prompt_template = PromptTemplate(
            input_variables=["resume_text"],
            template="""
            Analyze the following resume text and extract structured information.
            Return a JSON object with these fields:
            - summary: A 2-3 sentence professional summary
            - skills: Array of technical and soft skills
            - experience: Array of objects with {{title, company, duration, description}}
            - education: Array of objects with {{degree, institution, year}}
            - certifications: Array of certification names
            - total_experience_years: Estimated total years of experience (number)
            
            Resume Text:
            {resume_text}
            
            Return ONLY valid JSON, no other text:
            """
        )
        
        llm = HuggingFaceHub(
            repo_id="google/flan-t5-large",
            huggingfacehub_api_token=settings.HUGGINGFACE_API_TOKEN,
            model_kwargs={"temperature": 0.1, "max_length": 1024}
        )
        
        chain = LLMChain(llm=llm, prompt=prompt_template)
        result = chain.run(resume_text=text[:3000])  # Limit input length
        
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            logger.warning("LLM returned invalid JSON, using rule-based extraction")
            return ResumeCompressor._compress_with_rules(text)
    
    @staticmethod
    def _compress_with_rules(text: str) -> Dict[str, Any]:
        """
        Rule-based extraction for MVP fallback.
        Uses regex patterns and keyword matching to extract structured data.
        """
        text_lower = text.lower()
        lines = text.strip().split("\n")
        
        # Extract skills
        found_skills = []
        for skill in ResumeCompressor.TECH_SKILLS:
            if skill.lower() in text_lower:
                found_skills.append(skill.title() if len(skill) > 3 else skill.upper())
        
        # Extract experience years
        experience_years = ResumeCompressor._extract_experience_years(text)
        
        # Extract education
        education = ResumeCompressor._extract_education(text)
        
        # Extract experience entries
        experience = ResumeCompressor._extract_experience(text)
        
        # Generate summary
        summary = ResumeCompressor._generate_summary(text, found_skills, experience_years)
        
        # Extract name (first non-empty line, typically)
        name = ""
        for line in lines:
            cleaned = line.strip()
            if cleaned and len(cleaned) < 60 and not any(c.isdigit() for c in cleaned[:5]):
                name = cleaned
                break
        
        return {
            "name": name,
            "summary": summary,
            "skills": found_skills,
            "experience": experience,
            "education": education,
            "certifications": ResumeCompressor._extract_certifications(text),
            "total_experience_years": experience_years,
        }
    
    @staticmethod
    def _extract_experience_years(text: str) -> float:
        """Extract total years of experience from text."""
        patterns = [
            r'(\d+)\+?\s*years?\s*(?:of\s+)?(?:experience|exp)',
            r'experience\s*:?\s*(\d+)\+?\s*years?',
            r'(\d+)\+?\s*years?\s+(?:in|of)\s+(?:software|development|engineering)',
        ]
        
        max_years = 0.0
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    years = float(match)
                    max_years = max(max_years, years)
                except ValueError:
                    continue
        
        return max_years
    
    @staticmethod
    def _extract_education(text: str) -> list:
        """Extract education entries from text."""
        education = []
        lines = text.split("\n")
        
        for i, line in enumerate(lines):
            line_lower = line.lower().strip()
            if any(kw in line_lower for kw in ResumeCompressor.EDUCATION_KEYWORDS):
                # Look for degree-like patterns
                degree_match = re.search(
                    r'(bachelor|master|phd|doctorate|mba|b\.?tech|m\.?tech|b\.?sc|m\.?sc|b\.?e|m\.?e|diploma)',
                    line_lower
                )
                if degree_match:
                    education.append({
                        "degree": line.strip(),
                        "institution": lines[i + 1].strip() if i + 1 < len(lines) else "",
                        "year": ResumeCompressor._extract_year_from_line(line),
                    })
        
        return education if education else [{"degree": "Not specified", "institution": "", "year": ""}]
    
    @staticmethod
    def _extract_experience(text: str) -> list:
        """Extract work experience entries from text."""
        experience = []
        lines = text.split("\n")
        
        # Look for common experience patterns
        current_entry = None
        for line in lines:
            line_stripped = line.strip()
            if not line_stripped:
                if current_entry:
                    experience.append(current_entry)
                    current_entry = None
                continue
            
            # Detect date patterns (indicative of experience entries)
            date_match = re.search(
                r'((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}|'
                r'\d{4}\s*[-–]\s*(?:\d{4}|present|current))',
                line_stripped,
                re.IGNORECASE
            )
            
            if date_match:
                if current_entry:
                    experience.append(current_entry)
                current_entry = {
                    "title": line_stripped,
                    "company": "",
                    "duration": date_match.group(),
                    "description": "",
                }
            elif current_entry:
                if not current_entry["company"]:
                    current_entry["company"] = line_stripped
                else:
                    current_entry["description"] += line_stripped + " "
        
        if current_entry:
            experience.append(current_entry)
        
        return experience[:5]  # Limit to top 5 entries
    
    @staticmethod
    def _extract_certifications(text: str) -> list:
        """Extract certifications from text."""
        cert_keywords = ["certified", "certification", "certificate", "aws", "azure", "gcp", 
                         "pmp", "scrum master", "cissp", "comptia"]
        certs = []
        
        for line in text.split("\n"):
            line_lower = line.lower().strip()
            if any(kw in line_lower for kw in cert_keywords) and len(line.strip()) < 200:
                certs.append(line.strip())
        
        return certs[:10]
    
    @staticmethod
    def _generate_summary(text: str, skills: list, years: float) -> str:
        """Generate a brief summary from extracted information."""
        skill_str = ", ".join(skills[:5]) if skills else "various technologies"
        years_str = f"{years:.0f}+ years" if years > 0 else "experience"
        
        return (
            f"Professional with {years_str} of experience. "
            f"Key skills include {skill_str}. "
            f"Resume contains {len(text.split())} words across {len(text.split(chr(10)))} sections."
        )
    
    @staticmethod
    def _extract_year_from_line(line: str) -> str:
        """Extract a 4-digit year from a line of text."""
        match = re.search(r'(19|20)\d{2}', line)
        return match.group() if match else ""


class JDCompressor:
    """
    Compresses job description text into a structured JSON format.
    """
    
    @staticmethod
    def compress_jd(text: str, use_llm: bool = False) -> Dict[str, Any]:
        """
        Compress job description text into structured JSON.
        
        Args:
            text: Raw job description text.
            use_llm: Whether to use LLM-based extraction.
        
        Returns:
            Structured dictionary with extracted JD data.
        """
        if use_llm:
            try:
                return JDCompressor._compress_with_langchain(text)
            except Exception as e:
                logger.warning(f"LLM compression failed for JD, falling back to rules: {e}")
        
        return JDCompressor._compress_with_rules(text)
    
    @staticmethod
    def _compress_with_langchain(text: str) -> Dict[str, Any]:
        """Use LangChain to extract structured data from JD text."""
        from langchain.prompts import PromptTemplate
        from langchain.chains import LLMChain
        from langchain_community.llms import HuggingFaceHub
        from app.config import settings
        
        prompt_template = PromptTemplate(
            input_variables=["jd_text"],
            template="""
            Analyze the following job description and extract structured information.
            Return a JSON object with these fields:
            - summary: A brief summary of the role
            - required_skills: Array of required technical skills
            - preferred_skills: Array of preferred/nice-to-have skills
            - responsibilities: Array of key responsibilities
            - experience_range: Expected experience range (e.g., "3-5 years")
            - education_requirements: Required education level
            - benefits: Array of benefits mentioned
            
            Job Description:
            {jd_text}
            
            Return ONLY valid JSON, no other text:
            """
        )
        
        llm = HuggingFaceHub(
            repo_id="google/flan-t5-large",
            huggingfacehub_api_token=settings.HUGGINGFACE_API_TOKEN,
            model_kwargs={"temperature": 0.1, "max_length": 1024}
        )
        
        chain = LLMChain(llm=llm, prompt=prompt_template)
        result = chain.run(jd_text=text[:3000])
        
        try:
            return json.loads(result)
        except json.JSONDecodeError:
            return JDCompressor._compress_with_rules(text)
    
    @staticmethod
    def _compress_with_rules(text: str) -> Dict[str, Any]:
        """Rule-based extraction for job descriptions."""
        text_lower = text.lower()
        
        # Extract skills from JD
        found_skills = []
        for skill in ResumeCompressor.TECH_SKILLS:
            if skill.lower() in text_lower:
                found_skills.append(skill.title() if len(skill) > 3 else skill.upper())
        
        # Split into required vs preferred
        required_marker = text_lower.find("required")
        preferred_marker = text_lower.find("preferred")
        nice_marker = text_lower.find("nice to have")
        
        required_skills = found_skills[:len(found_skills)//2 + 1] if found_skills else []
        preferred_skills = found_skills[len(found_skills)//2 + 1:] if found_skills else []
        
        # Extract experience range
        exp_match = re.search(r'(\d+)\s*[-–to]+\s*(\d+)\s*years?', text, re.IGNORECASE)
        exp_range = f"{exp_match.group(1)}-{exp_match.group(2)} years" if exp_match else ""
        if not exp_range:
            exp_single = re.search(r'(\d+)\+?\s*years?', text, re.IGNORECASE)
            exp_range = f"{exp_single.group(1)}+ years" if exp_single else "Not specified"
        
        # Extract education
        edu_req = ""
        for kw in ["bachelor", "master", "phd", "degree"]:
            if kw in text_lower:
                # Find the sentence containing the keyword
                for line in text.split("\n"):
                    if kw in line.lower():
                        edu_req = line.strip()
                        break
                break
        
        # Extract responsibilities (lines starting with - or • or numbered)
        responsibilities = []
        for line in text.split("\n"):
            line_stripped = line.strip()
            if line_stripped and (line_stripped[0] in "-•●" or re.match(r'^\d+[.)]\s', line_stripped)):
                responsibilities.append(line_stripped.lstrip("-•●0123456789.) "))
        
        # Generate summary
        summary = f"Position requiring {exp_range} of experience. "
        if required_skills:
            summary += f"Key skills: {', '.join(required_skills[:5])}."
        
        return {
            "summary": summary,
            "required_skills": required_skills,
            "preferred_skills": preferred_skills,
            "responsibilities": responsibilities[:10],
            "experience_range": exp_range,
            "education_requirements": edu_req or "Not specified",
            "benefits": [],
        }
