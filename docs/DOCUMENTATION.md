# 📘 Recruitment Screening Agent (RSA) — Project Documentation

> **Version:** 1.0.0 | **Last Updated:** February 2026  
> **GitHub:** [github.com/niranjanprasad119/Recruitment_Screening_agent](https://github.com/niranjanprasad119/Recruitment_Screening_agent)

---

## 📌 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [System Architecture](#3-system-architecture)
4. [Tech Stack](#4-tech-stack)
5. [Core Features](#5-core-features)
6. [NLP Pipeline — How It Works](#6-nlp-pipeline--how-it-works)
7. [Matching Engine — Algorithm Details](#7-matching-engine--algorithm-details)
8. [Bias Detection & Mitigation](#8-bias-detection--mitigation)
9. [API Reference](#9-api-reference)
10. [Frontend Pages & UI Flow](#10-frontend-pages--ui-flow)
11. [Database Schema](#11-database-schema)
12. [Deployment Guide](#12-deployment-guide)
13. [Testing](#13-testing)
14. [Security & Compliance](#14-security--compliance)
15. [Future Roadmap](#15-future-roadmap)

---

## 1. Project Overview

The **Recruitment Screening Agent (RSA)** is an AI-powered recruitment screening system that automates the resume-to-job-description matching process using Natural Language Processing (NLP). It compresses resumes and job descriptions into structured JSON representations, then uses **sentence-transformer embeddings** and **cosine similarity** for multi-dimensional semantic matching.

### Key Highlights
- ⚡ Processes **100 resumes in under 5 minutes** via async batch processing
- 🎯 Multi-dimensional scoring across **4 dimensions**: Skills, Experience, Education, Semantic Similarity
- 🛡️ Built-in **bias detection & mitigation** for fair candidate evaluation
- 📊 Interactive **storytelling dashboard** with animated visualizations
- 🔗 **ATS integration** via webhook-based notifications
- 📄 **CSV/PDF report export** for ranked candidate lists

---

## 2. Problem Statement

Traditional recruitment screening faces several challenges:

| Challenge | Impact |
|---|---|
| **Manual Resume Review** | Recruiters spend 6-8 seconds per resume, leading to missed candidates |
| **Unconscious Bias** | Gendered language, age indicators, and demographic info influence decisions |
| **Inconsistent Evaluation** | Different reviewers apply different criteria |
| **High Volume** | Enterprise roles receive 200+ applications on average |
| **Cost** | Average cost-per-hire is $4,129 (SHRM 2023) |

**RSA solves this** by automating the initial screening with consistent, explainable AI scoring while actively detecting and neutralizing bias indicators.

---

## 3. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        RSA Architecture                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐    ┌───────────────┐    ┌────────────────┐  │
│   │  React.js    │◄──►│  FastAPI       │◄──►│  PostgreSQL    │  │
│   │  Frontend    │    │  Backend       │    │  Database      │  │
│   │  (Port 3000) │    │  (Port 8000)   │    │  (Port 5432)   │  │
│   └──────────────┘    └───────┬───────┘    └────────────────┘  │
│                               │                                 │
│                        ┌──────┴──────┐                          │
│                        │             │                          │
│                   ┌────▼────┐  ┌─────▼─────┐                   │
│                   │ Celery  │  │  Redis     │                   │
│                   │ Workers │◄─┤  Broker    │                   │
│                   │         │  │ (Port 6379)│                   │
│                   └─────────┘  └───────────┘                   │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              NLP Processing Pipeline                     │  │
│   │  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐ │  │
│   │  │ Parser   │─►│ Compressor   │─►│ Matching Engine   │ │  │
│   │  │(PDF/DOCX)│  │ (LangChain)  │  │ (Embeddings +     │ │  │
│   │  │          │  │              │  │  Cosine Sim)       │ │  │
│   │  └──────────┘  └──────────────┘  └───────────────────┘ │  │
│   │                                                         │  │
│   │  ┌──────────────────┐  ┌───────────────────────────┐   │  │
│   │  │ Bias Detector    │  │ Report Generator          │   │  │
│   │  │ & Neutralizer    │  │ (CSV/PDF Export)           │   │  │
│   │  └──────────────────┘  └───────────────────────────┘   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                  Docker Compose                          │  │
│   │  5 Services: db, redis, backend, celery_worker, frontend │  │
│   └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Service Communication Flow
1. **Frontend** → Sends API requests via Axios to FastAPI backend
2. **Backend** → Processes requests, dispatches heavy tasks to Celery workers
3. **Celery Workers** → Execute NLP pipelines (compression, matching) asynchronously
4. **Redis** → Acts as message broker between FastAPI and Celery
5. **PostgreSQL** → Persists resumes, jobs, match results, and reports

---

## 4. Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **FastAPI** | 0.109+ | Async API framework with automatic OpenAPI docs |
| **LangChain** | 0.1+ | Modular NLP pipelines for text extraction |
| **Hugging Face Transformers** | — | Sentence embeddings (`all-MiniLM-L6-v2` model) |
| **PostgreSQL** | 15 | Relational database for persistent storage |
| **SQLAlchemy** | 2.0+ | ORM for database operations |
| **Celery** | 5.3+ | Distributed task queue for async processing |
| **Redis** | 7 | Message broker for Celery |
| **Alembic** | — | Database schema migrations |
| **Pydantic** | 2.0+ | Request/response validation schemas |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React.js** | 18.2 | Component-based UI framework |
| **Material-UI (MUI)** | 5.15 | Pre-built responsive component library |
| **Framer Motion** | 10.18 | Storytelling animations & page transitions |
| **React Flow** | 10.3 | Interactive flow diagrams for match visualization |
| **Recharts** | 2.10 | Animated data charts for the dashboard |
| **React Router** | 6.21 | Client-side routing & navigation |
| **Axios** | 1.6 | HTTP client for API communication |
| **React Dropzone** | 14.2 | Drag-and-drop file uploads |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker** | Containerization of all services |
| **Docker Compose** | Multi-container orchestration (5 services) |
| **Nginx** | Reverse proxy for production deployment |

---

## 5. Core Features

### 5.1 Resume & JD Upload
- Drag-and-drop file upload interface
- Supports **PDF**, **DOCX**, and **TXT** formats
- Real-time file validation and preview
- Batch upload for multiple resumes simultaneously

### 5.2 AI-Powered Compression (NLP Pipeline)
- **LangChain-powered** extraction pipeline
- Converts unstructured resume/JD text into structured JSON
- Extracts: skills, experience years, education, certifications, summary
- **Dual mode**: LLM-based (with API key) or rule-based fallback

### 5.3 Semantic Matching Engine
- **Sentence-transformer embeddings** using `all-MiniLM-L6-v2`
- **4-dimensional scoring** with customizable weights:
  - Skills (40%) — Fuzzy skill matching with required/preferred categorization
  - Experience (30%) — Years alignment with over/underqualified handling
  - Education (20%) — Hierarchical degree matching
  - Semantic Similarity (10%) — Cosine similarity on embeddings

### 5.4 Bias Detection & Mitigation
- Detects gendered language, age indicators, demographic data
- Auto-neutralizes biased terms (e.g., "chairman" → "chairperson")
- Pronoun distribution analysis
- Risk-level classification (low/medium/high)

### 5.5 Interactive Dashboard
- Animated metrics cards with Framer Motion
- Recharts-powered bar and radar charts
- Skills gap visualization
- Match score distribution graphs

### 5.6 Match Journey Visualization
- React Flow diagrams showing the complete pipeline:  
  `JD Upload → Compression → Embedding → Match Scoring → Results`
- Interactive node-based flowchart

### 5.7 Batch Processing
- Celery + Redis async task queue
- Process up to **100 resumes in < 5 minutes**
- Real-time progress tracking

### 5.8 ATS Integration
- Webhook-based notifications
- Sends match results to external Applicant Tracking Systems
- Configurable webhook URLs and authentication

### 5.9 Report Export
- **CSV export** of ranked candidate lists
- **PDF export** with detailed scoring breakdowns
- Filterable and sortable results

### 5.10 GDPR Compliance
- Data encryption at rest
- Configurable data retention policies
- Consent management for candidate data

---

## 6. NLP Pipeline — How It Works

```
Raw Text (Resume/JD)
       │
       ▼
┌─────────────────────┐
│  1. PARSING          │  Parser Service (parser.py)
│  PDF/DOCX → Text     │  Uses python-docx, PyPDF2 for extraction
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  2. BIAS NEUTRALIZE  │  Bias Service (bias.py)
│  Remove gendered     │  Pattern-based detection + replacement
│  terms, age markers  │  50+ gendered terms mapped to neutral
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  3. COMPRESSION      │  Compressor Service (compressor.py)
│  Text → Structured   │  LangChain chains OR rule-based fallback
│  JSON                │  Extracts: skills, experience, education
│                      │  120+ tech skills recognized
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  4. EMBEDDING        │  Matcher Service (matcher.py)
│  JSON → Vector       │  all-MiniLM-L6-v2 (384-dim vectors)
│  Representation      │  Cached model for fast inference
└──────────┬──────────┘
           ▼
┌─────────────────────┐
│  5. MATCHING         │  Multi-dimensional scoring
│  Score = weighted    │  Skills(0.4) + Exp(0.3) + Edu(0.2)
│  combination         │  + Semantic(0.1)
└─────────────────────┘
```

### Compression Output Example (Resume)
```json
{
  "skills": ["python", "react", "machine learning", "sql", "docker"],
  "total_experience_years": 4.5,
  "education": [
    {"degree": "B.Tech", "field": "Computer Science", "year": 2020}
  ],
  "certifications": ["AWS Certified Developer"],
  "summary": "Full-stack developer with 4.5 years of experience in Python, React, and ML"
}
```

---

## 7. Matching Engine — Algorithm Details

### 7.1 Skill Scoring (Weight: 40%)
```
Score = (matched_required / total_required) × 0.85 + preferred_bonus × 0.15
```
- **Exact matching** + **fuzzy matching** (substring-based)
- Separates required vs. preferred skills
- Reports: matched, missing, and extra skills

### 7.2 Experience Scoring (Weight: 30%)
| Scenario | Score |
|---|---|
| Within required range | 1.0 (perfect) |
| Overqualified | 0.6–1.0 (slight penalty: -0.05 per extra year) |
| Underqualified | 0.1–1.0 (proportional to min requirement) |
| No data | 0.1 |

### 7.3 Education Scoring (Weight: 20%)
- Hierarchical matching: PhD(5) > Master(4) > Bachelor(3) > Diploma(2) > Certificate(1)
- Meets/exceeds requirement → 1.0
- One level below → 0.7
- Further below → proportional score

### 7.4 Semantic Similarity (Weight: 10%)
```
similarity = 1.0 - cosine_distance(embedding_resume, embedding_jd)
```
- Uses `all-MiniLM-L6-v2` (384-dimensional vectors)
- Captures contextual meaning beyond keyword matching

---

## 8. Bias Detection & Mitigation

### Detected Bias Categories
| Category | Severity | Action |
|---|---|---|
| **Gendered Language** | Medium | Auto-replace (50+ mappings) |
| **Age Indicators** | High | Redact (DOB, age, birth year) |
| **Demographic Info** | High | Redact (gender, marital status, religion, ethnicity) |
| **Pronoun Distribution** | Informational | Statistical analysis (masculine:feminine ratio) |

### Risk Classification
- **Low**: No bias flags detected
- **Medium**: 1 high-severity or 3+ total flags
- **High**: 2+ high-severity flags

---

## 9. API Reference

**Base URL:** `http://localhost:8000`  
**Interactive Docs:** [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger) | [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Authenticate & receive JWT token |

### Resume Management
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/resumes/upload` | Upload resumes (PDF/DOCX/TXT) |
| `GET` | `/api/v1/resumes/` | List all uploaded resumes |
| `GET` | `/api/v1/resumes/{id}` | Get a specific resume |
| `DELETE` | `/api/v1/resumes/{id}` | Delete a resume |

### Job Description Management
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/jobs/upload` | Upload job descriptions |
| `GET` | `/api/v1/jobs/` | List all job descriptions |
| `GET` | `/api/v1/jobs/{id}` | Get a specific job |
| `DELETE` | `/api/v1/jobs/{id}` | Delete a job |

### Matching Engine
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/match/run` | Run matching engine |
| `GET` | `/api/v1/match/results/{job_id}` | Get match results for a job |

### Dashboard & Reports
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/dashboard/metrics` | Dashboard analytics data |
| `POST` | `/api/v1/reports/export` | Export reports (CSV/PDF) |

### Webhooks (ATS Integration)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/webhooks/ats` | Trigger ATS webhook notification |

### Health & System
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root health check |
| `GET` | `/health` | Detailed health check (DB, model status) |

---

## 10. Frontend Pages & UI Flow

```
Login Page  ──►  Dashboard  ──►  Upload Resumes  ──►  Job Descriptions
                    │                                        │
                    │              ┌──────────────────────────┘
                    ▼              ▼
               Results Page  ◄──  Run Matching
```

### Pages
| Page | File | Description |
|---|---|---|
| **Login** | `LoginPage.jsx` | Authentication with role-based access |
| **Dashboard** | `DashboardPage.jsx` | Animated metrics, charts, and overview |
| **Upload** | `UploadPage.jsx` | Drag-and-drop resume upload with preview |
| **Jobs** | `JobsPage.jsx` | Job description management |
| **Matching** | `MatchingPage.jsx` | Run matching engine with config options |
| **Results** | `ResultsPage.jsx` | Ranked candidates with export capabilities |

---

## 11. Database Schema

### Core Tables
```
┌─────────────────────┐     ┌──────────────────────┐
│     resumes          │     │    jobs               │
├─────────────────────┤     ├──────────────────────┤
│ id (PK)             │     │ id (PK)              │
│ filename            │     │ title                │
│ raw_text            │     │ raw_text             │
│ compressed_json     │     │ compressed_json      │
│ embedding (bytes)   │     │ embedding (bytes)    │
│ bias_report         │     │ required_skills[]    │
│ status              │     │ preferred_skills[]   │
│ created_at          │     │ experience_range     │
│ updated_at          │     │ status               │
└────────┬────────────┘     │ created_at           │
         │                  └──────────┬───────────┘
         │   ┌─────────────────────────┘
         ▼   ▼
┌──────────────────────┐
│   match_results       │
├──────────────────────┤
│ id (PK)              │
│ resume_id (FK)       │
│ job_id (FK)          │
│ overall_score        │
│ skill_score          │
│ experience_score     │
│ education_score      │
│ semantic_score       │
│ score_breakdown      │
│ created_at           │
└──────────────────────┘
```

---

## 12. Deployment Guide

### Docker Compose (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/niranjanprasad119/Recruitment_Screening_agent.git
cd Recruitment_Screening_agent/rsa-mvp-enhanced

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start all 5 services
docker-compose up --build

# 4. Access the application
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

### Environment Variables
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Auto | PostgreSQL connection string |
| `HUGGINGFACE_API_TOKEN` | Optional | HuggingFace API token |
| `OPENAI_API_KEY` | Optional | OpenAI key for LangChain LLM mode |
| `SECRET_KEY` | Auto | JWT signing key |
| `REDIS_URL` | Auto | Redis connection for Celery |
| `CORS_ORIGINS` | Auto | Allowed CORS origins |

---

## 13. Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v --cov=app
```

Test coverage includes:
- API endpoint tests (upload, matching, reports)
- NLP pipeline unit tests (compression, matching)
- Bias detection tests
- Database model tests

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 14. Security & Compliance

- **JWT Authentication**: Secure token-based auth for all API endpoints
- **CORS Configuration**: Restricted origins
- **Input Validation**: Pydantic schemas validate all request/response data
- **File Upload Security**: Format validation, size limits
- **GDPR Compliant**: Data encryption, retention policies, consent management
- **Bias Mitigation**: Active bias detection prevents discriminatory screening

---

## 15. Future Roadmap

| Feature | Status | Priority |
|---|---|---|
| Multi-language resume support | 🔜 Planned | High |
| Video resume analysis | 🔜 Planned | Medium |
| Slack/Teams integration | 🔜 Planned | Medium |
| Custom LLM fine-tuning | 🔜 Planned | High |
| Candidate feedback loop | 🔜 Planned | Medium |
| Role-based dashboard templates | 🔜 Planned | Low |

---

## 📄 License

MIT License — see [LICENSE](../LICENSE) for details.

---

> **Built with ❤️ using FastAPI, React.js, LangChain, and Hugging Face Transformers**
