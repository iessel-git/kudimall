const db = require('../models/database');

const seedDb = async () => {
  try {
    console.log('🌱 Seeding KudiMall Database...');
    
    // Create tables first
    console.log('🔧 Creating tables...');
    
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
    
    // Sellers table
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
    
    console.log('✅ Tables created successfully');

    // Seed Categories
    const categories = [
      { name: 'Electronics', slug: 'electronics', description: 'Phones, laptops, gadgets and accessories' },
      { name: 'Fashion', slug: 'fashion', description: 'Clothing, shoes, and accessories' },
      { name: 'Beauty & Health', slug: 'beauty-health', description: 'Skincare, makeup, and wellness products' },
      { name: 'Home & Living', slug: 'home-living', description: 'Furniture, decor, and home essentials' },
      { name: 'Food & Beverages', slug: 'food-beverages', description: 'Fresh food, snacks, and drinks' },
      { name: 'Books & Media', slug: 'books-media', description: 'Books, music, and entertainment' },
      { name: 'Sports & Fitness', slug: 'sports-fitness', description: 'Sporting goods and fitness equipment' },
      { name: 'Toys & Games', slug: 'toys-games', description: 'Toys, games, and educational items' }
    ];

    for (const cat of categories) {
      await db.run(
        'INSERT OR IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)',
        [cat.name, cat.slug, cat.description]
      );
    }

    // Seed Sellers
    const sellers = [
      {
        name: 'TechHub Nigeria',
        slug: 'techhub-nigeria',
        email: 'techhub@kudimall.com',
        phone: '+234-800-TECH-HUB',
        description: 'Your trusted source for quality electronics and gadgets',
        trust_level: 5,
        is_verified: 1,
        location: 'Lagos, Nigeria'
      },
      {
        name: 'Fashion Forward',
        slug: 'fashion-forward',
        email: 'fashion@kudimall.com',
        phone: '+234-800-FASHION',
        description: 'Latest trends in African and international fashion',
        trust_level: 4,
        is_verified: 1,
        location: 'Abuja, Nigeria'
      },
      {
        name: 'Beauty Essentials',
        slug: 'beauty-essentials',
        email: 'beauty@kudimall.com',
        phone: '+234-800-BEAUTY',
        description: 'Premium beauty and skincare products',
        trust_level: 5,
        is_verified: 1,
        location: 'Port Harcourt, Nigeria'
      },
      {
        name: 'Home Comfort Store',
        slug: 'home-comfort',
        email: 'homecomfort@kudimall.com',
        phone: '+234-800-HOME',
        description: 'Making your house a home with quality furnishings',
        trust_level: 3,
        is_verified: 1,
        location: 'Ibadan, Nigeria'
      }
    ];

    const sellerIds = [];
    for (const seller of sellers) {
      const result = await db.run(
        `INSERT OR IGNORE INTO sellers 
        (name, slug, email, phone, description, trust_level, is_verified, location) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [seller.name, seller.slug, seller.email, seller.phone, seller.description, 
         seller.trust_level, seller.is_verified, seller.location]
      );
      sellerIds.push(result.id);
    }

    // Seed Products
    const products = [
      {
        seller_id: 1,
        category_id: 1,
        name: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        description: 'Latest Apple flagship with A17 Pro chip, titanium design',
        price: 1250000,
        stock: 15,
        is_featured: 1
      },
      {
        seller_id: 1,
        category_id: 1,
        name: 'Samsung Galaxy S24 Ultra',
        slug: 'samsung-galaxy-s24-ultra',
        description: 'Premium Android phone with AI features and S Pen',
        price: 1150000,
        stock: 20,
        is_featured: 1
      },
      {
        seller_id: 1,
        category_id: 1,
        name: 'MacBook Pro 14" M3',
        slug: 'macbook-pro-14-m3',
        description: 'Powerful laptop for professionals',
        price: 2500000,
        stock: 8,
        is_featured: 1
      },
      {
        seller_id: 2,
        category_id: 2,
        name: 'African Print Dress',
        slug: 'african-print-dress',
        description: 'Beautiful Ankara dress with modern cut',
        price: 15000,
        stock: 50,
        is_featured: 1
      },
      {
        seller_id: 2,
        category_id: 2,
        name: 'Denim Jeans - Slim Fit',
        slug: 'denim-jeans-slim',
        description: 'Classic blue jeans, comfortable fit',
        price: 12000,
        stock: 100
      },
      {
        seller_id: 2,
        category_id: 2,
        name: 'Sneakers - Air Jordan Style',
        slug: 'sneakers-jordan',
        description: 'Trendy sneakers for everyday wear',
        price: 35000,
        stock: 30
      },
      {
        seller_id: 3,
        category_id: 3,
        name: 'Shea Butter Body Cream',
        slug: 'shea-butter-cream',
        description: 'Natural moisturizer for all skin types',
        price: 8000,
        stock: 200,
        is_featured: 1
      },
      {
        seller_id: 3,
        category_id: 3,
        name: 'Face Serum - Vitamin C',
        slug: 'vitamin-c-serum',
        description: 'Brightening serum for glowing skin',
        price: 15000,
        stock: 75
      },
      {
        seller_id: 4,
        category_id: 4,
        name: 'Wooden Dining Table Set',
        slug: 'dining-table-set',
        description: '6-seater solid wood dining set',
        price: 180000,
        stock: 5
      },
      {
        seller_id: 4,
        category_id: 4,
        name: 'LED Floor Lamp',
        slug: 'led-floor-lamp',
        description: 'Modern adjustable floor lamp',
        price: 25000,
        stock: 15
      }
    ];

    for (const product of products) {
      await db.run(
        `INSERT OR IGNORE INTO products 
        (seller_id, category_id, name, slug, description, price, stock, is_featured) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [product.seller_id, product.category_id, product.name, product.slug, 
         product.description, product.price, product.stock, product.is_featured || 0]
      );
    }

    // Seed Reviews
    const reviews = [
      {
        product_id: 1,
        seller_id: 1,
        buyer_name: 'Chidi Okafor',
        rating: 5,
        comment: 'Amazing phone! Fast delivery and genuine product.'
      },
      {
        product_id: 2,
        seller_id: 1,
        buyer_name: 'Amina Hassan',
        rating: 5,
        comment: 'Best phone I\'ve ever owned. TechHub is reliable!'
      },
      {
        product_id: 4,
        seller_id: 2,
        buyer_name: 'Funke Adeyemi',
        rating: 5,
        comment: 'Beautiful dress, fits perfectly!'
      },
      {
        product_id: 7,
        seller_id: 3,
        buyer_name: 'Grace Mbah',
        rating: 4,
        comment: 'Good quality cream, makes my skin soft'
      }
    ];

    for (const review of reviews) {
      await db.run(
        `INSERT OR IGNORE INTO reviews 
        (product_id, seller_id, buyer_name, rating, comment) 
        VALUES (?, ?, ?, ?, ?)`,
        [review.product_id, review.seller_id, review.buyer_name, 
         review.rating, review.comment]
      );
    }

    console.log('✅ Database seeded successfully!');
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${sellers.length} sellers`);
    console.log(`   - ${products.length} products`);
    console.log(`   - ${reviews.length} reviews`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Export the function for API use, but also run if called directly
if (require.main === module) {
  seedDb().catch(error => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = seedDb;
