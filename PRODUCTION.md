# Production Configuration for FlipClass

## Frontend (.env)

When deploying the frontend, create a `.env.production` file in the `frontend/` directory:

```
VITE_API_URL=https://flipclass-backend.onrender.com
```

## Backend Environment Variables

Set these in the Render dashboard for the backend service:

```
PYTHON_ENV=production
PYTHONUNBUFFERED=1
PORT=8000
```

## Build Artifacts

Frontend production build output goes to:
- `frontend/dist/` - This directory is served by Render's static site

Backend output directories:
- `outputs/models/` - Trained model files
- `outputs/results/` - Performance metrics
- `outputs/plots/` - Generated visualizations

## Performance Tips

1. **Enable caching**: Static assets in frontend are cached by default
2. **Monitor logs**: Check Render dashboard for any runtime errors
3. **Optimize models**: Larger models may slow down boot time
4. **Use compression**: Render automatically compresses static assets

## Troubleshooting Checklist

- [ ] Git repository is pushed
- [ ] render.yaml is in the root directory
- [ ] CORS is properly configured in backend
- [ ] Environment variables are set correctly
- [ ] Model files exist in outputs/models/
- [ ] API URL in frontend matches backend URL
- [ ] No uncommitted changes

## Rollback

To rollback to a previous version on Render:
1. Go to Render dashboard
2. Select the service
3. Click "Rollback" in the Deployments section
4. Select previous successful build
5. Confirm rollback

## Monitoring

Monitor your deployed application:
- Render Dashboard: https://dashboard.render.com
- Health check: `https://flipclass-backend.onrender.com/`
- API Status: `https://flipclass-backend.onrender.com/api/metadata`
