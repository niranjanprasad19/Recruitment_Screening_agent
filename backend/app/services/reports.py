"""
RSA MVP Enhanced — Report Generation Service
==============================================
Generates CSV and PDF export reports for match results.
"""

import csv
import io
import json
import logging
from typing import List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generates downloadable reports from match results."""
    
    @staticmethod
    def generate_csv(results: List[Dict[str, Any]], job_title: str = "") -> str:
        """
        Generate a CSV report from match results.
        
        Args:
            results: List of match result dictionaries.
            job_title: Title of the job for the report header.
        
        Returns:
            CSV content as a string.
        """
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "Rank", "Candidate Name", "Email", "Overall Score",
            "Skill Score", "Experience Score", "Education Score",
            "Semantic Score", "Bias Adjusted", "Skills", "Experience (Years)"
        ])
        
        for result in results:
            writer.writerow([
                result.get("rank", ""),
                result.get("candidate_name", "N/A"),
                result.get("candidate_email", "N/A"),
                f"{result.get('overall_score', 0) * 100:.1f}%",
                f"{result.get('skill_score', 0) * 100:.1f}%",
                f"{result.get('experience_score', 0) * 100:.1f}%",
                f"{result.get('education_score', 0) * 100:.1f}%",
                f"{result.get('semantic_score', 0) * 100:.1f}%",
                "Yes" if result.get("bias_adjusted") else "No",
                ", ".join(result.get("candidate_skills", [])),
                result.get("candidate_experience_years", "N/A"),
            ])
        
        return output.getvalue()
    
    @staticmethod
    def generate_json_report(
        results: List[Dict[str, Any]],
        job_title: str = "",
        session_id: str = ""
    ) -> str:
        """
        Generate a JSON report from match results.
        
        Returns:
            JSON string with full report data.
        """
        report = {
            "report_metadata": {
                "generated_at": datetime.utcnow().isoformat(),
                "job_title": job_title,
                "session_id": session_id,
                "total_candidates": len(results),
            },
            "results": results,
            "summary": {
                "avg_score": sum(r.get("overall_score", 0) for r in results) / len(results) if results else 0,
                "max_score": max((r.get("overall_score", 0) for r in results), default=0),
                "min_score": min((r.get("overall_score", 0) for r in results), default=0),
            }
        }
        
        return json.dumps(report, indent=2, default=str)
    
    @staticmethod
    def generate_pdf(results: List[Dict[str, Any]], job_title: str = "") -> bytes:
        """
        Generate a PDF report from match results.
        
        Returns:
            PDF content as bytes.
        """
        try:
            from reportlab.lib.pagesizes import letter, A4
            from reportlab.lib import colors
            from reportlab.lib.units import inch
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet
            
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            elements = []
            styles = getSampleStyleSheet()
            
            # Title
            title = Paragraph(f"Candidate Match Report: {job_title}", styles["Title"])
            elements.append(title)
            elements.append(Spacer(1, 12))
            
            # Date
            date_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
            elements.append(Paragraph(f"Generated: {date_str}", styles["Normal"]))
            elements.append(Spacer(1, 24))
            
            # Table data
            table_data = [["Rank", "Candidate", "Overall", "Skills", "Exp", "Edu"]]
            for result in results[:50]:  # Limit to 50 for PDF
                table_data.append([
                    str(result.get("rank", "")),
                    result.get("candidate_name", "N/A")[:25],
                    f"{result.get('overall_score', 0) * 100:.1f}%",
                    f"{result.get('skill_score', 0) * 100:.1f}%",
                    f"{result.get('experience_score', 0) * 100:.1f}%",
                    f"{result.get('education_score', 0) * 100:.1f}%",
                ])
            
            table = Table(table_data, colWidths=[0.5*inch, 2*inch, 0.8*inch, 0.8*inch, 0.8*inch, 0.8*inch])
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6366f1")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8f9fa")]),
            ]))
            
            elements.append(table)
            doc.build(elements)
            
            return buffer.getvalue()
            
        except ImportError:
            logger.warning("reportlab not installed, cannot generate PDF")
            return b""
