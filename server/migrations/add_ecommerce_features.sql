-- ============================================================================
-- KudiMall Enhanced E-commerce Features Migration
-- Adds: Wishlist, Shopping Cart enhancements, Flash Deals, Notifications
-- ============================================================================

-- ============================================================================
-- WISHLISTS TABLE - User favorites/saved items
-- ============================================================================

CREATE TABLE IF NOT EXISTS wishlists (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES buyers(id) ON DELETE CASCADE,
    buyer_email VARCHAR(255),
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure at least one user identifier is provided
    CONSTRAINT wishlists_user_check CHECK (buyer_id IS NOT NULL OR buyer_email IS NOT NULL),
    -- Unique constraint per buyer_id and product
    CONSTRAINT wishlists_buyer_product_unique UNIQUE (buyer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_buyer_id ON wishlists(buyer_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_buyer_email ON wishlists(buyer_email);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- ============================================================================
-- FLASH DEALS TABLE - Time-limited promotional pricing
-- ============================================================================

CREATE TABLE IF NOT EXISTS flash_deals (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    seller_id INTEGER REFERENCES sellers(id) ON DELETE CASCADE,
    original_price NUMERIC(10,2) NOT NULL,
    deal_price NUMERIC(10,2) NOT NULL,
    discount_percentage INTEGER NOT NULL,
    quantity_available INTEGER NOT NULL DEFAULT 10,
    quantity_sold INTEGER DEFAULT 0,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flash_deals_product_id ON flash_deals(product_id);
CREATE INDEX IF NOT EXISTS idx_flash_deals_seller_id ON flash_deals(seller_id);
CREATE INDEX IF NOT EXISTS idx_flash_deals_active ON flash_deals(is_active);
CREATE INDEX IF NOT EXISTS idx_flash_deals_ends_at ON flash_deals(ends_at);

-- ============================================================================
-- RECENTLY VIEWED TABLE - Track user browsing history
-- ============================================================================

CREATE TABLE IF NOT EXISTS recently_viewed (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES buyers(id) ON DELETE CASCADE,
    buyer_email VARCHAR(255),
    session_id VARCHAR(255),
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure at least one user identifier is provided
    CONSTRAINT recently_viewed_user_check CHECK (
        buyer_id IS NOT NULL OR buyer_email IS NOT NULL OR session_id IS NOT NULL
    )
);

CREATE INDEX IF NOT EXISTS idx_recently_viewed_buyer_id ON recently_viewed(buyer_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_session ON recently_viewed(session_id);
CREATE INDEX IF NOT EXISTS idx_recently_viewed_product ON recently_viewed(product_id);

-- ============================================================================
-- NOTIFICATIONS TABLE - User notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('buyer', 'seller', 'delivery')),
    user_id INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_type, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- ============================================================================
-- PRODUCT IMAGES TABLE - Multiple images per product
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- ============================================================================
-- ENHANCE PRODUCTS TABLE - Add rating aggregation
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_ends_at TIMESTAMP;

-- ============================================================================
-- ENHANCE CART ITEMS - Better cart management
-- ============================================================================

ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS saved_for_later BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- BANNER/PROMOTIONS TABLE - Homepage banners
-- ============================================================================

CREATE TABLE IF NOT EXISTS banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT,
    image_url TEXT NOT NULL,
    link_url VARCHAR(500),
    position VARCHAR(50) DEFAULT 'hero',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ends_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);

-- ============================================================================
-- SEED SAMPLE FLASH DEALS
-- ============================================================================

-- This will be handled by the application after products exist

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SELECT 'E-commerce features migration completed successfully!' as status;
