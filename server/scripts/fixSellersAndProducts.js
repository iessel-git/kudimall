const db = require('../models/database');

const fixSellersAndProducts = async () => {
  try {
    console.log('🔧 Fixing sellers and products data...\n');
    
    // 1. Generate slugs for sellers without slugs
    console.log('📝 Generating slugs for sellers...');
    const sellersWithoutSlugs = await db.all(`
      SELECT id, name, shop_name, email 
      FROM sellers 
      WHERE slug IS NULL OR slug = ''
    `);
    
    console.log(`Found ${sellersWithoutSlugs.length} sellers without slugs`);
    
    for (const seller of sellersWithoutSlugs) {
      // Use name first, fallback to shop_name, then email
      let baseName = seller.name || seller.shop_name || seller.email?.split('@')[0] || `seller-${seller.id}`;
      
      let baseSlug = baseName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      let slug = baseSlug;
      let counter = 1;
      
      // Check if slug exists
      let exists = await db.get(
        'SELECT id FROM sellers WHERE slug = $1 AND id != $2',
        [slug, seller.id]
      );
      
      while (exists) {
        slug = `${baseSlug}-${counter}`;
        exists = await db.get(
          'SELECT id FROM sellers WHERE slug = $1 AND id != $2',
          [slug, seller.id]
        );
        counter++;
      }
      
      await db.run('UPDATE sellers SET slug = $1 WHERE id = $2', [slug, seller.id]);
      console.log(`  ✓ Seller ID ${seller.id}: "${baseName}" → "${slug}"`);
    }
    
    console.log('✅ Seller slugs generated\n');
    
    // 2. Mark some products as featured
    console.log('🌟 Marking products as featured...');
    const products = await db.all(`
      SELECT id, name 
      FROM products 
      WHERE is_available = TRUE 
      ORDER BY created_at DESC 
      LIMIT 8
    `);
    
    if (products.length > 0) {
      const productIds = products.map(p => p.id);
      const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
      
      await db.run(`
        UPDATE products 
        SET is_featured = TRUE 
        WHERE id IN (${placeholders})
      `, productIds);
      
      console.log(`  ✓ Marked ${products.length} products as featured:`);
      products.forEach(p => console.log(`    - ${p.name}`));
    } else {
      console.log('  ⚠️  No products found to mark as featured');
    }
    
    console.log('✅ Products updated\n');
    
    // 3. Show summary
    console.log('📊 Updated Database Summary:');
    
    const sellers = await db.all('SELECT id, name, shop_name, slug FROM sellers ORDER BY id LIMIT 5');
    console.log('\n👥 Sellers:');
    sellers.forEach(s => {
      console.log(`  ${s.id}. ${s.name || s.shop_name} → /${s.slug}`);
    });
    
    const featuredProducts = await db.all(`
      SELECT p.id, p.name, p.slug, s.name as seller_name 
      FROM products p 
      JOIN sellers s ON p.seller_id = s.id 
      WHERE p.is_featured = TRUE 
      LIMIT 5
    `);
    console.log('\n⭐ Featured Products:');
    if (featuredProducts.length > 0) {
      featuredProducts.forEach(p => {
        console.log(`  ${p.id}. ${p.name} (by ${p.seller_name})`);
      });
    } else {
      console.log('  (none)');
    }
    
    const categories = await db.all('SELECT id, name, slug FROM categories');
    console.log('\n📂 Categories:');
    categories.forEach(c => {
      console.log(`  ${c.id}. ${c.name} → /${c.slug}`);
    });
    
    console.log('\n✅ All fixes applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixSellersAndProducts();
