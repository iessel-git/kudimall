const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'kudimall_dev',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Map old categories to new ones
const categoryMigrations = [
  { oldName: 'Fashion', newName: 'Fashion & Apparel' },
  { oldName: 'Groceries', newName: 'Food & Beverages' }
];

async function cleanupDuplicateCategories() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Cleaning up duplicate categories...\n');

    for (const migration of categoryMigrations) {
      // Get old and new category IDs
      const oldCat = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        [migration.oldName]
      );
      
      const newCat = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        [migration.newName]
      );

      if (oldCat.rows.length === 0) {
        console.log(`⚠️  Old category "${migration.oldName}" not found, skipping...\n`);
        continue;
      }

      if (newCat.rows.length === 0) {
        console.log(`⚠️  New category "${migration.newName}" not found, skipping...\n`);
        continue;
      }

      const oldId = oldCat.rows[0].id;
      const newId = newCat.rows[0].id;

      // Check if any products use the old category
      const productsCheck = await client.query(
        'SELECT COUNT(*) as count FROM products WHERE category_id = $1',
        [oldId]
      );

      const productCount = parseInt(productsCheck.rows[0].count);

      if (productCount > 0) {
        // Migrate products to new category
        await client.query(
          'UPDATE products SET category_id = $1 WHERE category_id = $2',
          [newId, oldId]
        );
        console.log(`✅ Migrated ${productCount} product(s) from "${migration.oldName}" to "${migration.newName}"`);
      }

      // Delete old category
      await client.query('DELETE FROM categories WHERE id = $1', [oldId]);
      console.log(`✅ Deleted old category: "${migration.oldName}" (ID: ${oldId})\n`);
    }

    // Show final categories list
    const allCategories = await client.query(
      'SELECT id, name, slug, (SELECT COUNT(*) FROM products WHERE category_id = categories.id) as product_count FROM categories ORDER BY name'
    );

    console.log('\n📋 Final Categories List:');
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log('ID  | Category Name                | Slug                        | Products');
    console.log('═══════════════════════════════════════════════════════════════════════');
    allCategories.rows.forEach(cat => {
      console.log(
        `${String(cat.id).padEnd(4)}| ${cat.name.padEnd(29)}| ${cat.slug.padEnd(28)}| ${cat.product_count}`
      );
    });
    console.log('═══════════════════════════════════════════════════════════════════════');
    console.log(`Total: ${allCategories.rows.length} categories\n`);

  } catch (error) {
    console.error('❌ Error cleaning up categories:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
cleanupDuplicateCategories()
  .then(() => {
    console.log('✅ Category cleanup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
