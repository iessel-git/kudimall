# KudiMall Deployment Guide

> ⚠️ **Having deployment issues?** If you're seeing "No such file or directory" error, see [RENDER_FIX_INSTRUCTIONS.md](./RENDER_FIX_INSTRUCTIONS.md) or [QUICK_FIX.txt](./QUICK_FIX.txt) for immediate help.

## Deployment to Render.com

### Prerequisites
1. A Render.com account (free tier available)
2. GitHub repository connected to Render
3. PostgreSQL database (provided by Render)

### Automatic Deployment (Recommended)

The `render.yaml` file in the root directory contains all the configuration needed for automatic deployment.

#### Steps:
1. **Push your code to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Render**
   - Go to https://render.com
   - Click "New" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and set up:
     - PostgreSQL database (kudimall-db)
     - Web service (kudimall-api)

3. **Configure Environment Variables**
   The following are automatically set from render.yaml:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `DATABASE_URL` (from PostgreSQL database)
   - `JWT_SECRET` (auto-generated)
   - `FRONTEND_URL=https://kudimall.onrender.com`

4. **Database Initialization**
   
   **IMPORTANT:** The application automatically initializes the database on first startup!
   
   The server (via `server/index.js`) will:
   - Auto-detect if database tables are missing
   - Create all required tables automatically
   - Seed initial data if database is empty
   
   **No manual migration commands are needed for initial deployment.**
   
   However, if you need to run migrations manually (for troubleshooting):
   ```bash
   # Open Render Shell, then:
   cd server
   psql $DATABASE_URL -f migrations/init_schema_postgres.sql
   node scripts/seedDb.js
   ```

### Manual Deployment

If you prefer manual setup:

#### 1. Create PostgreSQL Database
- In Render dashboard: New → PostgreSQL
- Name: `kudimall-db`
- Region: Oregon (or nearest to your users)
- Plan: Free
- Note the connection details

#### 2. Create Web Service
- In Render dashboard: New → Web Service
- Connect your GitHub repository
- Settings:
  - **Name:** kudimall-api
  - **Region:** Same as database
  - **Branch:** main (or your deployment branch)
  - **Root Directory:** (leave blank)
  - **Environment:** Node
  - **Build Command:** `cd server && npm install`
  - **Start Command:** `cd server && npm start`
  - **Plan:** Free

#### 3. Environment Variables
Add in Render dashboard (Environment tab):
```
NODE_ENV=production
PORT=5000
DATABASE_URL=[Auto-filled from database connection]
JWT_SECRET=[Generate a secure random string]
FRONTEND_URL=https://your-app-name.onrender.com
```

#### 4. Health Check
Set health check path: `/api/health`

### Database Setup

**IMPORTANT: Automatic Initialization (Recommended)**

The application automatically initializes the database on first startup. When you deploy:
1. The server starts and detects if database tables exist
2. If tables are missing, it automatically creates them via `server/scripts/initDb.js`
3. If the database is empty, it automatically seeds initial data

**You do NOT need to run manual psql commands for initial deployment.**

#### Manual Initialization (Optional - Only if Automatic Fails)

If automatic initialization fails or you need to manually initialize:

##### Option 1: Using Render Shell
1. Open Shell from Render dashboard
2. Run migrations (only if automatic initialization failed):
```bash
cd server
# Create base schema
psql $DATABASE_URL -f migrations/init_schema_postgres.sql

# Add missing columns for API routes
psql $DATABASE_URL -f migrations/add_missing_columns.sql

# Seed initial data
node scripts/seedDb.js
```

**Note:** The `add_missing_columns.sql` migration adds additional columns (like seller name, slug, email, location, description, etc.) that are used by various API routes but not included in the base schema.

##### Option 2: Using Local psql
1. Get connection string from Render dashboard
2. Run from your local machine:
```bash
cd server
psql "postgresql://user:password@host/database" -f migrations/init_schema_postgres.sql
psql "postgresql://user:password@host/database" -f migrations/add_missing_columns.sql
```

### Verify Deployment

Test your API endpoints:
```bash
# Health check
curl https://your-app-name.onrender.com/api/health

# Search endpoint
curl https://your-app-name.onrender.com/api/search?q=test

# Categories
curl https://your-app-name.onrender.com/api/categories

# Products
curl https://your-app-name.onrender.com/api/products
```

## Troubleshooting

### Search Endpoint Not Working

If `/api/search` returns errors:

1. **Check Database Connection**
   ```bash
   curl https://your-app-name.onrender.com/api/health
   ```

2. **Verify Database Schema**
   - Ensure all migrations have been run
   - Check that tables have required columns
   - Verify data exists (run seedDb.js)

3. **Check Logs**
   - Go to Render dashboard → Logs
   - Look for SQL errors or connection issues

4. **Common Issues:**
   - **"relation does not exist"** → Run migrations
   - **"column does not exist"** → Run add_missing_columns.sql
   - **Empty results** → Run seedDb.js
   - **ILIKE not recognized** → Database is not PostgreSQL

### Database Issues

**Reset Database:**
```bash
# Connect to database
psql $DATABASE_URL

# Drop and recreate tables
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Run migrations again
\i migrations/init_schema_postgres.sql
\i migrations/add_missing_columns.sql
```

### Environment-Specific Issues

**Check environment variables:**
```bash
# In Render shell
echo $DATABASE_URL
echo $NODE_ENV
```

**Database connection format:**
```
postgresql://username:password@host:port/database
```

## Production Checklist

Before going live:
- [ ] All migrations executed
- [ ] Database seeded with initial data
- [ ] Environment variables configured
- [ ] Health check endpoint responding
- [ ] All API endpoints tested
- [ ] JWT_SECRET is secure and unique
- [ ] CORS configured for your frontend domain
- [ ] Error logging enabled
- [ ] Database backups configured (Render Pro feature)

## Updating Production

To deploy updates:
```bash
git add .
git commit -m "Your update message"
git push origin main
```

Render will automatically:
1. Detect the push
2. Build the new version
3. Deploy with zero downtime
4. Roll back if health check fails

## Performance Tips

1. **Database Indexing**
   - Indexes are created automatically by migrations
   - Monitor slow queries in Render dashboard

2. **Caching**
   - Consider adding Redis for frequently accessed data
   - Cache product listings and category data

3. **Connection Pooling**
   - Already configured in `server/models/database.js`
   - Adjust pool size based on traffic

4. **Monitoring**
   - Use Render metrics dashboard
   - Set up alerts for errors
   - Monitor response times

## Support

- Render Docs: https://render.com/docs
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Issue Tracker: [Your GitHub Issues URL]
