# Multi-Disease Predictor - Deployment Guide

## Quick Deployment (Render + MongoDB Atlas)

### Step 1: MongoDB Atlas Setup (Database)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new cluster (M0 free tier)
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/multidisease`
5. Save this for later ✅

### Step 2: Prepare GitHub Repository
```bash
cd d:\multi-disease
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/multi-disease.git
git push -u origin main
```

### Step 3: Deploy Backend to Render
1. Go to https://render.com (sign up free)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Fill in details:
   - **Name**: multi-disease-api
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server/app.js`
5. Add Environment Variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/multidisease
   NODE_ENV=production
   PORT=5000
   ```
6. Click "Create Web Service"
7. Wait for deployment (2-3 minutes)
8. Copy the URL: `https://multi-disease-api.onrender.com`

### Step 4: Deploy Frontend to Render
1. Create `render.yaml` in root:
   ```yaml
   services:
     - type: web
       name: multi-disease
       env: static
       buildCommand: cd client && npm run build
       staticPublishPath: client/build
       buildFilter:
         paths:
           - client/**
   ```
2. Go to Render dashboard → New Web Service
3. Use same GitHub repo
4. Set **Build Command**: `cd client && npm run build`
5. Set **Publish Directory**: `client/build`
6. Click "Create Web Service"
7. Copy frontend URL: `https://multi-disease.onrender.com`

### Step 5: Update API URL in Frontend
In `client/src/index.js`, update:
```javascript
axios.defaults.baseURL = 'https://multi-disease-api.onrender.com';
```

Rebuild and commit:
```bash
cd client
npm run build
git add .
git commit -m "Update API URL for production"
git push
```

### Step 6: Verify Deployment
1. Go to `https://multi-disease.onrender.com`
2. Register → Login → Test prediction
3. Check if results display correctly

---

## Environment Variables Required

### Backend (.env)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/multidisease
NODE_ENV=production
PORT=5000
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password_here
```

### Frontend (.env)
```
REACT_APP_API_URL=https://multi-disease-api.onrender.com
```

---

## Alternative: Free Tier Limits
- **Render**: Free tier sleeps after 15 mins of inactivity (5 second startup delay)
- **MongoDB Atlas**: 512MB storage free
- For production, upgrade to paid plans

---

## Manual Deployment (Docker)
If using your own server:
```bash
docker build -t multidisease .
docker run -p 5000:5000 multidisease
```

---

## Post-Deployment Checklist
- [ ] Database is connected (test prediction)
- [ ] Email notifications working (send report)
- [ ] PDF generation working
- [ ] History is saving
- [ ] All 13 diseases predicting correctly
- [ ] Mobile responsive

---

## Support
For issues:
1. Check Render logs: Dashboard → Service → Logs
2. Verify MongoDB connection
3. Check environment variables
4. Test API directly: `curl https://multi-disease-api.onrender.com/api/auth/login`

