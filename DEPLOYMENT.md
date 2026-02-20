# 🚀 Deployment Guide — RSA MVP Enhanced

Deploy the Recruitment Screening Agent to the cloud and get a **public URL** for submission.

---

## 🌐 Deploy on Render.com (FREE)

### Step 1: Sign Up
1. Go to **[https://render.com](https://render.com)**
2. Click **"Get Started for Free"** → Sign up with **GitHub**

### Step 2: Create PostgreSQL Database
1. Dashboard → **"New +"** → **"PostgreSQL"**
2. Settings:
   - **Name**: `rsa-database`
   - **Database**: `rsa_db`
   - **User**: `rsa_user`
   - **Region**: Singapore
   - **Plan**: **Free**
3. Click **"Create Database"**
4. Wait until status shows **✅ Available**
5. **Copy the "Internal Database URL"** (you'll need this next)

### Step 3: Deploy Backend
1. Dashboard → **"New +"** → **"Web Service"**
2. Connect your GitHub repo → Select `Recruitment_Screening_agent`
3. Settings:
   - **Name**: `rsa-backend`
   - **Root Directory**: `backend`
   - **Runtime**: **Docker**
   - **Plan**: **Free**
4. Add **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | *(paste the Internal Database URL from Step 2)* |
   | `SECRET_KEY` | `rsa-prod-secret-2026` |
   | `DEBUG` | `false` |
   | `BACKEND_CORS_ORIGINS` | `*` |

5. Click **"Deploy Web Service"**
6. ⏳ Wait for deploy (5–10 minutes for first build)
7. Once live, **copy your backend URL** (e.g., `https://rsa-backend-xxxx.onrender.com`)
8. Verify: open `https://rsa-backend-xxxx.onrender.com/docs` — should show Swagger UI

### Step 4: Deploy Frontend
1. Dashboard → **"New +"** → **"Static Site"**
2. Connect the **same** GitHub repo
3. Settings:
   - **Name**: `rsa-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install --legacy-peer-deps && npm run build`
   - **Publish Directory**: `build`
4. Add **Environment Variable**:

   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | `https://rsa-backend-xxxx.onrender.com` *(your backend URL from Step 3)* |

5. Click **"Create Static Site"**
6. ⏳ Wait for build (3–5 minutes)

### Step 5: Add Rewrite Rule
1. Go to your `rsa-frontend` service → **"Redirects/Rewrites"** tab
2. Add: Source `/*` → Destination `/index.html` → Type **Rewrite**
3. Save

### ✅ Your public link:
```
https://rsa-frontend-xxxx.onrender.com
```

> **Note:** Free tier backend sleeps after 15 min idle. First visit after sleep takes ~30-60s.

---

## 🐳 Local Deployment (Docker Compose)

```powershell
docker-compose up --build -d
```

Access at: [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend sleeping on Render | Free tier — first visit wakes it up in 30-60s |
| Frontend can't reach API | Check `REACT_APP_API_URL` in frontend env vars |
| CORS errors | Set `BACKEND_CORS_ORIGINS=*` on backend |
| Build fails | Check deploy logs in Render dashboard |
