const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

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
const { router: authRoutes } = require('./routes/auth');
const sellerManagementRoutes = require('./routes/sellerManagement');
const { router: buyerAuthRoutes } = require('./routes/buyerAuth');
const buyerManagementRoutes = require('./routes/buyerManagement');
const { router: deliveryAuthRoutes } = require('./routes/deliveryAuth');
const deliveryManagementRoutes = require('./routes/deliveryManagement');
const wishlistRoutes = require('./routes/wishlist');
const cartRoutes = require('./routes/cart');
const dealsRoutes = require('./routes/deals');

app.use('/api/categories', categoryRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/seller-applications', sellerApplicationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/seller', sellerManagementRoutes);
app.use('/api/buyer-auth', buyerAuthRoutes);
app.use('/api/buyer', buyerManagementRoutes);
app.use('/api/delivery-auth', deliveryAuthRoutes);
app.use('/api/delivery', deliveryManagementRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/deals', dealsRoutes);

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
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KudiMall API is running' });
});

// Database schema verification endpoint (for debugging)
app.get('/api/debug/schema', async (req, res) => {
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
      counts.sellers = sellersCount?.count || 0;
    } catch (e) {
      counts.sellers = 'error: ' + e.message;
    }
    
    try {
      const buyersCount = await db.get('SELECT COUNT(*) as count FROM buyers');
      counts.buyers = buyersCount?.count || 0;
    } catch (e) {
      counts.buyers = 'error: ' + e.message;
    }
    
    try {
      const productsCount = await db.get('SELECT COUNT(*) as count FROM products');
      counts.products = productsCount?.count || 0;
    } catch (e) {
      counts.products = 'error: ' + e.message;
    }
    
    try {
      const categoriesCount = await db.get('SELECT COUNT(*) as count FROM categories');
      counts.categories = categoriesCount?.count || 0;
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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// Manual migration endpoint (for fixing missing columns)
app.post('/api/debug/migrate', async (req, res) => {
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
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
  
  // Auto-seed database if empty (for free tier deployment)
  try {
    const db = require('./models/database');

    // Simple check - if any error occurs, decide whether to seed or skip
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
    const message = error && error.message ? error.message : '';

    if (message.includes('no such table')) {
      console.log('📦 Database tables missing, initializing with seed data...');
      try {
        const seedDb = require('./scripts/seedDb');
        await seedDb();
        console.log('✅ Database initialized and seeded successfully');
      } catch (seedError) {
        console.log('❌ Auto-seed failed:', seedError.message);
      }
    } else {
      console.log('ℹ️  Auto-seed skipped:', message);
      console.log('💡 Use POST /api/seed-database to seed manually');
    }
  }
});

module.exports = app;
