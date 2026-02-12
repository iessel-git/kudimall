# Quick Fix Guide: "column email does not exist" Error

## Error
```
⚠️ column "email" does not exist
```

## Quick Solution
**Simply restart the server** - it will automatically detect and fix the missing column!

```bash
# Stop the server (Ctrl+C if running)
# Then start it again:
npm run server:start
# OR
cd server && node index.js
```

You should see in the logs:
```
⚠️  Sellers table missing email column, running migration...
🔧 Running database initialization...
✅ Database schema initialized successfully
```

## Alternative: Manual Migration (Development Only)
If you need to migrate without restarting:

```bash
# Make a POST request to the migration endpoint
curl -X POST http://localhost:5000/api/debug/migrate

# Or if the server is not running, run the init script directly:
cd server
node scripts/initDb.js
```

## What Was Fixed?
1. **Server now auto-detects** missing email column on startup
2. **Automatically runs migration** if column is missing
3. **Better error messages** if schema issue occurs during signup

## Testing
After restart, test the seller signup:

```bash
curl -X POST http://localhost:5000/api/auth/seller/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Store",
    "email": "mystore@example.com",
    "password": "securepassword123",
    "phone": "+1234567890",
    "location": "My City",
    "description": "My awesome store"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Seller account created successfully! Please check your email to verify your account.",
  "emailVerificationRequired": true,
  "seller": {
    "id": 1,
    "name": "My Store",
    "email": "mystore@example.com",
    "slug": "my-store",
    "email_verified": false
  }
}
```

## For Production (Render/Heroku)
The fix will automatically apply on next deployment:
1. Push the changes to your repository
2. Trigger a new deployment (or wait for auto-deploy)
3. The server will detect and fix the schema on startup

## Need Help?
See [DATABASE_SCHEMA_FIX.md](./DATABASE_SCHEMA_FIX.md) for detailed technical information.
