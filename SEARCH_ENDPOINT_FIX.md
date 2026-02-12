# Quick Fix: Search Endpoint Not Working on Production

## Problem
`https://kudimall.onrender.com/api/search` is not working

## Quick Diagnosis

### 1. Check if API is running
```bash
curl https://kudimall.onrender.com/api/health
```

**Expected:** `{"status":"ok","message":"KudiMall API is running"}`

**If fails:** API server is not running. Check Render dashboard for deployment status.

### 2. Check database connection
```bash
curl https://kudimall.onrender.com/api/categories
```

**Expected:** Array of categories
**If empty or error:** Database not connected or not seeded

### 3. Test search endpoint
```bash
curl "https://kudimall.onrender.com/api/search?q=test"
```

**Expected:** `{"products":[],"sellers":[],"categories":[]}`
**If error:** Check Render logs for SQL errors

## Common Issues & Fixes

### Issue 1: "Cannot resolve host"
**Cause:** Domain not configured or DNS not propagated
**Fix:** 
- Check Render dashboard for custom domain setup
- Wait for DNS propagation (up to 24 hours)
- Use Render subdomain: `https://your-app.onrender.com`

### Issue 2: Empty search results
**Cause:** Database not seeded
**Fix:**
```bash
# Option 1: Use Render Shell
# In Render dashboard: Shell tab
cd server
node scripts/seedDb.js

# Option 2: Use seed API endpoint
curl -X POST https://kudimall.onrender.com/api/seed-database
```

### Issue 3: "relation does not exist" error
**Cause:** Database migrations not run
**Fix:**
```bash
# In Render Shell or local with connection string
psql $DATABASE_URL -f migrations/init_schema_postgres.sql
psql $DATABASE_URL -f migrations/add_missing_columns.sql
```

### Issue 4: "connect ECONNREFUSED"
**Cause:** DATABASE_URL not set or incorrect
**Fix:**
1. Go to Render dashboard → Environment
2. Verify `DATABASE_URL` is set correctly
3. Format: `postgresql://username:password@host:port/database`
4. Restart service after updating

### Issue 5: 500 Internal Server Error
**Cause:** Various - check logs
**Fix:**
1. Go to Render dashboard → Logs
2. Look for error messages
3. Common causes:
   - Missing environment variables
   - Database column mismatch
   - SQL syntax errors (should be fixed in this PR)

## Environment Variables Checklist

Verify these are set in Render dashboard:

```
✅ NODE_ENV=production
✅ PORT=5000
✅ DATABASE_URL=[from Render PostgreSQL]
✅ JWT_SECRET=[generated securely]
✅ FRONTEND_URL=https://your-domain.com
```

## Deployment Checklist

- [ ] Code merged to main branch
- [ ] Render service created and connected to repo
- [ ] PostgreSQL database created in Render
- [ ] Environment variables configured
- [ ] Database migrations executed
- [ ] Database seeded with test data
- [ ] Health check responds successfully
- [ ] Search endpoint returns valid JSON

## Testing Commands

```bash
# 1. Health check
curl https://kudimall.onrender.com/api/health

# 2. Categories (tests DB connection)
curl https://kudimall.onrender.com/api/categories

# 3. Search all
curl "https://kudimall.onrender.com/api/search?q=test"

# 4. Search products only
curl "https://kudimall.onrender.com/api/search?q=test&type=products"

# 5. Search with pagination
curl "https://kudimall.onrender.com/api/search?q=test&page=1&limit=10"
```

## Recent Changes (This PR)

✅ **Search endpoint now has improved error handling**
- Returns empty arrays instead of crashing
- Logs errors for debugging
- Works even if database connection temporarily fails

✅ **Database configuration supports production**
- Uses `DATABASE_URL` environment variable
- SSL support for Render PostgreSQL
- Backward compatible with local development

✅ **Deployment files added**
- `render.yaml` for automatic deployment
- `DEPLOYMENT.md` with full guide
- `.env.example` updated with all options

## Still Not Working?

1. **Check Render Logs** (Dashboard → Logs tab)
   - Look for error messages
   - Check database connection errors
   - Verify SQL queries

2. **Verify Database State**
   ```bash
   # Connect to database
   psql $DATABASE_URL
   
   # Check tables exist
   \dt
   
   # Check categories table has data
   SELECT COUNT(*) FROM categories;
   
   # Check products table
   SELECT COUNT(*) FROM products;
   ```

3. **Test Locally First**
   ```bash
   # Set DATABASE_URL to Render database
   export DATABASE_URL="postgresql://..."
   
   # Start server
   cd server && npm start
   
   # Test search
   curl "http://localhost:5000/api/search?q=test"
   ```

4. **Contact Support**
   - Include Render logs
   - Include curl command and response
   - Include database query results

## Expected Behavior After Fix

```bash
$ curl "https://kudimall.onrender.com/api/search?q=rice"
{
  "products": [
    {
      "id": 1,
      "name": "Rice 5kg",
      "description": "Premium Jasmine Rice",
      "price": "40.00",
      ...
    }
  ],
  "sellers": [],
  "categories": []
}
```

## Resources

- Full deployment guide: `DEPLOYMENT.md`
- Render documentation: https://render.com/docs
- PostgreSQL setup: See `DEPLOYMENT.md` section on database initialization
