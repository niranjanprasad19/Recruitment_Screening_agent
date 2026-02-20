# 🚀 Deployment Guide — RSA MVP Enhanced

This guide covers deploying the Recruitment Screening Agent (RSA) application — both **locally with Docker** and on the **cloud with a public URL**.

---

## 🌐 Cloud Deployment (Get a Public URL)

### Deploy on Render.com (FREE — Recommended for Submissions)

This gives you a **public link** like `https://rsa-frontend-xxxx.onrender.com` that anyone can access.

#### Step 1: Sign Up & Connect GitHub

1. Go to **[https://render.com](https://render.com)** and sign up (use GitHub login)
2. Connect your GitHub account

#### Step 2: Create PostgreSQL Database

1. Dashboard → **New** → **PostgreSQL**
2. Settings:
   - **Name**: `rsa-database`
   - **Database**: `rsa_db`
   - **User**: `rsa_user`
   - **Plan**: **Free**
3. Click **Create Database**
4. ⏳ Wait for it to become **Available**
5. **Copy the "Internal Database URL"** (starts with `postgresql://`) — you'll need this

#### Step 3: Create Redis

1. Dashboard → **New** → **Redis**
2. Settings:
   - **Name**: `rsa-redis`
   - **Plan**: **Free**
   - **Max Memory Policy**: `allkeys-lru`
3. Click **Create Redis**
4. **Copy the "Internal Redis URL"** (starts with `redis://`) — you'll need this

#### Step 4: Deploy the Backend

1. Dashboard → **New** → **Web Service**
2. Connect your GitHub repo: `Recruitment_Screening_agent`
3. Settings:
   - **Name**: `rsa-backend` (or any unique name)
   - **Root Directory**: `backend`
   - **Runtime**: **Docker**
   - **Plan**: **Free**
4. **Environment Variables** — Add these:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | *(paste the Internal Database URL from Step 2)* |
   | `REDIS_URL` | *(paste the Internal Redis URL from Step 3)* |
   | `SECRET_KEY` | `any-random-string-for-security-1234` |
   | `DEBUG` | `false` |
   | `BACKEND_CORS_ORIGINS` | `*` |

5. Click **Deploy Web Service**
6. ⏳ Wait for deploy to complete (5-10 minutes for first build)
7. **Copy your backend URL** — it will look like: `https://rsa-backend-xxxx.onrender.com`
8. **Verify**: Open `https://rsa-backend-xxxx.onrender.com/docs` — you should see Swagger API docs

#### Step 5: Deploy the Frontend

1. Dashboard → **New** → **Static Site**
2. Connect the **same** GitHub repo
3. Settings:
   - **Name**: `rsa-frontend` (or any unique name)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Publish Directory**: `build`
4. **Environment Variables** — Add this:

   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | *(paste your backend URL from Step 4, e.g. `https://rsa-backend-xxxx.onrender.com`)* |

5. Click **Create Static Site**
6. ⏳ Wait for build & deploy (3-5 minutes)

#### Step 6: Add Rewrite Rule (Important!)

1. Go to your frontend service → **Redirects/Rewrites**
2. Add a rewrite rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: **Rewrite**
3. Save — this enables React Router to work properly

#### ✅ Done!

Your app is live! Share this link:
```
https://rsa-frontend-xxxx.onrender.com
```

> **Note:** On Render's free plan, the backend **spins down after 15 minutes** of inactivity. The first visit after idle may take **30-60 seconds** to wake up. After that, it's fast.

---

### Architecture (Cloud)

```
                    Internet
                       │
        ┌──────────────┼──────────────┐
        │              │              │
  ┌─────▼─────┐  ┌────▼────┐  ┌─────▼─────┐
  │ Frontend  │  │ Backend │  │  API Docs  │
  │ (Static)  │──│ (Docker)│  │  /docs     │
  │ Render CDN│  │ Render  │  │            │
  └───────────┘  └────┬────┘  └────────────┘
                      │
              ┌───────┼───────┐
              │               │
        ┌─────▼─────┐  ┌─────▼─────┐
        │ PostgreSQL│  │   Redis   │
        │  (Free)   │  │  (Free)   │
        │  Render   │  │  Render   │
        └───────────┘  └───────────┘
```

---

## 🐳 Local Deployment (Docker Compose)

For local testing, use Docker Compose:

```powershell
# 1. Build and start everything
docker-compose up --build -d

# 2. Check all services are running
docker-compose ps
```

**Access locally:**
| Service | URL |
|---------|-----|
| **App** | [http://localhost:3000](http://localhost:3000) |
| **API Docs** | [http://localhost:3000/docs](http://localhost:3000/docs) |

---

## ⚙️ Configuration (.env)

For local Docker deployment, edit `.env` in the project root:

```env
POSTGRES_DB=rsa_db
POSTGRES_USER=rsa_user
POSTGRES_PASSWORD=rsa_password
SECRET_KEY=change-this-to-a-random-secret-key
DEBUG=false
HUGGINGFACE_API_TOKEN=
OPENAI_API_KEY=
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost
REACT_APP_API_URL=
```

After changing `.env`, rebuild:
```powershell
docker-compose down
docker-compose up --build -d
```

---

## 🛠️ Troubleshooting

### View Logs
```powershell
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Common Issues

| Problem | Solution |
|---------|----------|
| **Render backend sleeping** | Free tier spins down after 15 min idle — first request takes 30-60s |
| **Frontend can't reach API** | Check `REACT_APP_API_URL` is set to backend's full URL (including `https://`) |
| **CORS errors in browser** | Set `BACKEND_CORS_ORIGINS=*` in backend env vars |
| **Build fails on Render** | Check deploy logs in Render dashboard |
| **Port conflict locally** | Stop other apps on 3000/8000, or change ports in `docker-compose.yml` |

### Reset Local Database
```powershell
docker-compose down -v        # WARNING: deletes all data
docker-compose up --build -d
```

---

## 🔐 Security Checklist (Production)

- [ ] Change `SECRET_KEY` to a random string (32+ characters)
- [ ] Set `DEBUG=false`
- [ ] Set proper `BACKEND_CORS_ORIGINS` (your frontend domain, not `*`)
- [ ] Use strong database password
- [ ] Set AI API keys if using AI features
