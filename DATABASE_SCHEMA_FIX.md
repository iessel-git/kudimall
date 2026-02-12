# Database Schema Fix: Sellers Email Column

## Problem
When attempting to create a seller account, users encountered the error:
```
⚠️ column "email" does not exist
```

This occurred because the database was initialized with the basic schema from `init_schema_postgres.sql` but the migration to add the `email` column to the sellers table (`add_missing_columns.sql`) was never applied.

## Database Requirements
**This application requires PostgreSQL.** The fix uses PostgreSQL-specific features:
- `information_schema.columns` for column detection
- `ADD COLUMN IF NOT EXISTS` syntax
- `DO $$ ... END $$` blocks for conditional constraints

## Root Cause
The original server startup logic only ran database initialization when:
1. The database was completely empty (categories table empty), OR
2. Tables didn't exist at all

If the database had been partially initialized with the basic schema (sellers table existed without the email column), the auto-initialization wouldn't run, causing the signup to fail.

## Solution
Updated the server startup logic in `server/index.js` to:
1. **Always check** for the presence of the `email` column in the sellers table on startup
2. **Run initDb migration** if the column is missing (safe to run multiple times due to `ADD COLUMN IF NOT EXISTS`)
3. **Better error handling** in the signup endpoint to detect and report schema issues

## Changes Made

### 1. Server Startup Logic (`server/index.js`)
```javascript
// New logic checks for email column specifically
const columns = await db.all(`
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'sellers' AND column_name = 'email'
`);

if (!columns || columns.length === 0) {
  console.log('⚠️  Sellers table missing email column, running migration...');
  await initDb();
}
```

### 2. Signup Endpoint Error Handling (`server/routes/auth.js`)
Added try-catch around the existing seller check with specific handling for missing column errors:
```javascript
try {
  const existingSeller = await db.get(
    'SELECT * FROM sellers WHERE email = $1',
    [email]
  );
  // ... existing code
} catch (dbError) {
  if (dbError.message.includes('column') && dbError.message.includes('email')) {
    return res.status(503).json({
      error: 'Database configuration error',
      message: 'The database schema needs to be updated. Please restart the server to auto-migrate.'
    });
  }
  throw dbError;
}
```

### 3. Test Script (`server/test-db-init.js`)
Created a comprehensive test script to verify:
- Sellers table exists
- Email column exists
- All required columns for signup are present
- Schema can be successfully migrated

## Testing

### Manual Testing (When Database is Available)
1. **Test database initialization:**
   ```bash
   cd server
   node test-db-init.js
   ```

2. **Test server startup:**
   ```bash
   npm run server:start
   ```
   - Should see: `✓ Database schema is up to date` if email column exists
   - OR: `⚠️ Sellers table missing email column, running migration...` followed by `✅ Database schema initialized successfully`

3. **Test seller signup:**
   ```bash
   curl -X POST http://localhost:5000/api/auth/seller/signup \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Store",
       "email": "test@example.com",
       "password": "password123",
       "phone": "+1234567890",
       "location": "Test City",
       "description": "Test store description"
     }'
   ```

### Deployment Testing
1. **On Render/Production:**
   - The server will automatically check and migrate on startup
   - Check logs for: `✓ Database schema is up to date` or migration messages
   - If issues persist, use the manual migration endpoint (development only):
     ```bash
     POST /api/debug/migrate
     ```

2. **Verify with debug endpoint (development only):**
   ```bash
   curl http://localhost:5000/api/debug/schema
   ```
   - Should show `hasEmailColumn: true`
   - Should list all columns including email

## Migration Safety
The `initDb.js` script uses `ADD COLUMN IF NOT EXISTS`, making it:
- **Idempotent**: Safe to run multiple times
- **Non-destructive**: Won't affect existing data
- **Backwards compatible**: Works with both new and existing databases

## Files Modified
1. `server/index.js` - Enhanced startup database check
2. `server/routes/auth.js` - Better error handling for schema issues
3. `server/test-db-init.js` - New test script (for verification)

## Rollback Plan
If issues occur:
1. The changes are additive and don't remove any existing functionality
2. The old startup logic is still preserved (seeding when database is empty)
3. Manual migration endpoint still available: `POST /api/debug/migrate`

## Additional Notes
- The `email` column is added with other critical columns (name, slug, password, etc.)
- Unique constraints are added to prevent duplicate emails
- The fix addresses not just email, but ensures all 19 required seller columns exist
- This fix will automatically resolve the issue on next server restart
