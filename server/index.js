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

// Setup homepage (categories, featured sellers, featured products)
app.post('/api/setup-homepage', async (req, res) => {
  try {
    const db = require('./models/database');
    
    // Generate slug function
    const generateSlug = (text) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    };
    
    const results = {
      categories: { updated: 0, errors: [] },
      sellers: { updated: 0, errors: [] },
      products: { updated: 0, errors: [] }
    };
    
    // 1. Fix categories - add slugs and remove duplicates
    const categories = await db.all('SELECT id, name FROM categories');
    const uniqueCategories = new Map();
    
    for (const cat of categories) {
      const key = cat.name.toLowerCase().trim();
      if (!uniqueCategories.has(key)) {
        uniqueCategories.set(key, cat);
      } else {
        // Delete duplicate
        try {
          await db.run('DELETE FROM categories WHERE id = $1', [cat.id]);
        } catch (err) {
          results.categories.errors.push(`Failed to delete duplicate category ${cat.id}: ${err.message}`);
        }
      }
    }
    
    // Add slugs to remaining categories
    for (const [catName, cat] of uniqueCategories) {
      try {
        const slug = generateSlug(cat.name);
        await db.run('UPDATE categories SET slug = $1 WHERE id = $2', [slug, cat.id]);
        results.categories.updated++;
      } catch (err) {
        results.categories.errors.push(`Failed to update category ${cat.id}: ${err.message}`);
      }
    }
    
    // 2. Mark top sellers as featured (high trust level + verified)
    try {
      const topSellers = await db.all(`
        SELECT id FROM sellers 
        WHERE is_verified = TRUE 
        ORDER BY trust_level DESC, total_sales DESC 
        LIMIT 10
      `);
      
      for (const seller of topSellers) {
        await db.run('UPDATE sellers SET trust_level = 5 WHERE id = $1', [seller.id]);
        results.sellers.updated++;
      }
    } catch (err) {
      results.sellers.errors.push(`Failed to mark sellers as featured: ${err.message}`);
    }
    
    // 3. Mark some products as featured
    try {
      const products = await db.all(`
        SELECT p.id 
        FROM products p
        JOIN sellers s ON p.seller_id = s.id
        WHERE s.is_verified = TRUE AND p.is_available = TRUE
        ORDER BY RANDOM()
        LIMIT 12
      `);
      
      for (const product of products) {
        await db.run('UPDATE products SET is_featured = TRUE WHERE id = $1', [product.id]);
        results.products.updated++;
      }
    } catch (err) {
      results.products.errors.push(`Failed to mark products as featured: ${err.message}`);
    }
    
    res.json({ 
      status: 'success', 
      message: 'Homepage setup completed!',
      results
    });
  } catch (error) {
    console.error('Homepage setup error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message
    });
  }
});

// Add more marketplace categories
app.post('/api/add-more-categories', async (req, res) => {
  try {
    const db = require('./models/database');
    
    const generateSlug = (text) => {
      return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    };
    
    const newCategories = [
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
    let skipped = 0;
    
    for (const category of newCategories) {
      try {
        // Check if category exists
        const existing = await db.get('SELECT id FROM categories WHERE name = $1', [category.name]);
        
        if (existing) {
          skipped++;
          continue;
        }
        
        const slug = generateSlug(category.name);
        await db.run(
          'INSERT INTO categories (name, description, slug) VALUES ($1, $2, $3)',
          [category.name, category.description, slug]
        );
        added++;
      } catch (err) {
        console.error(`Failed to add category ${category.name}:`, err);
      }
    }
    
    res.json({ 
      status: 'success', 
      message: `Added ${added} new categories (${skipped} already existed)`,
      added,
      skipped
    });
  } catch (error) {
    console.error('Add categories error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message
    });
  }
});

