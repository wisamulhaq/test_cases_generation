# 🚀 Render Backend Deployment Guide

Complete guide to deploy your Biruni.AI backend to Render.

---

## 📋 Quick Overview

**What's Been Done:**
- ✅ Backend package.json updated with all dependencies
- ✅ CORS configured for production
- ✅ Environment variables template created
- ✅ Ready to deploy!

**Time Required:** ~15 minutes  
**Cost:** Free tier available (sleeps after 15 min inactivity) or $7/month for always-on

---

## 🎯 Prerequisites

Before deploying, you need:

1. **MongoDB Atlas Database** (Free tier available)
   - Connection string ready
   
2. **Google OAuth Credentials**
   - Client ID
   - Client Secret
   
3. **Google Gemini API Key**
   - From Google AI Studio

4. **Vercel Frontend URL** (from previous deployment)
   - Example: `https://your-app.vercel.app`

---

## 📝 Step-by-Step Deployment

### **Step 1: Set Up MongoDB Atlas (If not already done)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. **Create a Free Cluster:**
   - Click "Build a Database"
   - Choose "Free" (M0 Sandbox)
   - Select a cloud provider and region
   - Click "Create Cluster"

4. **Create Database User:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `biruni_admin` (or your choice)
   - Generate secure password and **SAVE IT**
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

5. **Allow Network Access:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

6. **Get Connection String:**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Driver: Node.js, Version: 5.5 or later
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with `biruni_ai` or your choice
   - **SAVE THIS CONNECTION STRING**

---

### **Step 2: Get Google Gemini API Key**

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Select or create a Google Cloud project
5. Click "Create API key in existing project"
6. **Copy and SAVE the API key**

---

### **Step 3: Prepare Your Environment Variables**

You'll need these values ready (collect them now):

| Variable | Where to Get | Example |
|----------|--------------|---------|
| `MONGODB_URL` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/biruni_ai` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console (same as frontend) | `123-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | `GOCSPX-xxxxxxxxxxxxx` |
| `GOOGLE_API` | Google AI Studio | `AIzaSyxxxxxxxxxxxxxxxxxxxxxx` |
| `JWT_SECRET` | Generate random string | `your-super-secret-jwt-key-123` |
| `FRONTEND_URL` | Your Vercel URL | `https://your-app.vercel.app` |
| `NODE_ENV` | Set to production | `production` |

**To generate JWT_SECRET**, run this in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### **Step 4: Deploy to Render**

#### **4.1 Create Render Account**

