# Netlify Deployment Guide

## Overview
This project has both a React frontend (Vite) and a Node.js backend. For Netlify deployment, we'll:
1. Deploy the React frontend directly to Netlify
2. Deploy the backend separately (Heroku, Railway, or another Node.js host)

---

## Step 1: Prepare the Frontend for Netlify

### 1.1 Create `netlify.toml` in the root directory
```toml
[build]
  command = "cd client && npm run build"
  publish = "client/dist"

[dev]
  command = "npm run dev"
  targetPort = 5173

[[redirects]]
  from = "/api/*"
  to = "YOUR_BACKEND_URL/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 1.2 Update the client API configuration
In your frontend code, update the API base URL for production:

**File: `client/src/api/axios.js` or similar**
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  // ... rest of config
});
```

Create a `.env.example` file in the client folder:
```env
VITE_API_URL=http://localhost:3000/api
```

### 1.3 Environment Variables Setup
Create a `.env.local` file locally:
```env
VITE_API_URL=http://localhost:3000/api
```

---

## Step 2: Deploy Backend (Choose One Option)

### Option A: Deploy to Heroku (Recommended)

1. **Install Heroku CLI**
   - Download from https://devcenter.heroku.com/articles/heroku-cli

2. **Login to Heroku**
   ```bash
   heroku login
   ```

3. **Create a Heroku App**
   ```bash
   cd server
   heroku create your-app-name
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set MONGO_URL="your_mongodb_connection_string"
   heroku config:set JWT_SECRET="your_jwt_secret"
   heroku config:set NODE_ENV="production"
   # Add any other required env variables
   ```

5. **Create a `Procfile` in the server directory**
   ```
   web: node src/index.js
   ```

6. **Deploy**
   ```bash
   git push heroku main
   ```

### Option B: Deploy to Railway

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Add environment variables in Railway dashboard
5. Deploy

### Option C: Deploy to Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables
7. Deploy

---

## Step 3: Update API URL on Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Build & deploy** → **Environment**
3. Add environment variables:
   ```
   VITE_API_URL = https://your-backend-domain.com/api
   ```

---

## Step 4: Deploy Frontend to Netlify

### Method 1: Deploy via Netlify UI

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://netlify.com
   - Click "New site from Git"
   - Select your GitHub repository
   - Configure build settings:
     - **Build command**: `cd client && npm run build`
     - **Publish directory**: `client/dist`
   - Click "Deploy site"

### Method 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=client/dist
   ```

First do a preview deploy:
```bash
netlify deploy --dir=client/dist
```

---

## Step 5: Verify CORS Configuration

Update your backend `src/index.js` to allow Netlify domain:

```javascript
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://your-netlify-domain.netlify.app', // Add your Netlify URL
  ],
  credentials: true
}));
```

---

## Step 6: Testing

1. After deployment, test your API calls
2. Check browser console for CORS errors
3. Verify authentication flows work correctly
4. Test database operations

---

## Troubleshooting

### Issue: CORS errors
- Update `cors` configuration in backend to include your Netlify domain
- Ensure API URL in frontend matches the backend domain

### Issue: Build fails on Netlify
- Check build logs in Netlify dashboard
- Ensure `netlify.toml` has correct paths
- Verify all dependencies are in `package.json`

### Issue: Environment variables not working
- Make sure variables are set in Netlify site settings
- Restart the deployment after adding variables
- Use `process.env.VITE_*` (Vite prefix) in frontend code

### Issue: Database connection fails
- Verify MongoDB connection string is correct
- Check that IP whitelist in MongoDB Atlas includes Heroku/Railway IPs
- For MongoDB Atlas, add `0.0.0.0/0` to allow all IPs

---

## Environment Variables Needed

### Frontend (Netlify)
- `VITE_API_URL`: Backend API URL

### Backend (Heroku/Railway/Render)
- `MONGO_URL`: MongoDB connection string
- `JWT_SECRET`: JWT secret key
- `NODE_ENV`: Set to "production"
- `CORS_ORIGIN`: Frontend URL (e.g., https://your-site.netlify.app)
- Any other variables in your `.env` file

---

## Next Steps

1. Create `netlify.toml` in project root
2. Deploy backend first
3. Get backend URL
4. Update frontend environment variable with backend URL
5. Deploy frontend to Netlify
6. Test all features

