-- ===========================================
-- RSA MVP Enhanced — Database Initialization
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE file_status AS ENUM ('uploaded', 'parsing', 'parsed', 'compressing', 'compressed', 'error');
CREATE TYPE match_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE file_type AS ENUM ('resume', 'job_description');

-- ============================================
-- TABLES
-- ============================================

-- Jobs (Job Descriptions)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    company VARCHAR(300),
    department VARCHAR(200),
    original_text TEXT,
    compressed_data JSONB,          -- Structured JSON after NLP compression
    embedding BYTEA,                -- Serialized embedding vector
    required_skills TEXT[],
    preferred_skills TEXT[],
    experience_range VARCHAR(50),
    education_requirements TEXT,
    file_path VARCHAR(1000),
    file_type VARCHAR(20),
    status file_status DEFAULT 'uploaded',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days')
);

-- Candidates (Resumes)
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(300),
    email VARCHAR(300),
    phone VARCHAR(50),
    original_text TEXT,
    compressed_data JSONB,          -- Structured JSON after NLP compression
    embedding BYTEA,                -- Serialized embedding vector
    skills TEXT[],
    experience_years NUMERIC(4,1),
    education TEXT,
    file_path VARCHAR(1000),
    file_type VARCHAR(20),
    status file_status DEFAULT 'uploaded',
    bias_flags JSONB,               -- Any bias indicators detected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days')
);

-- Match Sessions
CREATE TABLE IF NOT EXISTS match_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status match_status DEFAULT 'pending',
    config JSONB DEFAULT '{
        "skill_weight": 0.4,
        "experience_weight": 0.3,
        "education_weight": 0.2,
        "semantic_weight": 0.1,
        "bias_check": true
    }'::jsonb,
    total_candidates INTEGER DEFAULT 0,
    processed_candidates INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Match Results
CREATE TABLE IF NOT EXISTS match_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    overall_score NUMERIC(5,4) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 1),
    skill_score NUMERIC(5,4) DEFAULT 0,
    experience_score NUMERIC(5,4) DEFAULT 0,
    education_score NUMERIC(5,4) DEFAULT 0,
    semantic_score NUMERIC(5,4) DEFAULT 0,
    score_breakdown JSONB,          -- Detailed scoring breakdown
    bias_adjusted BOOLEAN DEFAULT FALSE,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook Notifications
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    target_url VARCHAR(1000) NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    attempts INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_created ON candidates(created_at);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created ON jobs(created_at);
CREATE INDEX idx_match_results_session ON match_results(session_id);
CREATE INDEX idx_match_results_score ON match_results(overall_score DESC);
CREATE INDEX idx_match_sessions_job ON match_sessions(job_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- ============================================
-- DATA RETENTION POLICY (via pg_cron or manual)
-- ============================================
-- Run periodically: DELETE FROM candidates WHERE expires_at < NOW();
-- Run periodically: DELETE FROM jobs WHERE expires_at < NOW();

-- ============================================
-- TRIGGER: Auto-update `updated_at`
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_candidates_timestamp
    BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_timestamp
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
