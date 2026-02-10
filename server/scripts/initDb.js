const db = require('../models/database');

const initDb = async () => {
  try {
    console.log('🔧 Initializing KudiMall Database...');

    // Categories table
    await db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Sellers/Stores table
    await db.run(`
      CREATE TABLE IF NOT EXISTS sellers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        phone TEXT,
        description TEXT,
        banner_url TEXT,
        logo_url TEXT,
        trust_level INTEGER DEFAULT 1,
        is_verified BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        total_sales INTEGER DEFAULT 0,
        rating REAL DEFAULT 0.0,
        review_count INTEGER DEFAULT 0,
        location TEXT,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Buyers table
    await db.run(`
      CREATE TABLE IF NOT EXISTS buyers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        default_address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Products table
    await db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        image_url TEXT,
        images TEXT,
        stock INTEGER DEFAULT 0,
        is_available BOOLEAN DEFAULT 1,
        is_featured BOOLEAN DEFAULT 0,
        views INTEGER DEFAULT 0,
        sales INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES sellers (id),
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);

    // Orders table
    await db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_number TEXT UNIQUE NOT NULL,
        buyer_id INTEGER,
        buyer_name TEXT NOT NULL,
        buyer_email TEXT NOT NULL,
        buyer_phone TEXT NOT NULL,
        seller_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        delivery_person_id INTEGER,
        quantity INTEGER NOT NULL,
        total_amount REAL NOT NULL,
        status TEXT DEFAULT 'pending',
        escrow_status TEXT DEFAULT 'held',
        tracking_number TEXT,
        shipped_at DATETIME,
        delivered_at DATETIME,
        buyer_confirmed_at DATETIME,
        delivery_proof_type TEXT,
        delivery_proof_url TEXT,
        delivery_signature_name TEXT,
        delivery_signature_data TEXT,
        delivery_photo_uploaded_by TEXT,
        delivery_signature_uploaded_by TEXT,
        delivery_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES buyers (id),
        FOREIGN KEY (seller_id) REFERENCES sellers (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      )
    `);

    // Delivery Users table
    await db.run(`
      CREATE TABLE IF NOT EXISTS delivery_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        is_active BOOLEAN DEFAULT 1,
        last_login DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Reviews table
    await db.run(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        seller_id INTEGER NOT NULL,
        buyer_id INTEGER,
        buyer_name TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES buyers (id),
        FOREIGN KEY (product_id) REFERENCES products (id),
        FOREIGN KEY (seller_id) REFERENCES sellers (id)
      )
    `);

    // Follows table (for buyers following stores)
    await db.run(`
      CREATE TABLE IF NOT EXISTS follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        buyer_id INTEGER,
        buyer_email TEXT NOT NULL,
        seller_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(buyer_email, seller_id),
        FOREIGN KEY (buyer_id) REFERENCES buyers (id),
        FOREIGN KEY (seller_id) REFERENCES sellers (id)
      )
    `);

    // Seller Applications table
    await db.run(`
      CREATE TABLE IF NOT EXISTS seller_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id TEXT UNIQUE NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        business_name TEXT NOT NULL,
        business_type TEXT,
        business_address TEXT,
        city TEXT,
        state TEXT,
        zip_code TEXT,
        country TEXT,
        tax_id TEXT,
        store_name TEXT NOT NULL,
        store_description TEXT,
        product_categories TEXT,
        estimated_monthly_volume TEXT,
        instagram_handle TEXT,
        facebook_page TEXT,
        twitter_handle TEXT,
        tiktok_handle TEXT,
        website_url TEXT,
        bank_name TEXT,
        account_holder_name TEXT,
        account_number_last4 TEXT,
        routing_number TEXT,
        id_type TEXT,
        id_number TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        reviewed_by TEXT,
        reviewed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Export the function for use by other scripts, but also run if called directly
if (require.main === module) {
  initDb().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = initDb;
