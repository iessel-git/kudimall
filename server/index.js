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

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
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

// Root route - API information
app.get('/', (req, res) => {
  res.json({
    name: 'KudiMall API',
    version: '1.0.0',
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
      'delivery-management': '/api/delivery'
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'KudiMall API is running' });
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, async () => {
  console.log(`🟢 KudiMall API Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Auto-initialize and seed database if needed (for free tier deployment)
  try {
    const db = require('./models/database');
    
    // Try to check if categories table exists
    let tableExists = false;
    try {
      await db.all('SELECT COUNT(*) as count FROM categories LIMIT 1');
      tableExists = true;
    } catch (error) {
      // Table doesn't exist, need to initialize
      console.log('📋 Database tables not found, initializing...');
    }
    
    // Initialize database if tables don't exist
    if (!tableExists) {
      const initDb = require('./scripts/initDb');
      await initDb();
      console.log('✅ Database initialized successfully');
    }
    
    // Check if database needs seeding
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
    console.error('⚠️  Database initialization error:', error.message);
    console.log('💡 Use POST /api/seed-database to seed manually');
  }
});

module.exports = app;
