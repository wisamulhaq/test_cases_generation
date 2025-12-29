# 🚀 Vercel Frontend Deployment Guide

Complete guide to deploy your Biruni.AI frontend to Vercel.

---

## 📋 Quick Overview

**What's Been Done:**
- ✅ All code updated to use environment variables
- ✅ Production build tested successfully
- ✅ Vercel configuration created
- ✅ Ready to deploy!

**Time Required:** ~10 minutes  
**Cost:** $0/month (Vercel free tier)

---

## 🎯 Step-by-Step Deployment

### **Step 1: Get Google OAuth Client ID (2 minutes)**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Configure:
   - Application type: **Web application**
   - Name: **Biruni AI Frontend**
   - Authorized JavaScript origins: `http://localhost:3000`
   - Click **"CREATE"**
4. **Copy your Client ID** (format: `xxxxx.apps.googleusercontent.com`)

---

### **Step 2: Deploy to Vercel (5 minutes)**

#### Option A: Using Vercel Dashboard (Recommended)

1. **Go to:** https://vercel.com/new

2. **Import Repository:**
   - Sign in with GitHub (recommended)
   - Select your `test_cases_generation` repository
   - Click **"Import"**

3. **Configure Project:**
   
   | Setting | Value |
   |---------|-------|
   | **Framework Preset** | Create React App |
   | **Root Directory** | `frontend` ⚠️ **CRITICAL!** |
   | **Build Command** | `npm run build` (auto-detected) |
   | **Output Directory** | `build` (auto-detected) |

4. **Add Environment Variables:**
   
   Click **"Environment Variables"** and add:
   
   ```
   Name: REACT_APP_GOOGLE_CLIENT_ID
   Value: [Paste your Google Client ID from Step 1]
   Environments: ☑ Production ☑ Preview ☑ Development
   ```
   
   ```
   Name: REACT_APP_API_URL
   Value: https://temporary-placeholder.com
   Environments: ☑ Production ☑ Preview ☑ Development
   ```
   
   > **Note:** You'll update `REACT_APP_API_URL` after backend deployment

5. **Click "Deploy"** and wait 2-3 minutes

6. **Copy your Vercel URL** (e.g., `https://your-app.vercel.app`)

#### Option B: Using Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts, then deploy to production
vercel --prod
```

---

### **Step 3: Update Google OAuth Settings (2 minutes)**

1. Go back to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click on your OAuth 2.0 Client ID
3. Under **"Authorized JavaScript origins"**, ADD:
   - `https://your-app.vercel.app` (your actual Vercel URL)
4. Under **"Authorized redirect URIs"**, ADD:
   - `https://your-app.vercel.app`
5. Keep existing `http://localhost:3000` for local development
6. Click **"SAVE"**
7. ⏱️ **Wait 5-10 minutes** for Google changes to propagate

---

### **Step 4: Test Your Deployment (1 minute)**

1. Visit your Vercel URL
2. ✅ Login page should load
3. ✅ Click "Sign in with Google" - should work!
4. ⚠️ "Backend Disconnected" message is normal (deploy backend next)

---

## ⚠️ Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| **Build fails** | Test locally: `cd frontend && npm run build` |
| **"Invalid Client ID"** | Check environment variable spelling in Vercel |
| **Google login fails** | Add Vercel URL to Google OAuth, wait 5-10 min |
| **404 errors** | Ensure Root Directory is set to `frontend` |
| **"Failed to fetch"** | Normal until backend deployed |

---

## 🔧 Important Configuration Details

### Environment Variables
```bash
# Required in Vercel dashboard
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
REACT_APP_API_URL=https://your-backend-url.com

# ⚠️ Don't include /api at the end of API_URL
# ⚠️ Variables must start with REACT_APP_
```

### Vercel Build Settings
```json
{
  "framework": "Create React App",
  "rootDirectory": "frontend",
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "nodeVersion": "18.x"
}
```

---

## ✅ Deployment Checklist

**Before Deployment:**
- [ ] Google OAuth Client ID obtained
- [ ] Vercel account created
- [ ] Code pushed to GitHub (if using Git method)

**During Deployment:**
- [ ] Root directory set to "frontend"
- [ ] Environment variables added
- [ ] Deployment successful

**After Deployment:**
- [ ] App loads at Vercel URL
- [ ] Google login works
- [ ] No critical console errors
- [ ] Vercel URL added to Google OAuth

---

## 📝 Save Your Deployment Info

After deployment, record these:

- **Vercel URL:** _________________________________
- **Google Client ID:** _________________________________
- **Project Name:** _________________________________
- **Deployment Date:** _________________________________

---

## ⏭️ Next Steps

1. ✅ **Frontend deployed to Vercel**
2. ⏭️ **Deploy backend** to Railway/Render
3. ⏭️ **Update** `REACT_APP_API_URL` in Vercel with backend URL
4. ⏭️ **Test** complete application
5. 🎉 **Go live!**

---

## 🔗 Helpful Links

- **Deploy Now:** https://vercel.com/new
- **Google Console:** https://console.cloud.google.com/apis/credentials
- **Vercel Docs:** https://vercel.com/docs
- **Support:** https://vercel.com/support

---

## 💡 Key Reminders

- ⚠️ **Root Directory MUST be "frontend"** in Vercel settings
- 🔄 Every git push to main triggers auto-deployment
- 🌍 Your app runs on global CDN with automatic HTTPS
- 💰 Free tier includes 100GB bandwidth/month
- 🔙 Instant rollback available from Vercel dashboard

---

**Ready to deploy?** Start with Step 1 above! 🚀

---

*Last updated: December 30, 2024*
