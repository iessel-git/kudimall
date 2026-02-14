# KudiMall - Supabase Deployment Guide

## 🚀 Complete Migration Checklist

### Phase 1: Database Setup (15 minutes)

#### Step 1: Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Configure:
   - **Name:** `kudimall-production`
   - **Database Password:** Generate strong password (SAVE IT!)
   - **Region:** Choose closest to Nigeria (e.g., `eu-west-1` or `us-east-1`)
4. Click **"Create new project"**
5. Wait ~2 minutes for project to initialize

#### Step 2: Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Open file: `server/migrations/supabase_full_schema.sql`
4. Copy entire contents
5. Paste into SQL Editor
6. Click **"Run"** (bottom right)
7. ✅ You should see "Success. No rows returned"

#### Step 3: Add Seed Categories (Optional but Recommended)
Run this in SQL Editor:
```sql
INSERT INTO categories (name, slug, description, is_featured, display_order) VALUES
('Electronics', 'electronics', 'Phones, gadgets, and accessories', TRUE, 1),
('Fashion', 'fashion', 'Clothing and accessories', TRUE, 2),
('Groceries', 'groceries', 'Food and beverages', TRUE, 3),
('Health & Beauty', 'health-beauty', 'Health and beauty products', FALSE, 4),
('Home & Garden', 'home-garden', 'Home and garden essentials', FALSE, 5),
('Sports & Outdoors', 'sports-outdoors', 'Sports and outdoor gear', FALSE, 6),
('Books & Media', 'books-media', 'Books, movies, and music', FALSE, 7),
('Toys & Games', 'toys-games', 'Toys and games for all ages', FALSE, 8),
('Automotive', 'automotive', 'Automotive parts and accessories', FALSE, 9),
('Pet Supplies', 'pet-supplies', 'Pet food and supplies', FALSE, 10),
('Office Supplies', 'office-supplies', 'Office and school supplies', FALSE, 11),
('Art & Crafts', 'art-crafts', 'Art and craft materials', FALSE, 12)
ON CONFLICT (slug) DO NOTHING;
```

#### Step 4: Get Database Connection String
1. Go to **Project Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **Connection pooling** (Transaction mode)
4. Copy the URI (looks like):
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual database password
6. **SAVE THIS** - you'll need it next

---

### Phase 2: Deploy Backend (Choose ONE option)

#### Option A: Railway (Easiest - Recommended)
1. Go to https://railway.app
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `kudimall` repository → **server** folder
4. Railway will auto-detect Node.js
5. Add environment variables (see Phase 3)
6. Click **"Deploy"**
7. Get your Railway URL: `https://kudimall-production.up.railway.app`

#### Option B: Render (Free Alternative)
1. Keep your existing Render setup
2. Just update the `DATABASE_URL` to Supabase connection string
3. Redeploy

#### Option C: VPS/DigitalOcean (Advanced)
1. Set up Ubuntu server
2. Install Node.js, PM2, Nginx
3. Clone repo and run server
4. Configure environment variables

---

### Phase 3: Environment Variables

Add these to your hosting platform (Railway/Render/VPS):

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres

# Alternative format (if needed)
DB_HOST=aws-0-region.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
DB_USER=postgres.xxxxx
DB_PASSWORD=your-database-password

# Server
PORT=5000
NODE_ENV=production
AUTO_SEED_ON_START=false

# JWT Secret (same as before)
JWT_SECRET=93060655dbe72e899f9232e53a6a7a3207e7a86a09b4a267ca5961442f8cf270

# Email Configuration (Hostinger SMTP)
EMAIL_USER=kudimall@csetechsolution.com
EMAIL_PASSWORD=@Dominase12$
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_REQUIRE_TLS=false
EMAIL_SENDER_NAME=KudiMall
EMAIL_SEND_TIMEOUT_MS=60000

# Frontend URL
FRONTEND_URL=https://your-vercel-app.vercel.app
PUBLIC_FRONTEND_URL=https://your-vercel-app.vercel.app

# Admin Secret (for production cleanup endpoint)
ADMIN_SECRET=your-strong-secret-key-here
```

---

### Phase 4: Frontend Deployment (Vercel)

#### Step 1: Update Frontend API URL
1. Open `client/.env.production`
2. Update:
   ```env
   REACT_APP_API_URL=https://your-railway-app.up.railway.app/api
   # OR
   REACT_APP_API_URL=https://your-render-app.onrender.com/api
   ```

#### Step 2: Deploy to Vercel
1. Go to https://vercel.com
2. Click **"Add New"** → **"Project"**
3. Import `kudimall` GitHub repo
4. Configure:
   - **Root Directory:** `client`
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `build` (default)
5. Add environment variable:
   ```
   REACT_APP_API_URL=https://your-backend-url/api
   ```
6. Click **"Deploy"**
7. Get your Vercel URL: `https://kudimall.vercel.app`