// Fix featured products - clear all and mark 12 new ones
app.post('/api/fix-featured-products', async (req, res) => {
  try {
    const db = require('./models/database');
    
    // First, clear all featured products
    await db.run('UPDATE products SET is_featured = FALSE WHERE is_featured = TRUE');
    
    // Then mark 12 random products from verified sellers as featured
    const products = await db.all(`
      SELECT p.id 
      FROM products p
      JOIN sellers s ON p.seller_id = s.id
      WHERE s.is_verified = TRUE AND p.is_available = TRUE
      ORDER BY RANDOM()
      LIMIT 12
    `);
    
    let updated = 0;
    for (const product of products) {
      const result = await db.run('UPDATE products SET is_featured = TRUE WHERE id = $1', [product.id]);
      updated++;
    }
    
    // Verify
    const featuredCount = await db.get('SELECT COUNT(*) as count FROM products WHERE is_featured = TRUE');
    
    res.json({ 
      status: 'success', 
      message: `Marked ${updated} products as featured`,
      updated,
      verified: featuredCount.count
    });
  } catch (error) {
    console.error('Fix featured products error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message
    });
  }
});

// Debug: Check featured products directly
app.get('/api/debug-featured', async (req, res) => {
  try {
    const db = require('./models/database');
    
    const featured = await db.all('SELECT id, name, seller_id, is_featured FROM products WHERE is_featured = TRUE LIMIT 20');
    const total = await db.get('SELECT COUNT(*) as count FROM products');
    const featuredCount = await db.get('SELECT COUNT(*) as count FROM products WHERE is_featured = TRUE');
    
    // Check the full query with joins
    const featuredWithJoins = await db.all(`
      SELECT p.id, p.name, p.seller_id, p.category_id, p.is_featured,
             s.id as seller_exists, c.id as category_exists
      FROM products p
      LEFT  JOIN sellers s ON p.seller_id = s.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_featured = TRUE
      LIMIT 20
    `);
    
    res.json({ 
      totalProducts: total.count,
      featuredCount: featuredCount.count,
      featured,
      featuredWithJoins
    });
  } catch (error) {
    console.error('Debug featured error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message
    });
  }
});

// Fix products with null category_id
app.post('/api/fix-product-categories', async (req, res) => {
  try {
    const db = require('./models/database');
    
    // Get all categories
    const categories = await db.all('SELECT id FROM categories');
    if (categories.length === 0) {
      return res.status(400).json({ error: 'No categories found' });
    }
    
    // Get products with null category_id
    const productsWithoutCategory = await db.all('SELECT id, name FROM products WHERE category_id IS NULL');
    
    let updated = 0;
    for (const product of productsWithoutCategory) {
      // Assign a random category
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];
      await db.run('UPDATE products SET category_id = $1 WHERE id = $2', [randomCategory.id, product.id]);
      updated++;
    }
    
    res.json({ 
      status: 'success',
      message: `Fixed ${updated} products with null category_id`,
      updated
    });
  } catch (error) {
    console.error('Fix product categories error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message
    });
  }
});

// Add missing cart_items columns
app.post('/api/fix-cart-items-columns', async (req, res) => {
  try {
    const db = require('./models/database');
    
    // Add saved_for_later column if it doesn't exist
    try {
      await db.run(`
        ALTER TABLE cart_items 
        ADD COLUMN IF NOT EXISTS saved_for_later BOOLEAN DEFAULT FALSE
      `);
    } catch (error) {
      console.log('saved_for_later column might already exist or error:', error.message);
    }
    
    // Add updated_at column if it doesn't exist
    try {
      await db.run(`
        ALTER TABLE cart_items 
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      `);
    } catch (error) {
      console.log('updated_at column might already exist or error:', error.message);
    }
    
    res.json({ 
      status: 'success',
      message: 'Cart items columns updated successfully'
    });
  } catch (error) {
    console.error('Fix cart items columns error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message
    });
  }
});

// Fix product slugs
app.post('/api/fix-product-slugs', async (req, res) => {
  try {
    const db = require('./models/database');
    
    const generateSlug = (text, id) => {
      const baseSlug = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      return `${baseSlug}-${id}`;
    };
    
    // Get all products without slugs
    const products = await db.all('SELECT id, name FROM products WHERE slug IS NULL');
    
    let updated = 0;
    for (const product of products) {
      const slug = generateSlug(product.name, product.id);
      await db.run('UPDATE products SET slug = $1 WHERE id = $2', [slug, product.id]);
      updated++;
    }
    
    res.json({ 
      status: 'success',
      message: `Generated slugs for ${updated} products`,
      updated
    });
  } catch (error) {
    console.error('Fix product slugs error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message
    });
  }
});

