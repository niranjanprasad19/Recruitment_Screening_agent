"""
RSA MVP Enhanced — Database Connection
=======================================
SQLAlchemy engine, session management, and base model.
Automatically detects SQLite vs PostgreSQL from DATABASE_URL.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Fix Render's postgres:// URL to postgresql:// (required by SQLAlchemy 2.x)
DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Detect database type
is_sqlite = DATABASE_URL.startswith("sqlite")

# Create engine with appropriate config
engine_kwargs = {}
if is_sqlite:
    # SQLite needs check_same_thread = False for FastAPI
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL with connection pooling
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    engine_kwargs["pool_pre_ping"] = True

engine = create_engine(
    DATABASE_URL,
    echo=settings.DEBUG,
    **engine_kwargs,
)

# Enable WAL mode for SQLite (better concurrency)
if is_sqlite:
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()


def get_db():
    """
    Dependency that provides a database session.
    Ensures proper cleanup after each request.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables defined in models."""
    # Import all models so they register with Base
    from app.models import candidate, job, match, audit, webhook, user  # noqa
    Base.metadata.create_all(bind=engine)
