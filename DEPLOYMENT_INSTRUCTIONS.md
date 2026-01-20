Prerequisites
- Ensure `MONGODB_URI` and `JWT_SECRET` (and any other required env vars) are set in your environment or in the hosting provider dashboard.

1) Seed DB (local or remote DB)

PowerShell:
```powershell
# Run full seed (optional)
node server/src/scripts/seedData.js

# Or add only the test users (safe, idempotent):
node server/src/scripts/addTestUsers.js
```

2) Commit & push changes
```bash
git add server/src/scripts/addTestUsers.js vercel.json
git commit -m "Add test users helper and Vercel config"
git push origin main
```

3) Netlify (if connected to repo)
- Netlify will pick up `netlify.toml` and run `npm install && npm run build --prefix client` and publish `client/dist`.
- To trigger a manual deploy via Netlify CLI:
```bash
# Install Netlify CLI if needed
npm i -g netlify-cli
# Build locally
npm run build --prefix client
# Deploy (interactive will ask target site)
netlify deploy --prod --dir=client/dist
```

4) Vercel
- Vercel will use `vercel.json` to detect the client build when connected to the repo. Set env vars in Vercel project settings (MONGODB_URI, JWT_SECRET, etc.).
- Manual deploy via Vercel CLI:
```bash
npm i -g vercel
vercel login
# From repo root
vercel --prod
```

Notes
- Backend (Express) is expected to run separately (e.g., Heroku, Azure, Render). Netlify / Vercel here will host the frontend static build. Update frontend `.env` or build-time env to point to your backend API URL.
- After deployment, verify:
  - Frontend loads (open deployed URL)
  - API endpoints require valid tokens; use seeded users (email/password: Password123) to login and test.

If you want, I can:
- Run `node server/src/scripts/addTestUsers.js` now (requires MONGODB_URI available in environment),
- Create a simple `vercel` project via CLI (needs your account auth), or
- Prepare a small `README` to include the test credentials and API base URL placeholders.