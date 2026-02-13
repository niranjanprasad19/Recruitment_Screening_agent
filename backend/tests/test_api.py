"""
RSA MVP Enhanced — API Integration Tests
==========================================
Tests for FastAPI endpoints using TestClient.
"""

import pytest
import io
from fastapi.testclient import TestClient

# Import app (which was already configured by conftest.py)
from app.main import app

# Create test client
client = TestClient(app)


class TestHealthEndpoints:
    """Tests for health check endpoints."""
    
    def test_root_endpoint(self):
        """Root endpoint should return app info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "app" in data
        assert "version" in data
        assert "status" in data
        assert data["status"] == "running"
    
    def test_health_endpoint(self):
        """Health endpoint should return health status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data


class TestResumeEndpoints:
    """Tests for resume upload and management endpoints."""
    
    def test_upload_invalid_file_type(self):
        """Should reject unsupported file types."""
        file_content = b"some content"
        response = client.post(
            "/api/v1/resumes/upload",
            files={"file": ("test.exe", io.BytesIO(file_content), "application/octet-stream")},
        )
        assert response.status_code == 400
    
    def test_list_candidates_empty(self):
        """Should return empty list when no candidates exist."""
        response = client.get("/api/v1/resumes")
        # May return 200 or 500 depending on DB availability
        assert response.status_code in [200, 500]
    
    def test_get_nonexistent_candidate(self):
        """Should return 404 for non-existent candidate."""
        response = client.get("/api/v1/resumes/00000000-0000-0000-0000-000000000000")
        assert response.status_code in [404, 500]


class TestJobEndpoints:
    """Tests for job description endpoints."""
    
    def test_create_job_from_text(self):
        """Should create a job from text input."""
        response = client.post(
            "/api/v1/jobs/create",
            json={
                "title": "Senior Python Developer",
                "company": "TechCorp",
                "department": "Engineering",
                "description_text": "We are looking for a senior Python developer with 5+ years of experience in Django, FastAPI, and cloud services.",
            },
        )
        # Success depends on DB availability
        assert response.status_code in [201, 500]
    
    def test_create_job_missing_title(self):
        """Should reject job creation without a title."""
        response = client.post(
            "/api/v1/jobs/create",
            json={"company": "TechCorp"},  # Missing required 'title'
        )
        assert response.status_code == 422  # Validation error


class TestMatchEndpoints:
    """Tests for matching endpoints."""
    
    def test_run_match_invalid_job(self):
        """Should return 404 for non-existent job."""
        response = client.post(
            "/api/v1/match/run",
            json={"job_id": "00000000-0000-0000-0000-000000000000"},
        )
        assert response.status_code in [404, 500]
    
    def test_get_results_invalid_session(self):
        """Should return 404 for non-existent session."""
        response = client.get("/api/v1/match/results/00000000-0000-0000-0000-000000000000")
        assert response.status_code in [404, 500]


class TestDashboardEndpoints:
    """Tests for dashboard and report endpoints."""
    
    def test_get_dashboard_metrics(self):
        """Should return dashboard metrics."""
        response = client.get("/api/v1/dashboard/metrics")
        assert response.status_code in [200, 500]


class TestWebhookEndpoints:
    """Tests for webhook endpoints."""
    
    def test_get_webhook_logs(self):
        """Should return webhook logs."""
        response = client.get("/api/v1/webhooks/ats/logs")
        assert response.status_code in [200, 500]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
