-- ===========================================
-- RSA MVP Enhanced — Database Initialization
-- ===========================================
-- This script only sets up PostgreSQL extensions.
-- Table creation is handled by SQLAlchemy ORM models
-- via the application's startup lifecycle (init_db).
-- ===========================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
