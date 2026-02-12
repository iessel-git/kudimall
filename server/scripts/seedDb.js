const db = require('../models/database');

const seedDb = async () => {
  try {
    console.log('🌱 Seeding KudiMall Database...');

    // Ensure full schema exists before seeding data
    console.log('🔧 Initializing tables...');
    const initDb = require('./initDb');
    await initDb();

    // Seed Categories (Ghana-focused)
    const categories = [
      { name: 'Electronics', description: 'Phones, gadgets, and more' },
      { name: 'Fashion', description: 'Clothing and accessories' },
      { name: 'Groceries', description: 'Food and beverages' }
    ];
    for (const cat of categories) {
      await db.run(
        'INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [cat.name, cat.description]
      );
    }

    // Seed Users (Buyer & Seller)
    await db.run(
      'INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      ['Test Buyer', 'buyer@example.com', '$2b$10$testbuyerhash', '233201234567']
    );
    await db.run(
      'INSERT INTO users (name, email, password, phone) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      ['Test Seller', 'seller@example.com', '$2b$10$testsellerhash', '233209876543']
    );

    // Seed Seller (linked to Test Seller user)
    await db.run(
      'INSERT INTO sellers (user_id, shop_name, address, is_verified) SELECT id, $1, $2, $3 FROM users WHERE email=$4 ON CONFLICT DO NOTHING',
      ['Test Seller Shop', 'Accra, Ghana', true, 'seller@example.com']
    );

    // Seed Products (linked to Test Seller and categories)
    await db.run(
      `INSERT INTO products (seller_id, category_id, name, description, price, stock, image_url, is_available)
       SELECT s.id, c.id, $1, $2, $3, $4, $5, $6 FROM sellers s, categories c WHERE s.shop_name=$7 AND c.name=$8 ON CONFLICT DO NOTHING`,
      ['iPhone 14', 'Latest Apple iPhone', 1200.00, 10, 'https://example.com/iphone14.jpg', true, 'Test Seller Shop', 'Electronics']
    );
    await db.run(
      `INSERT INTO products (seller_id, category_id, name, description, price, stock, image_url, is_available)
       SELECT s.id, c.id, $1, $2, $3, $4, $5, $6 FROM sellers s, categories c WHERE s.shop_name=$7 AND c.name=$8 ON CONFLICT DO NOTHING`,
      ['Men T-Shirt', '100% Cotton T-Shirt', 25.00, 50, 'https://example.com/tshirt.jpg', true, 'Test Seller Shop', 'Fashion']
    );
    await db.run(
      `INSERT INTO products (seller_id, category_id, name, description, price, stock, image_url, is_available)
       SELECT s.id, c.id, $1, $2, $3, $4, $5, $6 FROM sellers s, categories c WHERE s.shop_name=$7 AND c.name=$8 ON CONFLICT DO NOTHING`,
      ['Rice 5kg', 'Premium Jasmine Rice', 40.00, 100, 'https://example.com/rice.jpg', true, 'Test Seller Shop', 'Groceries']
    );

    // (Optional) Seed Coupons
    await db.run(
      `INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_discount, usage_limit, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '30 days') ON CONFLICT DO NOTHING`,
      ['WELCOME10', 'percentage', 10.00, 50.00, 20.00, 100]
    );
    await db.run(
      `INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_discount, usage_limit, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '60 days') ON CONFLICT DO NOTHING`,
      ['FIRST20', 'fixed', 20.00, 100.00, null, 50]
    );
    await db.run(
      `INSERT INTO coupons (code, discount_type, discount_value, min_purchase, max_discount, usage_limit, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '90 days') ON CONFLICT DO NOTHING`,
      ['FREESHIP', 'fixed', 5.00, 0.00, null, null]
    );

    console.log('✅ Database seeded successfully!');
    console.log(`   - ${categories.length} categories`);
    console.log(`   - 2 users`);
    console.log(`   - 1 seller`);
    console.log(`   - 3 products`);
    console.log(`   - 3 coupons`);
    
    return {
      categories: categories.length,
      users: 2,
      sellers: 1,
      products: 3,
      coupons: 3
    };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Export the function for API use, but also run if called directly
if (require.main === module) {
  seedDb()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = seedDb;
