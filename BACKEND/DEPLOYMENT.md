# ALLA Ayurveda Backend — Production Deployment Guide

## 1. Architecture Overview

```
Client (React / Vercel)
        │
        ▼ HTTPS
Render Web Service (Linux)
   ├── Gunicorn WSGI Server (app:app)
   ├── Flask Application Factory (create_app())
   ├── Flask-JWT-Extended (Authentication)
   ├── Local/Persistent Storage (/uploads)
   └── Flask-SQLAlchemy + PyMySQL
        │
        ▼ SSL / TLS
Managed Cloud MySQL Database (e.g. Aiven / Railway / Render MySQL)
```

---

## 2. Production Environment Variables

Set these environment variables in your cloud hosting provider (e.g., Render Dashboard → Environment):

| Variable | Description | Example / Recommended Format |
|---|---|---|
| `DATABASE_URL` | Cloud MySQL connection string | `mysql+pymysql://<user>:<password>@<host>:<port>/<dbname>?ssl_mode=REQUIRED` |
| `JWT_SECRET_KEY` | High-entropy secret for signing JWT tokens | 64-character random hex string |
| `JWT_ACCESS_TOKEN_EXPIRES_HOURS` | Token lifetime (in hours) | `24` |
| `CORS_ORIGINS` | Permitted frontend origins (comma-separated or single) | `https://alla-ayurveda.vercel.app` |
| `UPLOAD_FOLDER` | Upload storage directory | `uploads` (or persistent mount e.g. `/var/data/uploads`) |
| `MAX_CONTENT_LENGTH` | Max upload payload size in bytes | `16777216` (16 MB) |
| `PORT` | Web server listen port | Render sets this automatically (default `5000` or `10000`) |

> [!NOTE]
> `DATABASE_URL` strings starting with `mysql://` are automatically normalized to `mysql+pymysql://` by `config.py` at runtime.

---

## 3. Deployment Configuration for Render

### A. Create Web Service
1. In [Render Dashboard](https://dashboard.render.com), click **New +** → **Web Service**.
2. Connect your Git repository: `bunnysai872-crypto/ALLA-AYURVEDA`.
3. Configure the service settings:
   - **Name**: `alla-ayurveda-backend`
   - **Region**: Choose closest to your database and users (e.g., Singapore, Frankfurt, Oregon).
   - **Branch**: `main`
   - **Root Directory**: `BACKEND`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     gunicorn app:app
     ```
   - **Instance Type**: Free or Starter.

### B. Add Environment Variables
In the **Environment** tab on Render, add:
- `DATABASE_URL`: Your managed cloud MySQL connection URL.
- `JWT_SECRET_KEY`: A secure random secret.
- `CORS_ORIGINS`: `https://<your-vercel-frontend>.vercel.app` (or `*` during initial testing).
- `JWT_ACCESS_TOKEN_EXPIRES_HOURS`: `24`

### C. Health Check Endpoint
- Path: `/api/health`
- Returns: HTTP 200 `{"status": "healthy", "database": "connected"}` when connected.

---

## 4. Cloud Database (MySQL) Setup

1. **Provision Managed Database**:
   - Provision a MySQL 8.0+ instance via Aiven, Railway, PlanetScale, or Render.
2. **Schema Auto-Initialization**:
   - The ALLA Ayurveda Flask backend automatically executes `db.create_all()` within `app.app_context()` during startup.
   - All 9 tables (`users`, `studies`, `documents`, `document_versions`, `quality_checks`, `protocols`, `regulatory_tracking`, `participants`, `informed_consents`) are automatically created upon initial connection.
3. **Database Seeding**:
   - For creating initial users in production, use a secure one-off script or connect to the database to insert administrative and researcher accounts with hashed passwords.

---

## 5. Document Storage Architecture & Warnings

> [!WARNING]
> **Ephemeral Storage vs. Persistent Disks**:
> - The application stores research documents (protocols, consent forms, investigator brochures) locally using `UPLOAD_FOLDER`.
> - Standard free cloud containers (such as Render free tier) have **ephemeral storage**, which is wiped whenever the service restarts or redeploys.
> - **Production Recommendation**:
>   1. On Render, attach a **Persistent Disk** (under the Disks tab) mounted at `/var/data/uploads`.
>   2. Set the environment variable `UPLOAD_FOLDER=/var/data/uploads`.
>   3. This guarantees that uploaded documents are preserved across container redeployments without changing any application code.

---

## 6. Pre-flight & Post-Deployment Checklist

- [ ] All 81 unit tests pass (`python -m unittest discover -s tests`).
- [ ] Render build succeeds (`pip install -r requirements.txt`).
- [ ] Gunicorn starts cleanly on target port (`gunicorn app:app`).
- [ ] `/api/health` responds with `database: connected`.
- [ ] CORS headers match the deployed Vercel frontend URL.
- [ ] No secrets or test credentials are committed to GitHub.
