
const db = require('../models/database');

const initDb = async () => {
  try {
    console.log('🔧 Initializing KudiMall Database...');
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
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
      -- Add missing seller columns used by API routes
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS name VARCHAR(255);
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS location TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS logo_url TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS banner_url TEXT;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS trust_level INTEGER DEFAULT 0;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS password VARCHAR(255);
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2);
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE sellers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
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
      ALTER TABLE buyers ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
      ALTER TABLE buyers ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
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
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INT REFERENCES carts(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        quantity INT NOT NULL DEFAULT 1,
        price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cart_id, product_id)
      );
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
        discount_value NUMERIC(10,2) NOT NULL,
        min_purchase NUMERIC(10,2) DEFAULT 0,
        max_discount NUMERIC(10,2),
        usage_limit INT,
        used_count INT DEFAULT 0,
        valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valid_until TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
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
      -- Add missing columns to orders table
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_id INTEGER REFERENCES buyers(id) ON DELETE SET NULL;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_name VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_phone VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC(10,2);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS buyer_confirmed_at TIMESTAMP;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_signature_name VARCHAR(255);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_signature_data TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_type VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_proof_url TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_photo_uploaded_by VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_signature_uploaded_by VARCHAR(50);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_person_id INTEGER;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      -- Add unique constraint to order_number if it doesn't exist
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'orders_order_number_key'
        ) THEN
          ALTER TABLE orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
        END IF;
      END $$;
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        product_id INT REFERENCES products(id) ON DELETE SET NULL,
        quantity INT NOT NULL,
        price NUMERIC(10,2) NOT NULL
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        facebook_page VARCHAR(255),
        twitter_handle VARCHAR(255),
        tiktok_handle VARCHAR(255),
        website_url TEXT,
        bank_name VARCHAR(255),
        account_holder_name VARCHAR(255),
        account_number_last4 VARCHAR(4),
        routing_number VARCHAR(50),
        id_type VARCHAR(50),
        id_number VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        admin_notes TEXT,
        reviewed_by VARCHAR(255),
        reviewed_at TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS inventory_alerts (
        id SERIAL PRIMARY KEY,
        product_id INT REFERENCES products(id) ON DELETE CASCADE,
        seller_id INT REFERENCES sellers(id) ON DELETE CASCADE,
        alert_type VARCHAR(20) CHECK (alert_type IN ('low_stock', 'out_of_stock')),
        threshold INT DEFAULT 5,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS payment_webhooks (
        id SERIAL PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        reference VARCHAR(100),
        payload JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        error_message TEXT,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Database schema initialized.');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  }
};

module.exports = initDb;
