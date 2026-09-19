# ALLA Ayurveda Frontend — Production Deployment Guide

## 1. Architecture Overview

```
Client Browser
      │
      ▼ HTTPS
Vercel Edge Network (Global CDN)
   ├── React 19 + Vite 8 SPA
   ├── React Router DOM v7 (Clean SPA Rewrites via vercel.json)
   └── API Client Services (Environment-configured)
      │
      ▼ HTTPS / REST API calls
Production Flask Backend (e.g. https://alla-ayurveda-backend.onrender.com/api)
```

---

## 2. Environment Variables

Set this in the Vercel Project Settings under **Environment Variables**:

| Variable | Description | Example Production Value | Local Development Default |
|---|---|---|---|
| `VITE_API_URL` | Base URL for backend REST API endpoints | `https://alla-ayurveda-backend.onrender.com/api` | `http://127.0.0.1:5000/api` |

> [!IMPORTANT]
> The `VITE_API_URL` should include the `/api` suffix (matching backend blueprints). If omitted, the frontend defaults to `http://127.0.0.1:5000/api` for seamless local development.

---

## 3. Deployment Configuration for Vercel

### A. Import Project
1. In the [Vercel Dashboard](https://vercel.com/dashboard), click **Add New...** → **Project**.
2. Select your GitHub repository: `bunnysai872-crypto/ALLA-AYURVEDA`.
3. In **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `FRONTEND` (Click Edit and select `FRONTEND`)
   - **Build Command**: `npm run build` (or leave default `vite build`)
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### B. Configure Environment Variables
Under **Environment Variables**, add:
- Key: `VITE_API_URL`
- Value: `https://<your-render-backend-name>.onrender.com/api`

### C. Deploy
Click **Deploy**. Vercel will build the application and issue a production URL (e.g., `https://alla-ayurveda.vercel.app`).

---

## 4. Single-Page Application (SPA) Routing

To ensure direct access or page refresh on nested client-side routes (e.g. `/user-login/researcher`, `/researcher-workspace`, `/iec-secretariat/studies`) functions without 404 errors, the repository includes [vercel.json](file:///C:/Documents/ALLA%20AYURVEDA/FRONTEND/vercel.json):

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 5. Post-Deployment Verification Checklist

- [ ] Build completes cleanly on Vercel without warnings or errors.
- [ ] Landing page (`/`) renders hero banners and feature cards correctly.
- [ ] Role selection page (`/login`) routes to `/user-login/:role`.
- [ ] Researcher authentication (`/user-login/researcher`) issues JWT and navigates to workspace.
- [ ] Network tab in browser developer tools confirms API calls target `https://<render-backend>/api/...` (not `127.0.0.1`).
- [ ] CORS errors do not appear in the browser console.
