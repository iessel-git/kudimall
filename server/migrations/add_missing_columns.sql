-- ============================================================================
-- KudiMall Missing Columns Migration
-- This migration adds all missing columns needed by the API routes
-- ============================================================================

-- ============================================================================
-- SELLERS TABLE - Add missing columns
-- ============================================================================

-- Make shop_name nullable to support new seller signup flow
ALTER TABLE sellers ALTER COLUMN shop_name DROP NOT NULL;

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
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS email_verification_sent_count INTEGER DEFAULT 0;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS email_verification_last_sent_at TIMESTAMP;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS total_sales INTEGER DEFAULT 0;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2);
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE sellers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- ============================================================================
-- PRODUCTS TABLE - Add missing columns
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sales INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create unique index on products slug per seller
CREATE UNIQUE INDEX IF NOT EXISTS products_seller_slug_unique ON products(seller_id, slug);

-- ============================================================================
-- ORDERS TABLE - Add missing columns
-- ============================================================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(50) UNIQUE;
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

-- ============================================================================
-- BUYERS TABLE - Create table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS buyers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    default_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    email_verification_sent_count INTEGER DEFAULT 0,
    email_verification_last_sent_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE buyers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS email_verification_sent_count INTEGER DEFAULT 0;
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS email_verification_last_sent_at TIMESTAMP;

-- ============================================================================
-- DELIVERY_USERS TABLE - Create table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS delivery_users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- REVIEWS TABLE - Create table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
    buyer_name VARCHAR(255) NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FOLLOWS TABLE - Create table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS follows (
    id SERIAL PRIMARY KEY,
    buyer_email VARCHAR(255) NOT NULL,
    seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(buyer_email, seller_id)
);

-- ============================================================================
-- SELLER_APPLICATIONS TABLE - Create table if not exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS seller_applications (
    id SERIAL PRIMARY KEY,
    application_id VARCHAR(100) UNIQUE NOT NULL,
    
    -- Personal Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    
    -- Business Information
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    business_address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    tax_id VARCHAR(100),
    
    -- Store Information
    store_name VARCHAR(255) NOT NULL,
    store_description TEXT NOT NULL,
    product_categories TEXT,
    estimated_monthly_volume VARCHAR(50),
    
    -- Social Media
    instagram_handle VARCHAR(255),
    facebook_page VARCHAR(255),
    twitter_handle VARCHAR(255),
    tiktok_handle VARCHAR(255),
    website_url TEXT,
    
    -- Banking Information
    bank_name VARCHAR(255) NOT NULL,
    account_holder_name VARCHAR(255) NOT NULL,
    account_number_last4 VARCHAR(4) NOT NULL,
    routing_number VARCHAR(50) NOT NULL,
    
    -- Verification
    id_type VARCHAR(50) NOT NULL,
    id_number VARCHAR(100) NOT NULL,
    
    -- Status and Admin fields
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CATEGORIES TABLE - Add missing columns
-- ============================================================================

ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sellers_email ON sellers(email);
CREATE INDEX IF NOT EXISTS idx_sellers_slug ON sellers(slug);
CREATE INDEX IF NOT EXISTS idx_sellers_email_verified ON sellers(email_verified);

CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_available ON products(is_available);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_email ON orders(buyer_email);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_person_id ON orders(delivery_person_id);

CREATE INDEX IF NOT EXISTS idx_buyers_email ON buyers(email);

CREATE INDEX IF NOT EXISTS idx_delivery_users_email ON delivery_users(email);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_seller_id ON reviews(seller_id);

CREATE INDEX IF NOT EXISTS idx_follows_buyer_email ON follows(buyer_email);
CREATE INDEX IF NOT EXISTS idx_follows_seller_id ON follows(seller_id);

CREATE INDEX IF NOT EXISTS idx_seller_applications_email ON seller_applications(email);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON seller_applications(status);
CREATE INDEX IF NOT EXISTS idx_seller_applications_application_id ON seller_applications(application_id);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================================================
-- UPDATE EXISTING DATA
-- ============================================================================

-- Generate slugs for categories if they don't have them
UPDATE categories 
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
WHERE slug IS NULL;

-- Generate order numbers for orders without them
UPDATE orders 
SET order_number = CONCAT('KM-', LPAD(id::TEXT, 8, '0'))
WHERE order_number IS NULL;

-- Set default total_amount for orders if NULL (based on subtotal or 0)
UPDATE orders 
SET total_amount = COALESCE(subtotal, 0)
WHERE total_amount IS NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'Migration completed successfully!' as status;
