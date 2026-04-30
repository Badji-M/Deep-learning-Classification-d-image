# FlipClass Deployment Guide - Render

## Deployment to Render

This guide explains how to deploy FlipClass (frontend + backend) to Render.

### Prerequisites

- GitHub account with the repository pushed
- Render account (free tier available)
- Git installed locally

### Architecture

```
Frontend (React + Vite)
    |
    v
Backend (FastAPI + TensorFlow)
    |
    v
Models & Inference
```

### Step 1: Push to GitHub

Ensure all changes are committed and pushed:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Deploy Backend on Render

1. Go to https://dashboard.render.com
2. Click "New +" -> "Web Service"
3. Connect your GitHub repository
4. Configure as follows:

**Backend Configuration:**
- Name: `flipclass-backend`
- Environment: `Python 3.11`
- Build Command: `pip install -r backend/requirements.txt`
- Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
- Instance Type: Free (or Paid for better performance)

**Environment Variables:**
- `PYTHON_ENV`: `production`

5. Click "Create Web Service"
6. Wait for deployment (5-10 minutes)
7. Copy the backend URL (e.g., `https://flipclass-backend.onrender.com`)

### Step 3: Deploy Frontend on Render

1. Click "New +" -> "Static Site"
2. Connect your GitHub repository
3. Configure as follows:

**Frontend Configuration:**
- Name: `flipclass-frontend`
- Build Command: `cd frontend && npm install && npm run build`
- Publish Directory: `frontend/dist`

**Environment Variables:**
- `VITE_API_URL`: (paste the backend URL from Step 2)

4. Click "Create Static Site"
5. Wait for deployment (3-5 minutes)

### Step 4: Update API Configuration

1. After frontend deployment, get the frontend URL
2. Go to Backend service on Render
3. Update CORS settings if needed (already configured for all origins)

### Important Notes

**Port Configuration:**
- Render assigns a dynamic port via `$PORT` environment variable
- Backend automatically uses this with the start command
- No need to hardcode ports

**Static Files:**
- Frontend is deployed as a static site (dist folder)
- Backend serves API only
- CORS is already configured for development/production

**Model Loading:**
- TensorFlow models are loaded from `outputs/models/` directory
- Files must be present in the repository
- Keep models under 150 MB for free tier

**Environment Variables:**
- Frontend: Set `VITE_API_URL` to backend URL
- Backend: Keep default settings
- Database or external services: Add as needed

### Troubleshooting

**Backend won't start:**
- Check Python version: 3.11
- Verify all dependencies in `requirements.txt`
- Check TensorFlow compatibility

**Frontend can't reach API:**
- Ensure `VITE_API_URL` is set correctly
- Check CORS configuration in `backend/main.py`
- Verify API endpoints are working

**Models too large:**
- Convert large models to TFLite format
- Use model compression techniques
- Or use Render's Paid tier for more space

**Build takes too long:**
- Free tier has limited resources
- Consider upgrading to Paid tier
- Cache dependencies properly

### Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click "Settings"
3. Add custom domain under "Custom Domain"
4. Configure DNS records as instructed
5. SSL certificate is auto-provisioned

### Monitoring

- Render dashboard shows:
  - Build logs
  - Deployment logs
  - Error logs
  - Resource usage
  - Recent deploys

### Automatic Deployments

- Enable auto-deploy from GitHub
- Every push to `main` triggers automatic deployment
- Can be configured in service settings

### Costs

**Free Tier:**
- 750 hours/month per service
- Enough for 24/7 on one service
- Limited CPU/RAM
- Services spin down after 15 min inactivity

**Paid Tier (Recommended):**
- Continuous 24/7 operation
- More CPU/RAM
- Better performance
- Starting from $7/month

### Next Steps After Deployment

1. Test the deployed application
2. Monitor logs in Render dashboard
3. Set up custom domain (optional)
4. Configure automatic backups if needed
5. Set up monitoring/alerts

### Useful Commands

**View deployment logs:**
```bash
# In Render dashboard: Dashboard -> Logs
```

**Redeploy:**
```bash
# In Render dashboard: Service -> Manual Redeploy
# Or push new changes to GitHub
```

**SSH into service (Paid tier only):**
```bash
# Not available on free tier
```

### Support

- Render Support: https://support.render.com
- Documentation: https://docs.render.com
- Community: https://community.render.com