1. Go to [https://render.com](https://render.com)
2. Click "Get Started"
3. Sign up with GitHub (recommended)
4. Authorize Render to access your repositories

---

#### **4.2 Create New Web Service**

1. **From Render Dashboard:**
   - Click "New +" button (top right)
   - Select "Web Service"

2. **Connect Repository:**
   - Find your `test_cases_generation` repository
   - Click "Connect"

3. **Configure Service:**

   | Setting | Value |
   |---------|-------|
   | **Name** | `biruni-ai-backend` (or your choice) |
   | **Region** | Choose closest to you (e.g., Oregon USA) |
   | **Branch** | `main` |
   | **Root Directory** | `backend` ⚠️ **IMPORTANT!** |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |

4. **Select Plan:**
   - **Free**: Spins down after 15 min inactivity (good for testing)
   - **Starter ($7/month)**: Always on, better performance
   - Choose based on your needs

---

#### **4.3 Add Environment Variables**

Scroll down to "Environment Variables" section and add these:

Click "Add Environment Variable" for each:

```
Key: PORT
Value: 5000

Key: NODE_ENV
Value: production

Key: MONGODB_URL
Value: [Your MongoDB Atlas connection string]

Key: GOOGLE_CLIENT_ID
Value: [Your Google OAuth Client ID]

Key: GOOGLE_CLIENT_SECRET
Value: [Your Google OAuth Client Secret]

Key: GOOGLE_API
Value: [Your Google Gemini API Key]

Key: JWT_SECRET
Value: [Your generated JWT secret]

Key: FRONTEND_URL
Value: [Your Vercel frontend URL]
```

⚠️ **IMPORTANT:**
- Use the **EXACT** variable names shown above
- No quotes around values
- MongoDB URL should include username, password, and database name
- FRONTEND_URL should be your actual Vercel URL (no trailing slash)

---

#### **4.4 Deploy**

1. Click "Create Web Service"
2. Wait for deployment (3-5 minutes)
3. Watch the build logs
4. Once deployed, you'll see "Your service is live 🎉"
5. **Copy your Render URL** (e.g., `https://biruni-ai-backend.onrender.com`)

---

### **Step 5: Update Frontend to Use Backend URL**

1. **Go to Vercel Dashboard:**
   - Open your frontend project
   - Go to "Settings" → "Environment Variables"

2. **Update `REACT_APP_API_URL`:**
   - Find the `REACT_APP_API_URL` variable
   - Click "Edit"
   - Change value from placeholder to: `https://your-backend.onrender.com`
   - ⚠️ **Do NOT include `/api` at the end**
   - Save

3. **Redeploy Frontend:**
   - Go to "Deployments" tab
   - Click on latest deployment
   - Click "..." menu → "Redeploy"
   - Wait for deployment to complete

---

### **Step 6: Update Google OAuth Settings**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Under **"Authorized JavaScript origins"**, ADD:
   - `https://your-backend.onrender.com`
4. Click "SAVE"
5. Wait 5-10 minutes for changes to propagate

---

### **Step 7: Test Your Deployment**

#### **Test Backend Health:**
```bash
curl https://your-backend.onrender.com/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Test Cases Generation API is running"
}
```

#### **Test Full Application:**

1. Visit your Vercel frontend URL
2. Click "Sign in with Google"
3. Complete authentication
4. Try generating test cases
5. ✅ Everything should work!

---

## 🔧 Render Dashboard Features

After deployment, explore these:

### **Logs:**
- Click "Logs" tab to see real-time server logs
- Debug errors and monitor requests

### **Metrics:**
- View CPU, Memory, and Response times
- Monitor health and performance

### **Manual Deploy:**
- Click "Manual Deploy" → "Deploy latest commit"
- Or "Clear build cache & deploy" if issues

### **Environment Variables:**
- Update anytime in "Environment" tab
- Requires redeploy after changes

### **Custom Domain:**
- Add your own domain in "Settings"
- Free SSL included

---

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Build fails** | Check "Root Directory" is set to `backend` |
| **Service won't start** | Verify all environment variables are set correctly |
| **MongoDB connection fails** | Check MongoDB IP whitelist includes 0.0.0.0/0 |
| **CORS errors** | Ensure `FRONTEND_URL` matches your Vercel URL exactly |
| **"Invalid credentials"** | Verify Google Client ID and Secret are correct |
| **API requests timeout** | Free tier spins down - first request takes 30-60s |

---

## 💡 Important Notes

### **Free Tier Limitations:**
- ⏰ Spins down after 15 minutes of inactivity
- 🐌 First request after sleep takes 30-60 seconds
- 💾 750 hours/month free (enough for 24/7 if you only have 1 service)
- 💰 Upgrade to Starter ($7/month) for always-on

### **File Uploads:**
- ⚠️ Current implementation uses local filesystem
- 🗑️ Files are **lost** when service restarts (ephemeral storage)
- 💡 **Recommendation:** Migrate to cloud storage later (Cloudinary/AWS S3)
- 📝 For MVP: Works fine, just temporary storage

### **Environment Variables:**
- ✅ Changes require manual redeploy
- 🔒 Never commit secrets to Git
- 📋 Keep backup of your variables

---

## 📊 Deployment Checklist

**Before Deployment:**
- [ ] MongoDB Atlas cluster created and connection string obtained
- [ ] Google Gemini API key created
- [ ] Google OAuth Client ID and Secret ready
- [ ] JWT secret generated
- [ ] Vercel frontend URL copied
- [ ] All environment variables documented

**During Deployment:**
- [ ] Render account created
- [ ] Root directory set to "backend"
- [ ] All environment variables added
- [ ] Service deployed successfully
- [ ] Backend URL copied

**After Deployment:**
- [ ] Health check endpoint working
- [ ] Frontend updated with backend URL
- [ ] Google OAuth settings updated
- [ ] Full authentication flow tested
- [ ] Test case generation working

---

## 🔄 Updating Your Deployment

### **Automatic Deployments:**
- Every push to `main` branch triggers auto-deploy
- Check "Events" tab to see deployment history

### **Manual Deploy:**
```bash
# Make your changes
git add .
git commit -m "Update backend"
git push origin main

# Render auto-deploys in 2-3 minutes
```

### **Rollback:**
- Click "Events" tab
- Find previous deployment
- Click "Rollback to this version"

---

## 📝 Save Your Deployment Info

After deployment, record these:

- **Render URL:** _________________________________
- **MongoDB Connection String:** _________________________________
- **Google Client ID:** _________________________________
- **Google Client Secret:** _________________________________
- **Google API Key:** _________________________________
- **JWT Secret:** _________________________________

---

## ⏭️ Next Steps

1. ✅ **Backend deployed to Render**
2. ✅ **Frontend updated with backend URL**
3. ✅ **Full application tested**
4. 🎉 **Your app is LIVE!**

**Optional Improvements:**
- Add custom domain
- Set up monitoring/alerting
- Migrate file uploads to cloud storage
- Upgrade to paid tier for better performance

---

## 🔗 Helpful Links

- **Deploy Now:** https://render.com/
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **Google AI Studio:** https://makersuite.google.com/app/apikey
- **Render Docs:** https://render.com/docs
- **Support:** https://render.com/docs/support

---

## 💰 Cost Summary

**Free Tier (MVP):**
- Frontend (Vercel): $0/month
- Backend (Render Free): $0/month
- MongoDB Atlas (Free): $0/month
- **Total: $0/month** 🎉

**Production Setup:**
- Frontend (Vercel): $0/month (free tier is great)
- Backend (Render Starter): $7/month
- MongoDB Atlas (Shared): $9/month
- **Total: $16/month**

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ Render service shows "Live"  
✅ Health check returns 200 OK  
✅ Frontend can connect to backend  
✅ Google login works end-to-end  
✅ Test case generation works  
✅ No errors in Render logs  

---

**Ready to deploy? Start with Step 1!** 🚀

---

*Last updated: December 30, 2024*
