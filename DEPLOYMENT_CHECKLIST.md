# Deployment Checklist: Seller Account Fix

## Pre-Deployment Verification
- [x] Code changes completed
- [x] Syntax validation passed
- [x] Code review completed
- [x] Security scan passed (0 vulnerabilities)
- [x] Documentation created
- [x] Test scripts created

## Deployment Steps

### 1. Merge Pull Request
```bash
# Review the PR on GitHub
# Merge copilot/create-seller-account into main
```

### 2. Deploy to Production
**For Render:**
- Push triggers auto-deploy OR
- Manually trigger deploy from Render dashboard

**For Heroku:**
```bash
git push heroku main
```

### 3. Monitor Server Startup
Watch the logs for:
```
⚠️  Sellers table missing email column, running migration...
🔧 Running database initialization...
✅ Database schema initialized successfully
```

OR (if already migrated):
```
✓ Database schema is up to date
```

### 4. Verify Database Schema
**Option A: Use debug endpoint (development only)**
```bash
curl https://your-app.com/api/debug/schema
```

**Option B: Direct database query**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sellers' AND column_name = 'email';
```

Expected result: One row with `email` column details

### 5. Test Seller Signup
**Via API:**
```bash
curl -X POST https://your-app.com/api/auth/seller/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Store",
    "email": "test-' $(date +%s) '@example.com",
    "password": "testpass123",
    "phone": "+1234567890",
    "location": "Test City",
    "description": "Test store for verification"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Seller account created successfully!...",
  "emailVerificationRequired": true,
  "seller": {
    "id": 1,
    "name": "Test Store",
    "email": "test-...",
    "slug": "test-store",
    "email_verified": false
  }
}
```

**Via UI:**
1. Navigate to `/start-selling` or seller signup page
2. Fill in the form:
   - Store Name: "My Test Store"
   - Email: unique email address
   - Password: minimum 6 characters
   - Phone, Location (optional)
3. Submit form
4. Verify success message appears
5. Check that verification email is sent (if configured)

### 6. Verify Email Verification Flow (If Email Configured)
1. Check email inbox for verification email
2. Click verification link
3. Verify account can login after verification

## Post-Deployment Verification

### Success Indicators
- [ ] Server starts without errors
- [ ] Migration logs show success or "schema up to date"
- [ ] Seller signup works via API
- [ ] Seller signup works via UI
- [ ] No "column email does not exist" errors in logs
- [ ] Email verification flow works (if configured)

### Rollback Triggers
If any of these occur, consider rollback:
- ❌ Server fails to start
- ❌ Migration fails with errors
- ❌ Seller signup still fails
- ❌ Data corruption or loss

## Rollback Procedure (If Needed)

### Step 1: Revert Deployment
**For Render:**
- Go to dashboard → Rollback to previous version

**For Heroku:**
```bash
heroku releases:rollback
```

### Step 2: Fix Issues
- Review error logs
- Identify the problem
- Test fix locally
- Redeploy

### Step 3: Manual Database Fix (Last Resort)
If migration didn't run, manually execute:
```sql
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;
-- Add UNIQUE constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sellers_email_key'
  ) THEN
    ALTER TABLE sellers ADD CONSTRAINT sellers_email_key UNIQUE (email);
  END IF;
END $$;
```

## Monitoring

### First 24 Hours
Monitor for:
- Server uptime and health
- Seller signup success rate
- Error logs for database issues
- Email delivery (if configured)

### First Week
Track metrics:
- Number of new seller signups
- Signup completion rate
- Email verification rate
- Error rate compared to baseline

## Support

### Common Issues

**Issue: Migration doesn't run**
- Solution: Manually trigger via `/api/debug/migrate` (dev only) or restart server

**Issue: Email verification fails**
- Solution: Check email configuration (EMAIL_USER, EMAIL_PASSWORD, etc.)
- See: EMAIL_SETUP_GUIDE.md

**Issue: Duplicate email errors**
- Solution: Expected behavior - email must be unique per seller

**Issue: Old sellers can't login**
- Solution: They need to verify their email if created after this fix

## Documentation References
- [FIX_SUMMARY.md](./FIX_SUMMARY.md) - Complete fix overview
- [DATABASE_SCHEMA_FIX.md](./DATABASE_SCHEMA_FIX.md) - Technical details
- [QUICK_FIX_EMAIL_COLUMN.md](./QUICK_FIX_EMAIL_COLUMN.md) - Quick reference

## Sign-off
- [ ] Deployment tested in staging (if available)
- [ ] Production deployment completed
- [ ] All verification steps passed
- [ ] Monitoring in place
- [ ] Documentation updated
- [ ] Team notified

Deployed by: _____________  
Date: _____________  
Verified by: _____________  
Date: _____________
