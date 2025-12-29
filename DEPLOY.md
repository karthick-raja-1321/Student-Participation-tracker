# Deployment Guide

This guide shows concise, step-by-step deployment instructions for the backend (Render) and frontend (Vercel). It assumes you already pushed the repository to GitHub.

## Prerequisites
- A GitHub repo with this project
- MongoDB Atlas cluster and connection string (URI)
- Accounts: Render (for backend) and Vercel (for frontend)

---

## Backend: Render (recommended)

1. Create a new Web Service on Render
   - Connect your GitHub repo and select the branch (e.g. `master`).
2. Build & Start settings
   - Environment: `Node 18+`
   - Build command: `cd server && npm ci`
   - Start command: `cd server && npm start` (or use your production start script)
3. Add secrets / environment variables
   - `MONGODB_URI` — your Atlas connection string (required). Example:
     `mongodb+srv://user:password@cluster0.abcd.mongodb.net/student-participation-tracker?retryWrites=true&w=majority`
   - `FRONTEND_ORIGINS` — comma-separated allowed frontends (e.g. `https://your-vercel-app.vercel.app,http://localhost:5173`)
   - `JWT_SECRET`, `JWT_REFRESH_SECRET`, and other secrets required by `.env.example`
4. Health & deploy
   - Trigger a deploy. Check the deploy logs for successful DB connection and no Mongoose index errors.
   - Verify the service URL: `https://<your-service>.onrender.com`

Notes
- The server requires `MONGODB_URI` and will exit if missing. Add it as a Render secret before deploy.
- Use Render's environment secrets (do not commit `.env`).

---

## Frontend: Vercel

1. Create a new Vercel project
   - Import from GitHub and set the Root Directory to `client`.
2. Build settings
   - Framework Preset: Vite / Static Site
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variables (Vercel > Project Settings > Environment Variables)
   - `VITE_API_BASE` (or `VITE_API_URL`) — e.g. `https://<your-render-service>.onrender.com/api`
4. Rewrites (SPA)
   - `client/vercel.json` is already included to rewrite `/(.*)` to `/index.html`.
5. Deploy and verify
   - Trigger a deploy. Visit the generated URL and check console/network for API calls to your Render backend.

---

## Local testing checklist
- Set `MONGODB_URI` before running the server. Example (PowerShell):
  ```powershell
  $env:MONGODB_URI = 'mongodb+srv://<user>:<pw>@cluster.mongodb.net/<db>?retryWrites=true&w=majority'
  cd server
  npm run dev
  ```
- Start frontend:
  ```bash
  cd client
  npm run dev
  ```
- Open `http://localhost:5173` and verify dashboards; check browser console for errors.

---

## Quick Troubleshooting
- If the backend exits immediately: confirm `MONGODB_URI` is set and valid.
- If you see Mongoose duplicate-index warnings: ensure you run migrations or let Mongoose build indexes once; duplicate explicit `schema.index()` were removed from the repo.
- React Hook or runtime errors: run frontend dev to see full stack traces (`npm run dev` in `client`).

If you want, I can add annotated screenshots or a short `render-deploy-steps.md` with exact UI clicks. Reply `yes` to add screenshots and GUI steps.
