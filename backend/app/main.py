"""
RSA MVP Enhanced — FastAPI Main Application
=============================================
Entry point for the Recruitment Screening Agent backend.
Configures CORS, includes all routers, and sets up startup events.
"""

import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import init_db
from app.routers import resumes, jobs, matching, dashboard, webhooks, auth, gdpr

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Startup
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    
    # Initialize database tables
    try:
        init_db()
        logger.info("✅ Database tables initialized")
    except Exception as e:
        logger.warning(f"⚠️ Database initialization skipped: {e}")
    
    # Create upload directory
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    logger.info(f"📁 Upload directory: {settings.UPLOAD_DIR}")
    
    yield  # Application runs here
    
    # Shutdown
    logger.info("🛑 Shutting down RSA MVP Enhanced")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="""
    ## 🎯 Recruitment Screening Agent — Enhanced MVP
    
    AI-powered recruitment screening system that:
    - **Compresses** resumes and job descriptions using NLP
    - **Matches** candidates with semantic similarity scoring
    - **Mitigates bias** in the screening process
    - **Reports** with exportable ranked candidate lists
    
    ### Key Endpoints
    - `/api/v1/resumes/` — Resume upload and management
    - `/api/v1/jobs/` — Job description management
    - `/api/v1/match/` — Matching engine operations
    - `/api/v1/dashboard/` — Analytics and metrics
    - `/api/v1/webhooks/` — ATS integration webhooks
    - `/api/v1/reports/` — Report generation and export
    - `/api/v1/gdpr/` — GDPR compliance and data management
    """,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware
cors_origins = settings.cors_origins
use_credentials = "*" not in cors_origins  # credentials can't be True with wildcard
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=use_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(resumes.router)
app.include_router(jobs.router)
app.include_router(matching.router)
app.include_router(dashboard.router)
app.include_router(webhooks.router)
app.include_router(auth.router)
app.include_router(gdpr.router)


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint — health check."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check endpoint."""
    health = {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "database": "unknown",
        "embedding_model": settings.EMBEDDING_MODEL,
    }
    
    # Check database
    try:
        from sqlalchemy import text
        from app.database import SessionLocal
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        health["database"] = "connected"
    except Exception as e:
        health["database"] = f"error: {str(e)}"
        health["status"] = "degraded"
    
    return health
