
const db = require('../models/database');

const initDb = async () => {
  try {
    console.log('🔧 Initializing KudiMall Database...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT
      );
      CREATE TABLE IF NOT EXISTS sellers (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        shop_name VARCHAR(100) NOT NULL,
        address TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS buyers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        default_address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        zip_code VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        seller_id INT REFERENCES sellers(id) ON DELETE CASCADE,
        category_id INT REFERENCES categories(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        stock INT DEFAULT 0,
        image_url TEXT,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        seller_id INT REFERENCES sellers(id) ON DELETE SET NULL,
        subtotal NUMERIC(10,2) NOT NULL,
        discount_amount NUMERIC(10,2) DEFAULT 0.00,
        coupon_id INT REFERENCES coupons(id) ON DELETE SET NULL,
        total NUMERIC(10,2) NOT NULL,
        status VARCHAR(30) DEFAULT 'pending',
        escrow_status VARCHAR(20) DEFAULT 'held',
        payment_provider VARCHAR(50) DEFAULT 'hubtel',
        payment_reference VARCHAR(100) UNIQUE,
        payment_status VARCHAR(20) DEFAULT 'pending',
        delivery_confirmed_at TIMESTAMP,
        driver_confirmed BOOLEAN DEFAULT FALSE,
        customer_confirmed BOOLEAN DEFAULT FALSE,
        cancellation_reason TEXT,
        cancelled_by VARCHAR(20),
        cancelled_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS delivery_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE SET NULL,
        seller_id INT REFERENCES sellers(id) ON DELETE SET NULL,
        buyer_name VARCHAR(100) NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        buyer_id INT,
        buyer_email VARCHAR(100) NOT NULL,
        seller_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(buyer_email, seller_id),
        FOREIGN KEY (buyer_id) REFERENCES buyers(id),
        FOREIGN KEY (seller_id) REFERENCES sellers(id)
      );
      CREATE TABLE IF NOT EXISTS seller_applications (
        id SERIAL PRIMARY KEY,
        application_id VARCHAR(100) NOT NULL UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        business_name VARCHAR(100) NOT NULL,
        business_type VARCHAR(100),
        business_address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        zip_code VARCHAR(20),
        country VARCHAR(100),
        tax_id VARCHAR(100),
        store_name VARCHAR(100) NOT NULL,
        store_description TEXT,
        product_categories TEXT,
        estimated_monthly_volume VARCHAR(100),
        instagram_handle VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      -- Add more tables as needed for coupons, cart, escrow, etc.
    `);
    console.log('✅ Database schema initialized.');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  }
};

module.exports = initDb;
