const db = require('../models/database');

const addCategorySlug = async () => {
  try {
    console.log('🔧 Fixing categories table...');
    
    // First, show current categories
    const beforeCategories = await db.all('SELECT * FROM categories ORDER BY name, id');
    console.log(`\n📊 Found ${beforeCategories.length} categories (including duplicates)`);
    
    // Add slug column if it doesn't exist (drop unique constraint first if it exists)
    try {
      await db.run(`ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key`);
    } catch (e) {
      // Ignore if constraint doesn't exist
    }
    
    await db.run(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS slug VARCHAR(255)`);
    console.log('✅ Slug column ensured');
    
    // Clean up duplicates - keep only the first occurrence of each category name
    await db.run(`
      DELETE FROM categories
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM categories
        GROUP BY name
      )
    `);
    
    console.log('✅ Duplicate categories removed');
    
    // Generate slugs for remaining categories
    await db.run(`
      UPDATE categories 
      SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
      WHERE slug IS NULL OR slug = ''
    `);
    
    console.log('✅ Slugs generated for categories');
    
    // Add unique constraint back
    await db.run(`ALTER TABLE categories ADD CONSTRAINT categories_slug_key UNIQUE (slug)`);
    console.log('✅ Unique constraint added');
    
    // Display categories
    const categories = await db.all('SELECT * FROM categories ORDER BY name');
    console.log('\n📋 Categories in database:');
    categories.forEach(cat => {
      console.log(`   - ID: ${cat.id}, Name: ${cat.name}, Slug: ${cat.slug}`);
    });
    
    console.log('\n✅ Category table updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating categories:', error);
    process.exit(1);
  }
};

addCategorySlug();
