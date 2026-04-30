# Quick Start - Deploy to Render

This document provides the fastest path to deploy FlipClass on Render.

## TL;DR (5 minutes)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push -u origin main
   ```

2. **Create Backend Service:**
   - Go to https://dashboard.render.com
   - Click "New +" → "Web Service"
   - Select your GitHub repository
   - Configure:
     - Name: `flipclass-backend`
     - Build Command: `pip install -r backend/requirements.txt`
     - Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Click "Create Web Service"

3. **Create Frontend Service:**
   - Click "New +" → "Static Site"
   - Select your GitHub repository
   - Configure:
     - Name: `flipclass-frontend`
     - Build Command: `cd frontend && npm install && npm run build`
     - Publish Directory: `frontend/dist`
   - Add Environment Variable:
     - Key: `VITE_API_URL`
     - Value: (backend URL from step 2, e.g., `https://flipclass-backend.onrender.com`)
   - Click "Create Static Site"

4. **Done!** Your app is deployed and will be available at the service URLs shown in the dashboard.

## Key Files

- `render.yaml` - Render configuration (alternative setup method)
- `DEPLOYMENT.md` - Full deployment guide with troubleshooting
- `PRODUCTION.md` - Production environment setup
- `.env.example` - Environment variables reference

## Deployment Status

- **Frontend**: https://flipclass-frontend.onrender.com (once deployed)
- **Backend API**: https://flipclass-backend.onrender.com/api/metadata

## What Gets Deployed

Frontend:
- React application
- TypeScript components
- Tailwind CSS styling
- Built to `frontend/dist/`

Backend:
- FastAPI server
- TensorFlow models
- Pre-trained CNN, ResNet50, EfficientNetB0
- All models loaded automatically on startup

## Important Notes

1. **First deployment takes 5-10 minutes** due to dependency installation
2. **Free tier will spin down** after 15 minutes of inactivity (wakes up on next request)
3. **Models must be < 150 MB** total (free tier limitation)
4. **CORS is enabled** for production (check `backend/main.py`)
5. **Static site** (frontend) is free tier supported
6. **Web service** (backend) may need upgrade for better performance

## Auto-Deploy

Once deployed, every push to `main` on GitHub automatically triggers a redeploy.

To disable: Go to service → Settings → Auto-Deploy → Disable

## Verify Deployment

```bash
# Backend health check
curl https://flipclass-backend.onrender.com/

# Frontend access
Open https://flipclass-frontend.onrender.com in browser

# Test API
curl https://flipclass-backend.onrender.com/api/metadata
```

## Next Steps After Deployment

1. Test the application
2. Check logs in Render dashboard
3. Monitor performance
4. Set up custom domain (optional)
5. Configure notifications/alerts

## Need Help?

- Check `DEPLOYMENT.md` for detailed guide
- View logs in Render dashboard (Logs tab)
- Review Render docs: https://docs.render.com
- Common issues in `DEPLOYMENT.md#troubleshooting`

---

**Ready? Start with "Push to GitHub" step above!**
