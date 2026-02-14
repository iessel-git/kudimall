const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../models/database');

const hasColumn = async (tableName, columnName) => {
  const result = await db.get(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2
     LIMIT 1`,
    [tableName, columnName]
  );
  return !!result;
};

const updateForeignKeyIfExists = async (tableName, columnName, oldId, newId) => {
  const exists = await hasColumn(tableName, columnName);
  if (!exists) {
    return 0;
  }

  const result = await db.run(
    `UPDATE ${tableName} SET ${columnName} = $1 WHERE ${columnName} = $2`,
    [newId, oldId]
  );

  return result.rowCount || 0;
};

// Clean duplicate categories - keep oldest by ID
const cleanupDuplicateCategories = async () => {
  console.log('\n=== Cleaning Duplicate Categories ===');
  const summary = { merged: 0, deleted: 0 };

  // Find all duplicate category names (case-insensitive)
  const duplicates = await db.all(
    `SELECT LOWER(name) as name_lower, COUNT(*) as count, 
            array_agg(id ORDER BY id ASC) as ids
     FROM categories
     GROUP BY LOWER(name)
     HAVING COUNT(*) > 1`
  );

  console.log(`Found ${duplicates.length} duplicate category groups`);

  for (const dup of duplicates) {
    const ids = dup.ids;
    const canonicalId = ids[0]; // Keep the oldest (lowest ID)
    const duplicateIds = ids.slice(1);

    console.log(`Category "${dup.name_lower}": keeping ID ${canonicalId}, removing ${duplicateIds.length} duplicates`);

    for (const duplicateId of duplicateIds) {
      // Update products to point to canonical category
      const updated = await updateForeignKeyIfExists('products', 'category_id', duplicateId, canonicalId);
      summary.merged += updated;
      console.log(`  Reassigned ${updated} products from category ${duplicateId} to ${canonicalId}`);

      // Delete the duplicate category
      await db.run('DELETE FROM categories WHERE id = $1', [duplicateId]);
      summary.deleted++;
    }
  }

  console.log(`Category cleanup: merged ${summary.merged} products, deleted ${summary.deleted} duplicate categories`);
  return summary;
};

// Clean duplicate products - keep oldest by ID within same seller
const cleanupDuplicateProducts = async () => {
  console.log('\n=== Cleaning Duplicate Products ===');
  const summary = { deleted: 0 };

  // Find all duplicate products (same name within same seller)
  const duplicates = await db.all(
    `SELECT seller_id, LOWER(name) as name_lower, COUNT(*) as count,
            array_agg(id ORDER BY id ASC) as ids
     FROM products
     GROUP BY seller_id, LOWER(name)
     HAVING COUNT(*) > 1`
  );

  console.log(`Found ${duplicates.length} duplicate product groups`);

  for (const dup of duplicates) {
    const ids = dup.ids;
    const canonicalId = ids[0]; // Keep the oldest (lowest ID)
    const duplicateIds = ids.slice(1);

    console.log(`Product "${dup.name_lower}" (seller ${dup.seller_id}): keeping ID ${canonicalId}, removing ${duplicateIds.length} duplicates`);

    for (const duplicateId of duplicateIds) {
      // Update order_items to point to canonical product (if table exists)
      await updateForeignKeyIfExists('order_items', 'product_id', duplicateId, canonicalId);
      
      // Update cart_items to point to canonical product (if table exists)
      await updateForeignKeyIfExists('cart_items', 'product_id', duplicateId, canonicalId);

      // Delete product_images for duplicate product (if table exists)
      if (await hasColumn('product_images', 'product_id')) {
        await db.run('DELETE FROM product_images WHERE product_id = $1', [duplicateId]);
      }

      // Delete the duplicate product
      await db.run('DELETE FROM products WHERE id = $1', [duplicateId]);
      summary.deleted++;
    }
  }

  console.log(`Product cleanup: deleted ${summary.deleted} duplicate products`);
  return summary;
};

// Keep only 5 oldest sellers, delete the rest
const limitSellersToFive = async () => {
  console.log('\n=== Limiting to 5 Sellers ===');
  const summary = { kept: 0, deleted: 0 };

  // Get all sellers ordered by ID (oldest first)
  const allSellers = await db.all(
    `SELECT id, shop_name, user_id FROM sellers ORDER BY id ASC`
  );

  console.log(`Found ${allSellers.length} total sellers`);

  if (allSellers.length <= 5) {
    console.log('Already have 5 or fewer sellers, no deletion needed');
    return summary;
  }

  const keepSellers = allSellers.slice(0, 5);
  const deleteSellers = allSellers.slice(5);

  summary.kept = keepSellers.length;
  summary.deleted = deleteSellers.length;

  console.log(`Keeping ${summary.kept} sellers, deleting ${summary.deleted} sellers:`);
  keepSellers.forEach(s => console.log(`  KEEP: ID ${s.id} - ${s.shop_name}`));
  deleteSellers.forEach(s => console.log(`  DELETE: ID ${s.id} - ${s.shop_name}`));

  for (const seller of deleteSellers) {
    // Get all product IDs for this seller first
    const sellerProducts = await db.all(
      'SELECT id FROM products WHERE seller_id = $1',
      [seller.id]
    );
    const productIds = sellerProducts.map(p => p.id);

    if (productIds.length > 0) {
      // Delete related data for these products (if tables exist)
      if (await hasColumn('product_images', 'product_id')) {
        for (const prodId of productIds) {
          await db.run('DELETE FROM product_images WHERE product_id = $1', [prodId]);
        }
      }

      if (await hasColumn('cart_items', 'product_id')) {
        for (const prodId of productIds) {
          await db.run('DELETE FROM cart_items WHERE product_id = $1', [prodId]);
        }
      }

      if (await hasColumn('order_items', 'product_id')) {
        for (const prodId of productIds) {
          await db.run('DELETE FROM order_items WHERE product_id = $1', [prodId]);
        }
      }

      if (await hasColumn('reviews', 'product_id')) {
        for (const prodId of productIds) {
          await db.run('DELETE FROM reviews WHERE product_id = $1', [prodId]);
        }
      }
    }

    // Delete products for this seller
    const productsDeleted = await db.run(
      'DELETE FROM products WHERE seller_id = $1',
      [seller.id]
    );
    console.log(`  Deleted ${productsDeleted.rowCount || 0} products for seller ${seller.id}`);

    // Delete flash deals if table exists
    if (await hasColumn('flash_deals', 'seller_id')) {
      await db.run('DELETE FROM flash_deals WHERE seller_id = $1', [seller.id]);
    }

    // Delete seller applications if exists
    if (await hasColumn('seller_applications', 'user_id')) {
      await db.run('DELETE FROM seller_applications WHERE user_id = $1', [seller.user_id]);
    }

    // Delete the seller
    await db.run('DELETE FROM sellers WHERE id = $1', [seller.id]);

    // Delete the associated user if it exists
    if (seller.user_id) {
      await db.run('DELETE FROM users WHERE id = $1', [seller.user_id]);
    }
  }

  console.log(`Seller cleanup: kept ${summary.kept}, deleted ${summary.deleted} sellers`);
  return summary;
};

// Main execution
const runProductionCleanup = async () => {
  console.log('========================================');
  console.log('PRODUCTION DATABASE CLEANUP');
  console.log('========================================');
  console.log(`Database: ${process.env.DB_NAME || process.env.PGDATABASE}`);
  console.log(`Host: ${process.env.DB_HOST || process.env.PGHOST}`);
  console.log('========================================');

  // Before counts
  const beforeStats = {
    categories: (await db.get('SELECT COUNT(*)::int as count FROM categories')).count,
    products: (await db.get('SELECT COUNT(*)::int as count FROM products')).count,
    sellers: (await db.get('SELECT COUNT(*)::int as count FROM sellers')).count,
  };

  console.log('\n📊 Before cleanup:');
  console.log(`  Categories: ${beforeStats.categories}`);
  console.log(`  Products: ${beforeStats.products}`);
  console.log(`  Sellers: ${beforeStats.sellers}`);

  // Run cleanup operations in order
  const categoryResult = await cleanupDuplicateCategories();
  const productResult = await cleanupDuplicateProducts();
  const sellerResult = await limitSellersToFive();

  // After counts
  const afterStats = {
    categories: (await db.get('SELECT COUNT(*)::int as count FROM categories')).count,
    products: (await db.get('SELECT COUNT(*)::int as count FROM products')).count,
    sellers: (await db.get('SELECT COUNT(*)::int as count FROM sellers')).count,
  };

  console.log('\n📊 After cleanup:');
  console.log(`  Categories: ${afterStats.categories} (was ${beforeStats.categories})`);
  console.log(`  Products: ${afterStats.products} (was ${beforeStats.products})`);
  console.log(`  Sellers: ${afterStats.sellers} (was ${beforeStats.sellers})`);

  console.log('\n✅ Production cleanup completed successfully!');

  return {
    beforeStats,
    afterStats,
    categoryResult,
    productResult,
    sellerResult
  };
};

// Export for use in API endpoint
module.exports = runProductionCleanup;

// Run directly if called as script
if (require.main === module) {
  runProductionCleanup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('\n❌ Error during production cleanup:', error);
      process.exit(1);
    });
}