#### Step 3: Update Backend FRONTEND_URL
Go back to your backend hosting (Railway/Render) and update:
```env
FRONTEND_URL=https://kudimall.vercel.app
PUBLIC_FRONTEND_URL=https://kudimall.vercel.app
```

---

### Phase 5: Post-Deployment Testing

#### Test 1: Health Check
```powershell
Invoke-RestMethod -Uri "https://your-backend-url/api/health"
```
Expected: `{ status: "ok", message: "KudiMall API is running" }`

#### Test 2: Categories
```powershell
Invoke-RestMethod -Uri "https://your-backend-url/api/categories"
```
Expected: Array of 12 categories

#### Test 3: Email Configuration
```powershell
$body = @{ email = "kudimall@csetechsolution.com" } | ConvertTo-Json
Invoke-RestMethod -Uri "https://your-backend-url/api/test-email" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```
Expected: Test email sent successfully

#### Test 4: Database Connection
Check Railway/Render logs for:
- ✅ "Database schema is up to date"
- ✅ "KudiMall API Server running on port 5000"
- ❌ NO database connection errors

---

### Phase 6: Data Migration (If needed)

If you want to migrate existing data from Render to Supabase:

#### Option 1: Using pg_dump (Recommended)
```bash
# Export from Render
pg_dump $RENDER_DATABASE_URL > kudimall_backup.sql

# Import to Supabase
psql $SUPABASE_DATABASE_URL < kudimall_backup.sql
```

#### Option 2: Using Supabase Dashboard
1. Go to **Database** → **Extensions**
2. Enable `pg_dump` and `pg_restore`
3. Use **Database** → **Backups** to restore

#### Option 3: Manual Export/Import
1. Export products, sellers, etc. to CSV from Render database
2. Import CSVs via Supabase Table Editor

---

### Phase 7: Production Cleanup

Once everything is working on Supabase:

#### Clean Production Data
```powershell
$headers = @{
    "Content-Type" = "application/json"
    "x-admin-secret" = "your-admin-secret"
}

Invoke-RestMethod -Uri "https://your-backend-url/api/production-cleanup" `
  -Method POST `
  -Headers $headers
```

This will:
- ✅ Remove duplicate categories
- ✅ Remove duplicate products
- ✅ Keep only 5 oldest sellers

---

## 🎯 Quick Start Checklist

- [ ] Create Supabase project
- [ ] Run schema SQL in Supabase SQL Editor
- [ ] Get database connection string
- [ ] Deploy backend to Railway with Supabase DATABASE_URL
- [ ] Add all environment variables
- [ ] Deploy frontend to Vercel
- [ ] Update frontend API URL
- [ ] Test health endpoint
- [ ] Test email configuration
- [ ] Run production cleanup (if needed)
- [ ] Verify seller registration works
- [ ] Verify product listing works

---

## 🐛 Troubleshooting

### Backend won't start
- Check logs for database connection errors
- Verify DATABASE_URL is correct
- Ensure database password has no special characters that need escaping

### Email not sending
- Run `/api/test-email` endpoint
- Check Railway/Render logs for SMTP errors
- Verify EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD are correct

### Frontend can't reach backend
- Check CORS settings in backend
- Verify REACT_APP_API_URL is correct
- Check browser console for errors

### Database connection pooler errors
- Use **Transaction mode** connection string (port 6543)
- Don't use **Session mode** (port 5432) - not compatible with serverless

---

## 📞 Support

If you encounter issues:
1. Check Supabase docs: https://supabase.com/docs
2. Check Railway docs: https://docs.railway.app
3. Check server logs for detailed error messages
4. Test each endpoint individually

---

## 🎉 Success!

Once all checkboxes are complete, your KudiMall marketplace is live on Supabase!

- **Database:** Supabase PostgreSQL (scalable, managed)
- **Backend:** Railway/Render (auto-deploys from GitHub)
- **Frontend:** Vercel (global CDN, fast)
- **Email:** Hostinger SMTP (professional domain)

Your app is now production-ready! 🚀
