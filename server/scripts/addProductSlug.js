const db = require('../models/database');

const addProductSlug = async () => {
  try {
    console.log('🔧 Adding slug column to products table...');
    
    // Add slug column if it doesn't exist
    await db.run(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255)
    `);
    
    console.log('✅ Slug column added to products');
    
    // Generate slugs for existing products
    const products = await db.all('SELECT id, name, seller_id FROM products WHERE slug IS NULL OR slug = \'\'');
    
    console.log(`📝 Generating slugs for ${products.length} products...`);
    
    for (const product of products) {
      const baseSlug = product.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      let slug = baseSlug;
      let counter = 1;
      
      // Check if slug exists for this seller
      let exists = await db.get(
        'SELECT id FROM products WHERE slug = $1 AND seller_id = $2 AND id != $3',
        [slug, product.seller_id, product.id]
      );
      
      while (exists) {
        slug = `${baseSlug}-${counter}`;
        exists = await db.get(
          'SELECT id FROM products WHERE slug = $1 AND seller_id = $2 AND id != $3',
          [slug, product.seller_id, product.id]
        );
        counter++;
      }
      
      await db.run('UPDATE products SET slug = $1 WHERE id = $2', [slug, product.id]);
    }
    
    console.log('✅ Slugs generated for all products');
    
    // Show sample products
    const sampleProducts = await db.all('SELECT id, name, slug FROM products LIMIT 5');
    console.log('\n📋 Sample products:');
    sampleProducts.forEach(p => {
      console.log(`   - ${p.name} → ${p.slug}`);
    });
    
    console.log('\n✅ Products table updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating products table:', error);
    process.exit(1);
  }
};

addProductSlug();
