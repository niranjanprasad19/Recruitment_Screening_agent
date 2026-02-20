# 🚀 Deployment Guide — RSA MVP Enhanced

This guide covers deploying the Recruitment Screening Agent (RSA) application using Docker Compose — both **locally** and on a **cloud server**.

---

## 📋 Prerequisites

- **Docker Desktop** (Windows/Mac) or **Docker Engine + Docker Compose** (Linux)
- **Git** (to clone/pull the repository)
- **Minimum 4 GB RAM** recommended (AI models are memory-intensive)

---

## ⚡ Quick Start (Local Production)

```powershell
# 1. Stop any running dev servers (ctrl+C existing npm/uvicorn terminals)

# 2. Navigate to project root
cd path/to/rsa-mvp-enhanced

# 3. Build and start all services
docker-compose up --build -d

# 4. Check that all containers are healthy
docker-compose ps
```

Wait 1–2 minutes for first build, then access:

| Service   | URL                                         |
|-----------|---------------------------------------------|
| **App**   | [http://localhost:3000](http://localhost:3000) |
| **API Docs** | [http://localhost:3000/docs](http://localhost:3000/docs) |
| **Backend Direct** | [http://localhost:8000/docs](http://localhost:8000/docs) |

> **Note:** The frontend at `:3000` proxies all `/api/` requests to the backend automatically via nginx.

---

## ⚙️ Configuration (.env)

A `.env` file is in the project root. Edit it to configure:

```env
# Database
POSTGRES_DB=rsa_db
POSTGRES_USER=rsa_user
POSTGRES_PASSWORD=rsa_password       # ← CHANGE in production!

# Security
SECRET_KEY=change-this-to-a-random-secret-key   # ← CHANGE this!
DEBUG=false

# AI API Keys (optional — set if you have them)
HUGGINGFACE_API_TOKEN=hf_your_token
OPENAI_API_KEY=sk-your-key

# CORS — add your production domain
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost,https://yourdomain.com

# Frontend — leave empty for Docker deployment
REACT_APP_API_URL=
```

After changing `.env`, rebuild:
```powershell
docker-compose down
docker-compose up --build -d
```

---

## 🏗️ Architecture (Docker)

```
┌─────────────────────────────────────────────────────────┐
│  Docker Network (rsa-network)                           │
│                                                         │
│  ┌──────────┐    ┌──────────┐    ┌──────────────────┐   │
│  │ Frontend │───▶│ Backend  │───▶│  PostgreSQL (db) │   │
│  │ (nginx)  │    │ (gunicorn│    │                  │   │
│  │ :80→3000 │    │  :8000)  │    │  :5432           │   │
│  └──────────┘    └────┬─────┘    └──────────────────┘   │
│       │               │                                  │
│       │          ┌────┴─────┐    ┌──────────────────┐   │
│       │          │  Celery  │───▶│   Redis           │   │
│       │          │  Worker  │    │   :6379           │   │
│       │          └──────────┘    └──────────────────┘   │
│       │                                                  │
└───────┼──────────────────────────────────────────────────┘
        │
   Browser → localhost:3000
```

**Key design:** Nginx serves the React app AND proxies `/api/` requests to the backend. This means the frontend and API are on the same origin — no CORS issues.

---

## ☁️ Cloud Deployment (AWS/Azure/DigitalOcean)

### Option A: Docker Compose on a VM

1. **Provision a VM** (Ubuntu 22.04, 4GB+ RAM recommended)
2. **Install Docker & Docker Compose:**
   ```bash
   sudo apt update && sudo apt install -y docker.io docker-compose
   sudo usermod -aG docker $USER
   ```
3. **Clone the repo:**
   ```bash
   git clone https://github.com/your-username/rsa-mvp-enhanced.git
   cd rsa-mvp-enhanced
   ```
4. **Edit `.env`** with production values (strong passwords, real API keys)
5. **Update CORS** in `.env`:
   ```env
   BACKEND_CORS_ORIGINS=http://YOUR_SERVER_IP:3000,https://yourdomain.com
   ```
6. **Deploy:**
   ```bash
   docker-compose up --build -d
   ```
7. **Open firewall port 3000** (or configure a reverse proxy on port 80/443)

### Option B: Railway / Render (PaaS)

For simpler deployment without managing servers:

1. Push to GitHub
2. Connect Railway/Render to your repo
3. Configure environment variables in their dashboard
4. Each service (backend, frontend, worker) runs as a separate service

---

## 🛠️ Maintenance & Troubleshooting

### View Logs
```powershell
# All logs (follow mode)
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f celery_worker
docker-compose logs -f db
docker-compose logs -f redis
```

### Check Container Health
```powershell
docker-compose ps
```
All services should show `Up (healthy)`.

### Database Migrations
```powershell
docker-compose exec backend alembic upgrade head
```

### Restart a Single Service
```powershell
docker-compose restart backend
```

### Full Rebuild (after code changes)
```powershell
docker-compose down
docker-compose up --build -d
```

### Reset Everything (including database)
```powershell
docker-compose down -v    # -v removes volumes (WARNING: deletes all data!)
docker-compose up --build -d
```

---

## 🐛 Common Issues

| Problem | Solution |
|---------|----------|
| **Port 3000/8000 already in use** | Stop other apps using those ports, or change ports in `docker-compose.yml` |
| **Frontend shows blank page** | Check `docker-compose logs frontend` — build may have failed |
| **API requests fail (CORS)** | Add your domain to `BACKEND_CORS_ORIGINS` in `.env` |
| **Database connection refused** | Wait for db healthcheck — check `docker-compose logs db` |
| **Out of memory during build** | Increase Docker Desktop memory limit to 4GB+ |
| **AI features not working** | Set `HUGGINGFACE_API_TOKEN` or `OPENAI_API_KEY` in `.env` |

---

## 🔐 Production Security Checklist

- [ ] Change `SECRET_KEY` to a random string (32+ characters)
- [ ] Change `POSTGRES_PASSWORD` to a strong password
- [ ] Set `DEBUG=false`
- [ ] Add your domain to `BACKEND_CORS_ORIGINS`
- [ ] Enable HTTPS (use a reverse proxy like Caddy or Traefik)
- [ ] Set API keys for AI features
- [ ] Restrict database port (remove `5432:5432` from compose if not needed externally)
- [ ] Restrict Redis port (remove `6379:6379` from compose if not needed externally)
