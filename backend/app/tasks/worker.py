"""
RSA MVP Enhanced — Celery Worker Configuration
================================================
Configures Celery for async background task processing.
Used for batch resume processing and matching operations.
"""

from celery import Celery
from app.config import settings

# Create Celery application
celery_app = Celery(
    "rsa_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max per task
    task_soft_time_limit=540,  # Soft limit at 9 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=100,
)


@celery_app.task(bind=True, max_retries=3)
def process_resume_task(self, candidate_id: str, file_path: str):
    """Celery task wrapper for resume processing."""
    try:
        from app.routers.resumes import process_resume_background
        process_resume_background(candidate_id, file_path, settings.DATABASE_URL)
    except Exception as e:
        self.retry(exc=e, countdown=30)


@celery_app.task(bind=True, max_retries=3)
def run_matching_task(self, session_id: str):
    """Celery task wrapper for matching session."""
    try:
        from app.routers.matching import run_matching_background
        run_matching_background(session_id, settings.DATABASE_URL)
    except Exception as e:
        self.retry(exc=e, countdown=30)


@celery_app.task
def cleanup_expired_data():
    """
    Periodic task to clean up expired data (GDPR compliance).
    Should be scheduled via celery-beat.
    """
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from datetime import datetime
    from app.models.candidate import Candidate
    from app.models.job import Job
    
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        now = datetime.utcnow()
        
        # Delete expired candidates
        expired_candidates = db.query(Candidate).filter(Candidate.expires_at < now).all()
        for c in expired_candidates:
            import os
            if c.file_path and os.path.exists(c.file_path):
                os.remove(c.file_path)
            db.delete(c)
        
        # Delete expired jobs
        expired_jobs = db.query(Job).filter(Job.expires_at < now).all()
        for j in expired_jobs:
            import os
            if j.file_path and os.path.exists(j.file_path):
                os.remove(j.file_path)
            db.delete(j)
        
        db.commit()
        return f"Cleaned up {len(expired_candidates)} candidates and {len(expired_jobs)} jobs"
    finally:
        db.close()
