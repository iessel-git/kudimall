const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { createEmailTransporter, getFrontendBaseUrl, getSmtpConfig } = require('./utils/emailConfig');

const serverEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`${serverEnvPath} not found; falling back to root .env or existing environment variables`);
  }
  dotenv.config();
}

// Initialize logger after dotenv config
const logger = require('./utils/logger');

// Detect production: NODE_ENV, RENDER env var, or DATABASE_URL
const IS_PRODUCTION = process.env.NODE_ENV === 'production' || !!process.env.RENDER || !!process.env.DATABASE_URL;

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  let host;
  try {
    host = new URL(origin).host;
  } catch (error) {
    return false;
  }

  return allowedOrigins.some((allowed) => {
    if (!allowed.includes('*')) {
      return false;
    }

    const normalized = allowed.replace(/^https?:\/\//, '');
    if (normalized.startsWith('*.')) {
      const suffix = normalized.slice(1);
      return host.endsWith(suffix);
    }

    return false;
  });
};

// Security: Add helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://kudimall.vercel.app', 'https://kudimall.onrender.com'],
      fontSrc: ["'self'", 'https:', 'data:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Cookie parser for HttpOnly JWT cookies
app.use(cookieParser());

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Security: Global rate limiting for all API routes
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health', // Don't rate limit health checks
});
app.use('/api', globalLimiter);

// Security: Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));

const uploadsDir = path.join(__dirname, 'uploads');
const deliveryProofDir = path.join(uploadsDir, 'delivery-proofs');
if (!fs.existsSync(deliveryProofDir)) {
  fs.mkdirSync(deliveryProofDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));

// Cookie-to-header middleware: extract JWT from HttpOnly cookie if no Authorization header
app.use((req, res, next) => {
  if (!req.headers.authorization && req.cookies) {
    const path = req.path;
    let cookieName = null;
    if (path.startsWith('/api/delivery') || path.startsWith('/api/delivery-auth')) {
      cookieName = 'delivery_token';
    } else if (path.startsWith('/api/auth/seller') || path.startsWith('/api/seller')) {
      cookieName = 'seller_token';
    } else {
      cookieName = 'buyer_token';
    }
    const cookieToken = req.cookies[cookieName];
    if (cookieToken) {
      req.headers.authorization = `Bearer ${cookieToken}`;
    }
  }
  next();
});

// Routes
const categoryRoutes = require('./routes/categories');
const sellerRoutes = require('./routes/sellers');
const productRoutes = require('./routes/products');
const searchRoutes = require('./routes/search');
const reviewRoutes = require('./routes/reviews');
const orderRoutes = require('./routes/orders');
const sellerApplicationRoutes = require('./routes/sellerApplications');
const adminSellerVerificationRoutes = require('./routes/adminSellerVerification');
const { router: authRoutes } = require('./routes/auth');
const sellerManagementRoutes = require('./routes/sellerManagement');
const { router: buyerAuthRoutes } = require('./routes/buyerAuth');
const buyerManagementRoutes = require('./routes/buyerManagement');
const { router: deliveryAuthRoutes } = require('./routes/deliveryAuth');
const deliveryManagementRoutes = require('./routes/deliveryManagement');
const wishlistRoutes = require('./routes/wishlist');
const cartRoutes = require('./routes/cart');
const dealsRoutes = require('./routes/deals');
const amaRoutes = require('./routes/ama');
const paymentRoutes = require('./routes/payment');
const paystackWebhookRoutes = require('./routes/paystackWebhook');
const setupRoutes = require('./routes/setup'); // Database setup route
const emailTestRoutes = require('./routes/emailTest'); // Email test route

