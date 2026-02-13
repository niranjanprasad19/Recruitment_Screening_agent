"""
Pytest configuration and fixtures for RSA MVP Enhanced tests.
Initializes test database before running tests.
"""

import os
import sys
from pathlib import Path

# Set test database BEFORE any other imports
os.environ["DATABASE_URL"] = "sqlite:///./test_session.db"
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")

# Add app to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Now import after env vars are set
import pytest
from app.database import Base, engine
from app import models  # noqa: F401
from app.main import app
from fastapi.testclient import TestClient


def pytest_configure(config):
    """
    Pytest hook - runs before test collection.
    Initialize database tables.
    """
    # Create all tables using the engine from database.py
    Base.metadata.create_all(bind=engine)
    print("\nTest database tables created")


@pytest.fixture
def client():
    """
    Provides a TestClient for API testing.
    """
    return TestClient(app)
