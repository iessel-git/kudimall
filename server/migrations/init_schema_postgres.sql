-- USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SELLERS
CREATE TABLE IF NOT EXISTS sellers (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    shop_name VARCHAR(100) NOT NULL,
    address TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CATEGORIES
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT
);

-- PRODUCTS
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

-- CARTS
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

-- COUPONS
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

CREATE TABLE IF NOT EXISTS coupon_usage (
    id SERIAL PRIMARY KEY,
    coupon_id INT REFERENCES coupons(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    order_id INT,
    discount_amount NUMERIC(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, coupon_id, order_id)
);

-- ORDERS
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

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    price NUMERIC(10,2) NOT NULL
);

-- INVENTORY ALERTS
CREATE TABLE IF NOT EXISTS inventory_alerts (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    seller_id INT REFERENCES sellers(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) CHECK (alert_type IN ('low_stock', 'out_of_stock')),
    threshold INT DEFAULT 5,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PAYMENT WEBHOOKS
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

-- SEED DATA

-- Categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Phones, gadgets, and more'),
('Fashion', 'Clothing and accessories'),
('Groceries', 'Food and beverages')
ON CONFLICT DO NOTHING;

-- Coupons
INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_discount, usage_limit, valid_until)
VALUES 
('WELCOME10', 'percentage', 10.00, 50.00, 20.00, 100, NOW() + INTERVAL '30 days'),
('FIRST20', 'fixed', 20.00, 100.00, NULL, 50, NOW() + INTERVAL '60 days'),
('FREESHIP', 'fixed', 5.00, 0.00, NULL, NULL, NOW() + INTERVAL '90 days')
ON CONFLICT DO NOTHING;

-- Users
INSERT INTO users (name, email, password, phone) VALUES
('Test Buyer', 'buyer@example.com', '$2b$10$testbuyerhash', '233201234567'),
('Test Seller', 'seller@example.com', '$2b$10$testsellerhash', '233209876543')
ON CONFLICT DO NOTHING;

-- Sellers (link to Test Seller user)
INSERT INTO sellers (user_id, shop_name, address, is_verified) 
SELECT id, 'Test Seller Shop', 'Accra, Ghana', TRUE FROM users WHERE email='seller@example.com'
ON CONFLICT DO NOTHING;

-- Products (link to Test Seller and categories)
INSERT INTO products (seller_id, category_id, name, description, price, stock, image_url, is_available)
SELECT s.id, c.id, 'iPhone 14', 'Latest Apple iPhone', 1200.00, 10, 'https://example.com/iphone14.jpg', TRUE
FROM sellers s, categories c WHERE s.shop_name='Test Seller Shop' AND c.name='Electronics'
ON CONFLICT DO NOTHING;

INSERT INTO products (seller_id, category_id, name, description, price, stock, image_url, is_available)
SELECT s.id, c.id, 'Men T-Shirt', '100% Cotton T-Shirt', 25.00, 50, 'https://example.com/tshirt.jpg', TRUE
FROM sellers s, categories c WHERE s.shop_name='Test Seller Shop' AND c.name='Fashion'
ON CONFLICT DO NOTHING;

INSERT INTO products (seller_id, category_id, name, description, price, stock, image_url, is_available)
SELECT s.id, c.id, 'Rice 5kg', 'Premium Jasmine Rice', 40.00, 100, 'https://example.com/rice.jpg', TRUE
FROM sellers s, categories c WHERE s.shop_name='Test Seller Shop' AND c.name='Groceries'
ON CONFLICT DO NOTHING;