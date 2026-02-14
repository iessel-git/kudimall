const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

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
  contentSecurityPolicy: false, // Disable CSP for now to avoid breaking existing functionality
  crossOriginEmbedderPolicy: false
}));

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

// Security: Rate limiting for authentication endpoints
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

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    name: 'KudiMall API',
    version: '2.0.0',
    status: 'running',
    message: 'Welcome to KudiMall API',
    endpoints: {
      health: '/api/health',
      categories: '/api/categories',
      sellers: '/api/sellers',
      products: '/api/products',
      search: '/api/search',
      reviews: '/api/reviews',
      orders: '/api/orders',
      'seller-applications': '/api/seller-applications',
      auth: '/api/auth',
      'seller-management': '/api/seller',
      'buyer-auth': '/api/buyer-auth',
      'buyer-management': '/api/buyer',
      'delivery-auth': '/api/delivery-auth',
      'delivery-management': '/api/delivery',
      wishlist: '/api/wishlist',
      cart: '/api/cart',
      deals: '/api/deals'
    },
    adminPages: {
      'seller-applications': {
        apiEndpoint: '/api/seller-applications',
        adminPage: '/admin/applications',
        description: 'Manage seller applications - view, approve, or reject applications'
      },
      'seller-verification': {
        apiEndpoint: '/api/admin/sellers',
        adminPage: '/admin/sellers',
        description: 'Manage seller verification status, trust levels, and badges'
      }
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KudiMall API is running' });
});

// Database schema verification endpoint (for debugging - restricted to development)
app.get('/api/debug/schema', async (req, res) => {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
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
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

// Manual seed endpoint (backup for auto-seed)
app.post('/api/seed-database', async (req, res) => {
  try {
    const seedDb = require('./scripts/seedDb');
    await seedDb();
    res.json({ status: 'success', message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Manual seed error:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Manual migration endpoint (for fixing missing columns - restricted to development)
app.post('/api/debug/migrate', async (req, res) => {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
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
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    });
  }
});

// Production migration endpoint for adding missing columns
app.post('/api/run-missing-columns-migration', async (req, res) => {
  try {
    const db = require('./models/database');
    const fs = require('fs');
    const path = require('path');
    
    const migrationPath = path.join(__dirname, 'migrations', 'add_missing_columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await db.query(migrationSQL);
    
    res.json({ 
      status: 'success', 
      message: 'Missing columns migration completed successfully!' 
    });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message
    });
  }
});

// Fix sellers without slugs (production endpoint)
app.post('/api/fix-seller-slugs', async (req, res) => {
  try {
    const db = require('./models/database');
    
    // Get all sellers without slugs
    const sellersWithoutSlugs = await db.all(
      'SELECT id, name, shop_name FROM sellers WHERE slug IS NULL'
    );
    
    if (sellersWithoutSlugs.length === 0) {
      return res.json({ 
        status: 'success', 
        message: 'All sellers already have slugs!',
        updated: 0
      });
    }
    
    // Generate slug function
    const generateSlug = (text) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    };
    
    let updated = 0;
    for (const seller of sellersWithoutSlugs) {
      const baseName = seller.shop_name || seller.name || `seller-${seller.id}`;
      let slug = generateSlug(baseName);
      let counter = 1;
      
      // Ensure slug is unique
      let slugExists = await db.get('SELECT id FROM sellers WHERE slug = $1', [slug]);
      while (slugExists) {
        slug = `${generateSlug(baseName)}-${counter}`;
        slugExists = await db.get('SELECT id FROM sellers WHERE slug = $1', [slug]);
        counter++;
      }
      
      await db.run('UPDATE sellers SET slug = $1 WHERE id = $2', [slug, seller.id]);
      updated++;
    }
    
    res.json({ 
      status: 'success', 
      message: `Successfully generated slugs for ${updated} sellers!`,
      updated
    });
  } catch (error) {
    console.error('Slug fix error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
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
    
    // Auto-seed database if empty (for free tier deployment)
    const categories = await db.all('SELECT COUNT(*) as count FROM categories LIMIT 1');
    
    if (categories && categories[0] && categories[0].count === 0) {
      console.log('🌱 Database appears empty, auto-seeding...');
      const seedDb = require('./scripts/seedDb');
      await seedDb();
      console.log('✅ Database auto-seeded successfully');
    } else {
      console.log('📊 Database already contains data, skipping seed');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.log('💡 Use POST /api/seed-database to seed manually or POST /api/debug/migrate to run migrations');
  }
});

module.exports = app;