// Fix existing cart items with NULL saved_for_later
app.post('/api/fix-existing-cart-items', async (req, res) => {
  try {
    const db = require('./models/database');
    
    // Update all cart items with NULL saved_for_later to false
    const result = await db.run(`
      UPDATE cart_items 
      SET saved_for_later = false 
      WHERE saved_for_later IS NULL
    `);
    
    res.json({ 
      status: 'success',
      message: 'Existing cart items updated successfully',
      updated: result.changes || 0
    });
  } catch (error) {
    console.error('Fix existing cart items error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message
    });
  }
});

// Debug email configuration (safe - doesn't expose credentials)
app.get('/api/debug/email-config', async (req, res) => {
  try {
    const hasEmailUser = !!process.env.EMAIL_USER;
    const hasEmailPassword = !!process.env.EMAIL_PASSWORD;
    const emailUser = process.env.EMAIL_USER ? 
      `${process.env.EMAIL_USER.substring(0, 3)}...${process.env.EMAIL_USER.substring(process.env.EMAIL_USER.length - 5)}` : 
      'NOT_SET';
    const isGmail = process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@gmail.com');
    const isPlaceholder = 
      process.env.EMAIL_USER === 'your-email@gmail.com' ||
      process.env.EMAIL_PASSWORD === 'your-app-password' ||
      process.env.EMAIL_PASSWORD === 'your-password' ||
      process.env.EMAIL_PASSWORD === 'your-16-character-app-password';
    
    const frontendUrl = process.env.FRONTEND_URL || 'NOT_SET';
    
    res.json({
      status: 'success',
      configuration: {
        hasEmailUser,
        hasEmailPassword,
        emailUserPreview: emailUser,
        isGmail,
        isPlaceholder,
        frontendUrl,
        environment: process.env.NODE_ENV || 'development'
      },
      diagnosis: hasEmailUser && hasEmailPassword && !isPlaceholder ? 
        'Email configured' : 
        'Email not properly configured'
    });
  } catch (error) {
    console.error('Debug email config error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: error.message
    });
  }
});

// Test email sending
app.post('/api/debug/test-email', async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Please provide email address in "to" field' 
      });
    }
    
    // Create transporter based on configuration
    let transporter;
    let transporterConfig = {};
    
    if (process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@gmail.com')) {
      transporterConfig = {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      };
      transporter = nodemailer.createTransport(transporterConfig);
    } else {
      transporterConfig = {
        host: process.env.EMAIL_HOST || 'smtp.example.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      };
      transporter = nodemailer.createTransport(transporterConfig);
    }
    
    // Try to send test email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: 'KudiMall Test Email',
      html: '<p>This is a test email from KudiMall. If you received this, email is working correctly!</p>'
    };
    
    try {
      const info = await transporter.sendMail(mailOptions);
      res.json({
        status: 'success',
        message: 'Test email sent successfully',
        messageId: info.messageId,
        config: {
          isGmail: process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@gmail.com'),
          host: transporterConfig.host || 'gmail',
          port: transporterConfig.port || 'default',
          secure: transporterConfig.secure || false,
          from: process.env.EMAIL_USER
        }
      });
    } catch (sendError) {
      res.json({
        status: 'error',
        message: 'Failed to send test email',
        error: sendError.message,
        code: sendError.code,
        command: sendError.command,
        config: {
          isGmail: process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@gmail.com'),
          host: transporterConfig.host || 'gmail',
          port: transporterConfig.port || 'default',
          secure: transporterConfig.secure || false,
          hasHost: !!process.env.EMAIL_HOST,
          hasPort: !!process.env.EMAIL_PORT,
          hasSecure: !!process.env.EMAIL_SECURE
        }
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
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