app.use('/api/categories', categoryRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/seller-applications', sellerApplicationRoutes);
app.use('/api/admin', adminSellerVerificationRoutes);
// Apply rate limiting to authentication endpoints
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/seller', sellerManagementRoutes);
app.use('/api/buyer-auth/login', authLimiter);
app.use('/api/buyer-auth/signup', authLimiter);
app.use('/api/buyer-auth', buyerAuthRoutes);
app.use('/api/buyer', buyerManagementRoutes);
app.use('/api/delivery-auth/login', authLimiter);
app.use('/api/delivery-auth', deliveryAuthRoutes);
app.use('/api/delivery', deliveryManagementRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/deals', dealsRoutes);
app.use('/api/ama', amaRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/webhooks/paystack', paystackWebhookRoutes);
// Email test and setup routes - ONLY available in development
if (!IS_PRODUCTION) {
  app.use('/api/auth', emailTestRoutes);
  app.use('/api/setup', setupRoutes);
}

// Root route - minimal API info (no endpoint map in production)
app.get('/', (req, res) => {
  res.json({
    name: 'KudiMall API',
    version: '2.0.0',
    status: 'running',
    message: 'Welcome to KudiMall API'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KudiMall API is running' });
});

// Test email - development only
if (!IS_PRODUCTION) {
  app.post('/api/test-email', async (req, res) => {
    try {
      const { sendMailWithFallback, getEmailSender } = require('./utils/emailConfig');
      const testEmail = req.body.email || process.env.EMAIL_USER;
      if (!testEmail) return res.status(400).json({ error: 'No email provided' });
      await sendMailWithFallback({
        from: getEmailSender(),
        to: testEmail,
        subject: 'KudiMall Email Test',
        html: '<p>Email is working correctly.</p>'
      });
      res.json({ status: 'success', message: 'Test email sent' });
    } catch (error) {
      console.error('Test email failed:', error);
      res.status(500).json({ status: 'error', message: 'Email test failed' });
    }
  });
}

// Database schema verification endpoint (for debugging - restricted to development)
app.get('/api/debug/schema', async (req, res) => {
  // Only allow in development environment
  if (IS_PRODUCTION) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This endpoint is only available in development mode'
    });
  }
  
  try {
    const db = require('./models/database');
    
    // Check sellers table columns
    const sellersColumns = await db.all(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'sellers'
      ORDER BY ordinal_position;
    `);
    
    // Check if email column exists
    const hasEmailColumn = sellersColumns.some(col => col.column_name === 'email');
    
    // Get table counts
    const counts = {
      sellers: 0,
      buyers: 0,
      products: 0,
      categories: 0
    };
    
    try {
      const sellersCount = await db.get('SELECT COUNT(*) as count FROM sellers');
      counts.sellers = parseInt(sellersCount?.count, 10) || 0;
    } catch (e) {
      counts.sellers = 'error: ' + e.message;
    }
    
    try {
      const buyersCount = await db.get('SELECT COUNT(*) as count FROM buyers');
      counts.buyers = parseInt(buyersCount?.count, 10) || 0;
    } catch (e) {
      counts.buyers = 'error: ' + e.message;
    }
    
    try {
      const productsCount = await db.get('SELECT COUNT(*) as count FROM products');
      counts.products = parseInt(productsCount?.count, 10) || 0;
    } catch (e) {
      counts.products = 'error: ' + e.message;
    }
    
    try {
      const categoriesCount = await db.get('SELECT COUNT(*) as count FROM categories');
      counts.categories = parseInt(categoriesCount?.count, 10) || 0;
    } catch (e) {
      counts.categories = 'error: ' + e.message;
    }
    
    res.json({
      status: 'ok',
      database: process.env.DATABASE_URL ? 'connected (DATABASE_URL)' : 'connected (local config)',
      tables: {
        sellers: {
          hasEmailColumn,
          columnsCount: sellersColumns.length,
          columns: sellersColumns
        }
      },
      counts
    });
  } catch (error) {
    console.error('Schema check error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      stack: !IS_PRODUCTION ? error.stack : undefined
    });
  }
});

// Manual seed endpoint - development only
if (!IS_PRODUCTION) {
  app.post('/api/seed-database', async (req, res) => {
    try {
      const seedDb = require('./scripts/seedDb');
      await seedDb();
      res.json({ status: 'success', message: 'Database seeded successfully' });
    } catch (error) {
      console.error('Manual seed error:', error);
      res.status(500).json({ status: 'error', message: 'Seed failed' });
    }
  });
}

// Manual migration endpoint (for fixing missing columns - restricted to development)
app.post('/api/debug/migrate', async (req, res) => {
  // Only allow in development environment
  if (IS_PRODUCTION) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'This endpoint is only available in development mode'
    });
  }
  
  try {
    const initDb = require('./scripts/initDb');
    await initDb();
    res.json({ 
      status: 'success', 
      message: 'Database migration completed successfully. All missing columns should now be added.' 
    });
  } catch (error) {
    console.error('Manual migration error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message,
      stack: !IS_PRODUCTION ? error.stack : undefined
    });
  }
});

// Production migration endpoint - development only
if (!IS_PRODUCTION) {
  app.post('/api/run-missing-columns-migration', async (req, res) => {
    try {
      const db = require('./models/database');
      const migrationPath = path.join(__dirname, 'migrations', 'add_missing_columns.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await db.query(migrationSQL);
      res.json({ status: 'success', message: 'Migration completed' });
    } catch (error) {
      console.error('Migration error:', error);
      res.status(500).json({ status: 'error', message: 'Migration failed' });
    }
  });
}

// ============================================================
// ADMIN / DEBUG / MIGRATION ENDPOINTS — Development only
// ============================================================
if (!IS_PRODUCTION) {
  app.post('/api/fix-seller-slugs', async (req, res) => {
    try {
      const db = require('./models/database');
      const sellersWithoutSlugs = await db.all('SELECT id, name, shop_name FROM sellers WHERE slug IS NULL');
      if (sellersWithoutSlugs.length === 0) return res.json({ status: 'success', message: 'All sellers already have slugs!', updated: 0 });
      const generateSlug = (text) => text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
      let updated = 0;
      for (const seller of sellersWithoutSlugs) {
        const baseName = seller.shop_name || seller.name || `seller-${seller.id}`;
        let slug = generateSlug(baseName);
        let counter = 1;
        let slugExists = await db.get('SELECT id FROM sellers WHERE slug = $1', [slug]);
        while (slugExists) { slug = `${generateSlug(baseName)}-${counter}`; slugExists = await db.get('SELECT id FROM sellers WHERE slug = $1', [slug]); counter++; }
        await db.run('UPDATE sellers SET slug = $1 WHERE id = $2', [slug, seller.id]);
        updated++;
      }
      res.json({ status: 'success', message: `Generated slugs for ${updated} sellers`, updated });
    } catch (error) { console.error('Slug fix error:', error); res.status(500).json({ status: 'error', message: 'Slug fix failed' }); }
  });

  app.post('/api/cleanup-seed-duplicates', async (req, res) => {
    try { const fn = require('./scripts/cleanupSeedDuplicates'); const summary = await fn(); res.json({ status: 'success', summary }); }
    catch (error) { console.error('Cleanup error:', error); res.status(500).json({ status: 'error', message: 'Cleanup failed' }); }
  });

  app.post('/api/purge-seed-data', async (req, res) => {
    try { const fn = require('./scripts/purgeSeedData'); const summary = await fn(); res.json({ status: 'success', summary }); }
    catch (error) { console.error('Purge error:', error); res.status(500).json({ status: 'error', message: 'Purge failed' }); }
  });

  app.post('/api/production-cleanup', async (req, res) => {
    try {
      const authHeader = req.headers['x-admin-secret'] || req.body.adminSecret;
      const expectedSecret = process.env.ADMIN_SECRET || process.env.JWT_SECRET;
      if (!authHeader || authHeader !== expectedSecret) return res.status(403).json({ error: 'Unauthorized' });
      const fn = require('./scripts/productionCleanup'); const summary = await fn(); res.json({ status: 'success', summary });
    } catch (error) { console.error('Cleanup error:', error); res.status(500).json({ status: 'error', message: 'Cleanup failed' }); }
  });

  app.post('/api/setup-homepage', async (req, res) => {
    try {
      const db = require('./models/database');
      const generateSlug = (text) => text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
      // Fix category slugs
      const categories = await db.all('SELECT id, name FROM categories');
      for (const cat of categories) { await db.run('UPDATE categories SET slug = $1 WHERE id = $2', [generateSlug(cat.name), cat.id]); }
      // Mark top sellers
      const topSellers = await db.all('SELECT id FROM sellers WHERE is_verified = TRUE ORDER BY trust_level DESC LIMIT 10');
      for (const s of topSellers) { await db.run('UPDATE sellers SET trust_level = 5 WHERE id = $1', [s.id]); }
      // Mark featured products
      const products = await db.all('SELECT p.id FROM products p JOIN sellers s ON p.seller_id = s.id WHERE s.is_verified = TRUE AND p.is_available = TRUE ORDER BY RANDOM() LIMIT 12');
      for (const p of products) { await db.run('UPDATE products SET is_featured = TRUE WHERE id = $1', [p.id]); }
      res.json({ status: 'success', message: 'Homepage setup completed' });
    } catch (error) { console.error('Homepage setup error:', error); res.status(500).json({ status: 'error', message: 'Setup failed' }); }
  });

  app.post('/api/add-more-categories', async (req, res) => {
    try {
      const db = require('./models/database');
      const generateSlug = (text) => text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
      const cats = [
        { name: 'Home & Garden', description: 'Furniture, decor, and garden supplies' },
        { name: 'Beauty & Health', description: 'Cosmetics, skincare, and wellness products' },
        { name: 'Sports & Outdoors', description: 'Fitness equipment and outdoor gear' },
        { name: 'Toys & Games', description: 'Toys, games, and hobby items' },
        { name: 'Books & Media', description: 'Books, music, movies, and more' },
        { name: 'Automotive', description: 'Car parts and accessories' },
        { name: 'Baby & Kids', description: 'Baby products and children\'s items' },
        { name: 'Pets', description: 'Pet supplies and accessories' },
        { name: 'Office Supplies', description: 'Stationery and office equipment' },
        { name: 'Jewelry & Watches', description: 'Jewelry, watches, and accessories' }
      ];
      let added = 0;
      for (const c of cats) {
        const exists = await db.get('SELECT id FROM categories WHERE name = $1', [c.name]);
        if (!exists) { await db.run('INSERT INTO categories (name, description, slug) VALUES ($1, $2, $3)', [c.name, c.description, generateSlug(c.name)]); added++; }
      }
      res.json({ status: 'success', added });
    } catch (error) { console.error('Add categories error:', error); res.status(500).json({ status: 'error', message: 'Failed' }); }
  });

  app.post('/api/fix-featured-products', async (req, res) => {
    try {
      const db = require('./models/database');
      await db.run('UPDATE products SET is_featured = FALSE WHERE is_featured = TRUE');
      const products = await db.all('SELECT p.id FROM products p JOIN sellers s ON p.seller_id = s.id WHERE s.is_verified = TRUE AND p.is_available = TRUE ORDER BY RANDOM() LIMIT 12');
      for (const p of products) { await db.run('UPDATE products SET is_featured = TRUE WHERE id = $1', [p.id]); }
      res.json({ status: 'success', updated: products.length });
    } catch (error) { console.error('Fix featured error:', error); res.status(500).json({ status: 'error', message: 'Failed' }); }
  });

  app.get('/api/debug-featured', async (req, res) => {
    try {
      const db = require('./models/database');
      const featured = await db.all('SELECT id, name, seller_id FROM products WHERE is_featured = TRUE LIMIT 20');
      const total = await db.get('SELECT COUNT(*) as count FROM products');
      res.json({ totalProducts: total.count, featured });
    } catch (error) { res.status(500).json({ status: 'error', message: 'Failed' }); }
  });

  app.post('/api/fix-product-categories', async (req, res) => {
    try {
      const db = require('./models/database');
      const categories = await db.all('SELECT id FROM categories');
      if (categories.length === 0) return res.status(400).json({ error: 'No categories found' });
      const products = await db.all('SELECT id FROM products WHERE category_id IS NULL');
      for (const p of products) { await db.run('UPDATE products SET category_id = $1 WHERE id = $2', [categories[Math.floor(Math.random() * categories.length)].id, p.id]); }
      res.json({ status: 'success', updated: products.length });
    } catch (error) { res.status(500).json({ status: 'error', message: 'Failed' }); }
  });

  app.post('/api/fix-cart-items-columns', async (req, res) => {
    try {
      const db = require('./models/database');
      await db.run('ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS saved_for_later BOOLEAN DEFAULT FALSE');
      await db.run('ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      res.json({ status: 'success', message: 'Cart columns updated' });
    } catch (error) { res.status(500).json({ status: 'error', message: 'Failed' }); }
  });

  app.post('/api/fix-product-slugs', async (req, res) => {
    try {
      const db = require('./models/database');
      const products = await db.all('SELECT id, name FROM products WHERE slug IS NULL');
      for (const p of products) { const slug = p.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim() + '-' + p.id; await db.run('UPDATE products SET slug = $1 WHERE id = $2', [slug, p.id]); }
      res.json({ status: 'success', updated: products.length });
    } catch (error) { res.status(500).json({ status: 'error', message: 'Failed' }); }
  });

  app.post('/api/fix-existing-cart-items', async (req, res) => {
    try {
      const db = require('./models/database');
      await db.run('UPDATE cart_items SET saved_for_later = false WHERE saved_for_later IS NULL');
      res.json({ status: 'success' });
    } catch (error) { res.status(500).json({ status: 'error', message: 'Failed' }); }
  });

  app.get('/api/debug/email-config', async (req, res) => {
    try {
      const smtpConfig = getSmtpConfig();
      res.json({
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPassword: !!process.env.EMAIL_PASSWORD,
        smtp: { host: smtpConfig.host, port: smtpConfig.port, secure: smtpConfig.secure },
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) { res.status(500).json({ status: 'error', message: 'Failed' }); }
  });

  app.post('/api/debug/test-email', async (req, res) => {
    try {
      const { to } = req.body;
      if (!to) return res.status(400).json({ error: 'Provide "to" field' });
      const transporter = createEmailTransporter();
      const info = await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject: 'KudiMall Test', html: '<p>Email working!</p>' });
      res.json({ status: 'success', messageId: info.messageId });
    } catch (error) { res.status(500).json({ status: 'error', message: 'Send failed' }); }
  });
} // END development-only admin endpoints

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} - Error:`, err.message);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong!' : err.message });
});

app.listen(PORT, async () => {
  console.log(`🟢 KudiMall API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Auto-initialize database schema on startup
  try {
    const db = require('./models/database');
    const initDb = require('./scripts/initDb');
    
    // Check if sellers table has email column (PostgreSQL-specific query)
    let needsMigration = false;
    try {
      const columns = await db.all(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sellers' AND column_name = 'email'
      `);
      
      if (!columns || columns.length === 0) {
        console.log('⚠️  Sellers table missing email column, running migration...');
        needsMigration = true;
      }
    } catch (error) {
      // Table might not exist at all
      if (error.message.includes('does not exist') || error.message.includes('no such table')) {
        console.log('📦 Sellers table not found, initializing database...');
        needsMigration = true;
      }
    }
    
    // Run migration if needed (this is safe to run multiple times)
    if (needsMigration) {
      console.log('🔧 Running database initialization...');
      await initDb();
      console.log('✅ Database schema initialized successfully');
    } else {
      console.log('✓ Database schema is up to date');
    }
    
    // Auto-seed database only when explicitly enabled
    const autoSeedEnabled = String(process.env.AUTO_SEED_ON_START || '').toLowerCase() === 'true';
    if (autoSeedEnabled) {
      const categories = await db.all('SELECT COUNT(*) as count FROM categories LIMIT 1');
      const categoryCount = Number(categories?.[0]?.count || 0);

      if (categoryCount === 0) {
        console.log('🌱 Database appears empty, auto-seeding...');
        const seedDb = require('./scripts/seedDb');
        await seedDb();
        console.log('✅ Database auto-seeded successfully');
      } else {
        console.log('📊 Database already contains data, skipping seed');
      }
    } else {
      console.log('⏭️ Auto-seed disabled (set AUTO_SEED_ON_START=true to enable)');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.log('💡 Use POST /api/seed-database to seed manually or POST /api/debug/migrate to run migrations');
  }
});

module.exports = app;
