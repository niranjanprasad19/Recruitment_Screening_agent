# 🚀 Recruitment Screening Agent (RSA) — Enhanced MVP

An AI-powered recruitment screening system that compresses resumes and job descriptions using NLP, matches candidates efficiently, and reduces recruitment costs. Built with a **storytelling frontend** and a **robust, scalable backend**.

![RSA Architecture](docs/architecture.png)

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start (Docker)](#quick-start-docker)
- [Manual Setup](#manual-setup)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [License](#license)

---

## ✨ Features

- **Resume & JD Upload**: Drag-and-drop file uploads (PDF, DOCX, TXT)
- **AI Compression**: LangChain-powered NLP pipeline extracts and summarizes skills, experience, and qualifications into structured JSON
- **Semantic Matching**: Cosine similarity on sentence-transformer embeddings with customizable weights
- **Bias Mitigation**: Neutralizes gendered terms and demographic identifiers during processing
- **Interactive Dashboard**: Animated charts, metrics, and visual storytelling of the screening process
- **Match Journey Visualization**: React Flow diagrams showing JD → Compressed Resume → Match Breakdowns
- **Batch Processing**: Async processing for up to 100 resumes in < 5 minutes
- **ATS Integration**: Webhook-based notifications for Applicant Tracking Systems
- **Export Reports**: CSV/PDF export of ranked candidate lists
- **GDPR Compliant**: Data encryption, retention policies, and consent management

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI** | Async API framework with auto-docs |
| **LangChain** | Modular NLP pipelines |
| **Hugging Face Transformers** | Sentence embeddings (all-MiniLM-L6-v2) |
| **PostgreSQL** | Persistent data storage |
| **SQLAlchemy** | ORM for database operations |
| **Celery + Redis** | Async task queue for batch processing |

### Frontend
| Technology | Purpose |
|---|---|
| **React.js 18** | UI framework |
| **Framer Motion** | Storytelling animations & transitions |
| **React Flow** | Interactive matching visualizations |
| **Material-UI (MUI)** | Responsive component library |
| **Recharts** | Animated data charts |
| **Axios** | HTTP client for API calls |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker & Docker Compose** | Containerized deployment |
| **Nginx** | Reverse proxy (production) |

---

## 📁 Project Structure

```
rsa-mvp-enhanced/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entry
│   │   ├── config.py            # Configuration & environment
│   │   ├── database.py          # Database connection & sessions
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # Business logic layer
│   │   │   ├── parser.py        # Resume/JD file parsing
│   │   │   ├── compressor.py    # LangChain NLP compression
│   │   │   ├── matcher.py       # Semantic matching engine
│   │   │   ├── bias.py          # Bias detection & mitigation
│   │   │   └── reports.py       # Report generation
│   │   ├── tasks/               # Celery async tasks
│   │   └── utils/               # Shared utilities
│   ├── tests/                   # Unit & integration tests
│   ├── alembic/                 # Database migrations
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Page-level components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API service layer
│   │   ├── theme/               # MUI theme customization
│   │   └── App.jsx              # Root component
│   ├── public/
│   ├── package.json
│   └── Dockerfile
├── database/
│   └── init.sql                 # PostgreSQL initialization
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🐳 Quick Start (Docker)

1. **Clone and configure:**
   ```bash
   cd rsa-mvp-enhanced
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Start all services:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:8000](http://localhost:8000)
   - API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
   - API Docs (ReDoc): [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 🔧 Manual Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Database (PostgreSQL)

Ensure PostgreSQL is running locally or via Docker:
```bash
docker run -d --name rsa-postgres \
  -e POSTGRES_DB=rsa_db \
  -e POSTGRES_USER=rsa_user \
  -e POSTGRES_PASSWORD=rsa_password \
  -p 5432:5432 \
  postgres:15
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://rsa_user:rsa_password@localhost:5432/rsa_db` |
| `HUGGINGFACE_API_TOKEN` | Hugging Face API token | — |
| `OPENAI_API_KEY` | OpenAI API key (optional, for LangChain) | — |
| `SECRET_KEY` | JWT signing key | auto-generated |
| `REDIS_URL` | Redis connection for Celery | `redis://localhost:6379/0` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

---

## 📖 API Documentation

After starting the backend, visit:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/resumes/upload` | Upload resumes (PDF/DOCX/TXT) |
| `POST` | `/api/v1/jobs/upload` | Upload job descriptions |
| `POST` | `/api/v1/match/run` | Run matching engine |
| `GET` | `/api/v1/match/results/{job_id}` | Get match results |
| `GET` | `/api/v1/dashboard/metrics` | Dashboard analytics |
| `POST` | `/api/v1/reports/export` | Export reports (CSV/PDF) |
| `POST` | `/api/v1/webhooks/ats` | ATS webhook notifications |

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
