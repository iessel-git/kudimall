# KudiMall Deployment Guide

This guide covers deploying KudiMall to various platforms, with a focus on Render.com.

## Quick Deploy to Render.com

### Prerequisites
- GitHub account with the KudiMall repository
- Render.com account (free tier works)

### Deploy with Blueprint (Easiest)

1. **Push the code to GitHub**
   ```bash
   git push origin main
   ```

2. **Go to Render Dashboard**
   - Visit https://dashboard.render.com/
   - Sign in with GitHub

3. **Create New Blueprint**
   - Click **New** → **Blueprint**
   - Select your kudimall repository
   - Render will detect `render.yaml` automatically

4. **Configure Environment Variables**
   The following variables will be prompted:
   - `FRONTEND_URL` - Optional, set if you have a separate frontend
   - `JWT_SECRET` - Will be auto-generated if not provided
   - `EMAIL_USER` - Optional, for email notifications
   - `EMAIL_PASSWORD` - Optional, Gmail app password

5. **Deploy**
   - Click **Apply**
   - Render will build and deploy your service
   - Wait 2-3 minutes for deployment

6. **Access Your API**
   - Your API will be available at: `https://kudimall-api.onrender.com`
   - Health check: `https://kudimall-api.onrender.com/api/health`

### Manual Deploy to Render.com

If you prefer manual setup:

1. **Create a Web Service**
   - Dashboard → **New** → **Web Service**
   - Connect your GitHub repository

2. **Configure Build Settings**
   - **Name**: `kudimall-api`
   - **Runtime**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node index.js`

3. **Set Environment Variables**
   Add these in the Environment section:
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_PATH=./kudimall.db
   JWT_SECRET=your-secure-random-string-min-32-chars
   FRONTEND_URL=https://your-frontend-url.com
   ```
   
   > **Note**: Generate JWT_SECRET with: `openssl rand -hex 32`

4. **Configure Health Check** (Optional but recommended)
   - Path: `/api/health`
   - This helps Render monitor your service

5. **Deploy**
   - Click **Create Web Service**
   - Render will automatically deploy

## Understanding the Deployment

### What Happens During Deployment?

1. **Build Phase**
   - Render clones your repository
   - Runs `cd server && npm install`
   - Installs all Node.js dependencies

2. **Start Phase**
   - Runs `cd server && node index.js`
   - Server starts on the configured PORT
   - **Automatic Database Setup**:
     - Checks if database exists
     - If not, runs `initDb.js` automatically
     - Seeds database with sample data
     - All happens on first startup!

3. **Health Monitoring**
   - Render checks `/api/health` endpoint
   - Restarts service if health check fails

### Database Considerations

**SQLite on Render (Free Tier)**
- ✅ Automatically initialized on startup
- ✅ Works great for development and testing
- ⚠️ Database resets when service restarts
- ⚠️ Not suitable for production data persistence

**For Production**
- Consider upgrading to Render's PostgreSQL
- Or use external database service (Supabase, PlanetScale, etc.)
- Database migration scripts are already in place

## Troubleshooting

### Deployment Fails at Build

**Error**: `npm install` fails
- **Solution**: Check that `server/package.json` has all dependencies
- **Fix**: Run `cd server && npm install` locally first

### Service Starts But Health Check Fails

**Error**: Health check at `/api/health` fails
- **Solution**: Check logs in Render dashboard
- **Common causes**:
  - Port configuration issue
  - Database initialization failed
  - Missing environment variables

### Database Not Seeding

**Error**: Empty database after deployment
- **Solution**: Check server logs
- The auto-initialization should run on first startup
- Manual seed via: `POST /api/seed-database`

### CORS Errors

**Error**: Frontend can't connect to API
- **Solution**: Set `FRONTEND_URL` environment variable
- Format: `https://your-frontend-domain.com` (no trailing slash)
- Multiple origins: `https://domain1.com,https://domain2.com`

## Environment Variables Reference

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |
| `DATABASE_PATH` | Database file path | `./kudimall.db` |
| `JWT_SECRET` | JWT signing key (min 32 chars) | `openssl rand -hex 32` |

### Optional
| Variable | Description | Example |
|----------|-------------|---------|
| `FRONTEND_URL` | Frontend origin(s) for CORS | `https://myapp.com` |
| `EMAIL_USER` | Gmail for notifications | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | Gmail app password | 16-character password |

## Post-Deployment

### Verify Deployment

1. **Health Check**
   ```bash
   curl https://your-app.onrender.com/api/health
   ```
   Should return: `{"status":"ok","message":"KudiMall API is running"}`

2. **API Root**
   ```bash
   curl https://your-app.onrender.com/
   ```
   Should return API information with endpoints

3. **Test Categories**
   ```bash
   curl https://your-app.onrender.com/api/categories
   ```
   Should return array of 8 categories

### Monitor Your Service

- **Logs**: Render Dashboard → Your Service → Logs
- **Metrics**: Dashboard shows CPU, Memory usage
- **Health**: Green indicator shows service is healthy

## Deploying to Other Platforms

### Heroku

1. Create `Procfile`:
   ```
   web: cd server && node index.js
   ```

2. Deploy:
   ```bash
   heroku create kudimall-api
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=$(openssl rand -hex 32)
   git push heroku main
   ```

### Railway

1. Connect GitHub repository
2. Set environment variables in dashboard
3. Railway auto-detects Node.js
4. Set start command: `cd server && node index.js`

### DigitalOcean App Platform

1. Create new app from GitHub
2. Configure:
   - Build: `cd server && npm install`
   - Run: `cd server && node index.js`
3. Set environment variables
4. Deploy

## Production Checklist

Before deploying to production:

- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Configure `FRONTEND_URL` for CORS
- [ ] Set up email notifications (if needed)
- [ ] Consider PostgreSQL for data persistence
- [ ] Set up custom domain
- [ ] Enable HTTPS (automatic on Render)
- [ ] Configure monitoring and alerts
- [ ] Set up backup strategy (if using persistent database)
- [ ] Review and update rate limiting
- [ ] Configure proper error logging

## Getting Help

- **Render Docs**: https://render.com/docs
- **GitHub Issues**: Open an issue in the repository
- **Render Support**: Free tier has community support
- **Logs**: Always check Render logs first

## Upgrading from Free to Paid

To handle production traffic:

1. **Upgrade Web Service**
   - Prevents service from sleeping
   - Guaranteed uptime
   - More resources

2. **Add PostgreSQL**
   - Persistent database
   - Better performance
   - Automatic backups

3. **Add Redis** (Future)
   - Session storage
   - Caching layer
   - Queue management
