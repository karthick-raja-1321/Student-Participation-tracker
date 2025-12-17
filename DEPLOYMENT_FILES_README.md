# Netlify Deployment Files Created

This directory now contains:

1. **netlify.toml** - Configuration file for Netlify deployment
   - Specifies build command
   - Defines publish directory
   - Includes redirect for SPA routing

2. **server/Procfile** - Configuration for Heroku/Railway deployment
   - Specifies how to start the Node.js backend

## Quick Start Deployment Steps

### Step 1: Deploy Backend

Choose your hosting platform:

**Option A: Heroku**
```bash
cd server
heroku login
heroku create your-app-name
heroku config:set MONGO_URL="your_mongodb_connection_string" JWT_SECRET="your_secret"
git push heroku main
```

**Option B: Railway**
- Go to https://railway.app
- Create new project from GitHub
- Add environment variables
- Deploy

### Step 2: Deploy Frontend to Netlify

```bash
# Option 1: Via Netlify UI
# 1. Go to https://netlify.com
# 2. Click "New site from Git"
# 3. Select your GitHub repo
# 4. Build settings auto-detected from netlify.toml
# 5. Click Deploy

# Option 2: Via CLI
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=client/dist
```

### Step 3: Configure Environment Variables

After deploying backend, get the URL and add to Netlify:
- In Netlify dashboard → Site settings → Environment variables
- Add: `VITE_API_URL=https://your-backend-url.com/api`

## Detailed Instructions

See `NETLIFY_DEPLOYMENT_GUIDE.md` for complete step-by-step instructions.
