const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'kudimall_dev',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Categories from the seller application form
const formCategories = [
  { name: 'Electronics', description: 'Phones, laptops, gadgets, and electronic accessories' },
  { name: 'Fashion & Apparel', description: 'Clothing, shoes, and fashion accessories' },
  { name: 'Home & Garden', description: 'Furniture, home decor, and gardening supplies' },
  { name: 'Beauty & Personal Care', description: 'Cosmetics, skincare, and personal care products' },
  { name: 'Sports & Outdoors', description: 'Sports equipment, outdoor gear, and fitness products' },
  { name: 'Toys & Games', description: 'Toys, games, and entertainment for all ages' },
  { name: 'Books & Media', description: 'Books, movies, music, and digital media' },
  { name: 'Jewelry & Accessories', description: 'Jewelry, watches, and fashion accessories' },
  { name: 'Art & Crafts', description: 'Art supplies, craft materials, and handmade items' },
  { name: 'Food & Beverages', description: 'Fresh produce, packaged foods, and beverages' },
  { name: 'Health & Wellness', description: 'Vitamins, supplements, and health products' },
  { name: 'Automotive', description: 'Car parts, accessories, and automotive supplies' }
];

// Function to generate slug from name
function generateSlug(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function addCategories() {
  const client = await pool.connect();
  
  try {
    console.log('Adding categories from seller application form...\n');

    for (const category of formCategories) {
      const slug = generateSlug(category.name);
      
      // Check if category already exists by name or slug
      const checkResult = await client.query(
        'SELECT id, name, slug FROM categories WHERE name = $1 OR slug = $2',
        [category.name, slug]
      );

      if (checkResult.rows.length > 0) {
        const existing = checkResult.rows[0];
        console.log(`⚠️  Category "${category.name}" already exists (ID: ${existing.id})`);
        
        // Update description if it's generic or missing
        if (!existing.description || existing.description.length < 20) {
          await client.query(
            'UPDATE categories SET description = $1 WHERE id = $2',
            [category.description, existing.id]
          );
          console.log(`   ✅ Updated description for "${category.name}"\n`);
        }
      } else {
        // Insert new category
        const insertResult = await client.query(
          'INSERT INTO categories (name, description, slug) VALUES ($1, $2, $3) RETURNING id',
          [category.name, category.description, slug]
        );
        
        console.log(`✅ Added category: "${category.name}"`);
        console.log(`   Slug: /${slug}`);
        console.log(`   ID: ${insertResult.rows[0].id}\n`);
      }
    }

    // Show all categories
    const allCategories = await client.query(
      'SELECT id, name, slug FROM categories ORDER BY name'
    );

    console.log('\n📋 All Categories in Database:');
    console.log('═══════════════════════════════════════════════════════════');
    allCategories.rows.forEach(cat => {
      console.log(`${cat.id}. ${cat.name} → /${cat.slug}`);
    });
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Total: ${allCategories.rows.length} categories\n`);

  } catch (error) {
    console.error('❌ Error adding categories:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
addCategories()
  .then(() => {
    console.log('✅ Category setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
