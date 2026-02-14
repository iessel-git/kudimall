# 📋 Critical Production Fixes Checklist

## 🔴 IMMEDIATE ACTIONS (Required Before Launch)

### 1. Fix JWT_SECRET Fallbacks (30 minutes)

#### Files to Fix:
- [ ] `server/routes/payment.js` (line 7)
- [ ] `server/routes/orders.js` (line 7)  
- [ ] `server/routes/deliveryAuth.js` (line 7)
- [ ] `server/routes/cart.js` (line 6)

#### Change Required:
```javascript
// ❌ REMOVE THIS:
const JWT_SECRET = process.env.JWT_SECRET || 'kudimall_buyer_secret_key_2024';

// ✅ REPLACE WITH THIS:
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV !== 'test') {
  const logger = require('../utils/logger');
  logger.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}
```

### 2. Add Database Indexes (2 minutes)

```bash
# Run the migration:
psql $DATABASE_URL -f server/migrations/add_flash_deals_indexes.sql

# Or if using local dev:
psql -U postgres -d kudimall_dev -f server/migrations/add_flash_deals_indexes.sql
```

### 3. Test Flash Deals Quantity (15 minutes)

Manual testing steps:
1. Create a flash deal with quantity_available = 2
2. Purchase 1 item → verify quantity_sold = 1
3. Purchase 1 more → verify quantity_sold = 2
4. Try to purchase again → should show out of stock

---

## 🟡 HIGH PRIORITY (This Week)

### 4. Setup Error Monitoring

```bash
cd server
npm install @sentry/node
```

Add to `.env`:
```
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

Add to `server/index.js` (after dotenv config):
```javascript
const Sentry = require('@sentry/node');

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1
  });
  console.log('✅ Sentry error monitoring enabled');
}

// ... rest of your code

// Add before app.listen():
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}
```

### 5. Migrate Console Statements to Logger

Files to update:
- [ ] `server/routes/wishlist.js` (5 occurrences)
- [ ] `server/routes/sellerManagement.js` (13 occurrences)
- [ ] `server/routes/sellerApplications.js` (4 occurrences)
- [ ] `server/routes/orders.js` (3 occurrences)
- [ ] `server/routes/cart.js` (check for occurrences)
- [ ] `server/routes/payment.js` (check for occurrences)

Replace pattern:
```javascript
// ❌ REMOVE:
console.error('Error message:', error);
console.log('Info message');
console.warn('Warning');

// ✅ REPLACE WITH:
const logger = require('../utils/logger');
logger.error('Error message', { error, context: 'route-name' });
logger.info('Info message', { data });
logger.warn('Warning', { details });
```

### 6. Add Compression Middleware

```bash
cd server
npm install compression
```

Add to `server/index.js`:
```javascript
const compression = require('compression');
app.use(compression());
```

---

## 🟢 RECOMMENDED (Next 2 Weeks)

### 7. Add Input Validation

```bash
cd server
npm install express-validator
```

Example usage in routes:
```javascript
const { body, validationResult } = require('express-validator');

router.post('/deals',
  authenticateToken,
  [
    body('product_id').isInt().withMessage('Invalid product ID'),
    body('deal_price').isFloat({ min: 0 }).withMessage('Invalid price'),
    body('quantity_available').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('starts_at').isISO8601().withMessage('Invalid start date'),
    body('ends_at').isISO8601().withMessage('Invalid end date')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... rest of route
  }
);
```

### 8. Setup Uptime Monitoring

1. Sign up at https://uptimerobot.com (Free)
2. Add monitors for:
   - Main website: `https://your-domain.com`
   - API health: `https://your-domain.com/api/health`
   - Categories endpoint: `https://your-domain.com/api/categories`
3. Set alert emails/SMS

### 9. Reduce JWT Token Expiry

In `server/routes/buyerAuth.js` and similar:
```javascript
// ❌ CURRENT (too long):
expiresIn: '30d'

// ✅ RECOMMENDED:
expiresIn: '7d'
```

Then implement token refresh endpoint.

---

## ✅ VERIFICATION CHECKLIST

After completing fixes, verify:

- [ ] Server starts without JWT_SECRET errors
- [ ] All 4 files have proper JWT validation
- [ ] Database indexes created successfully
- [ ] Flash deals quantity tracking works
- [ ] Sentry captures test errors
- [ ] Logs written to files (not console)
- [ ] Gzip compression active (check response headers)
- [ ] No hardcoded secrets in any file
- [ ] All tests still pass: `npm test`
- [ ] Production build succeeds: `npm run build`

---

## 🚀 LAUNCH CHECKLIST

Before going to production:

### Environment Variables Set:
- [ ] `JWT_SECRET` (strong 64-char random string)
- [ ] `DATABASE_URL` (production database)
- [ ] `PAYSTACK_SECRET_KEY` (production key)
- [ ] `PAYSTACK_PUBLIC_KEY` (production key)
- [ ] `EMAIL_USER` (production email)
- [ ] `EMAIL_PASSWORD` (app password)
- [ ] `FRONTEND_URL` (production domain)
- [ ] `SENTRY_DSN` (error monitoring)
- [ ] `NODE_ENV=production`

### Security:
- [ ] All JWT_SECRET fallbacks removed
- [ ] Rate limiting active on auth endpoints
- [ ] Helmet security headers enabled
- [ ] CORS properly configured
- [ ] Database connection uses SSL

### Performance:
- [ ] Database indexes created
- [ ] Compression middleware active
- [ ] Connection pooling configured
- [ ] Static assets served efficiently

### Monitoring:
- [ ] Sentry error tracking active
- [ ] UptimeRobot monitoring setup
- [ ] Log files rotating properly
- [ ] Health check endpoint responding

### Database:
- [ ] All migrations run
- [ ] Backup strategy in place
- [ ] Connection string uses SSL
- [ ] Indexes on all foreign keys

### Testing:
- [ ] Critical paths tested manually
- [ ] Payment flow verified
- [ ] Flash deals tested
- [ ] Order creation tested
- [ ] Email notifications working

---

## 📊 Success Metrics

After launch, monitor:

1. **Error Rate:** < 0.1% (Sentry)
2. **Uptime:** > 99.9% (UptimeRobot)
3. **Response Time:** < 500ms (p95)
4. **Database Connections:** < 80% of pool
5. **Flash Deals Conflicts:** 0 overselling incidents

---

## 🆘 Emergency Contacts

- **Hosting:** Render.com support
- **Database:** PostgreSQL admin
- **Payment:** Paystack support (support@paystack.com)
- **SSL:** Let's Encrypt / Render SSL
- **Monitoring:** Sentry support

---

## 📝 Notes

- Estimated total time for critical fixes: **30-45 minutes**
- Estimated time for high priority: **3-4 hours**
- Score after critical fixes: **92/100** 🟢
- Score after all fixes: **100/100** 🎯

**Priority Order:**
1. JWT security (30 min) - CRITICAL ⚠️
2. Database indexes (2 min) - HIGH 🟡
3. Sentry setup (15 min) - HIGH 🟡
4. Logger migration (1 hour) - HIGH 🟡
5. Everything else - MEDIUM/LOW 🟢

---

*Last Updated: February 13, 2026*
*See PRODUCTION_AUDIT_FEB_2026.md for full details*
