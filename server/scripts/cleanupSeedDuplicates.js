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

const updateForeignKeyIfExists = async (tableName, columnName, duplicateId, canonicalId) => {
  const exists = await hasColumn(tableName, columnName);
  if (!exists) {
    return 0;
  }

  const result = await db.run(
    `UPDATE ${tableName} SET ${columnName} = $1 WHERE ${columnName} = $2`,
    [canonicalId, duplicateId]
  );

  return result.rowCount || 0;
};

const cleanupDuplicateCategories = async () => {
  const summary = { merged: 0, deleted: 0 };
  const seedCategoryNames = ['Electronics', 'Fashion', 'Groceries'];

  for (const categoryName of seedCategoryNames) {
    const rows = await db.all(
      `SELECT id
       FROM categories
       WHERE LOWER(name) = LOWER($1)
       ORDER BY id ASC`,
      [categoryName]
    );

    if (rows.length <= 1) {
      continue;
    }

    const canonicalId = rows[0].id;
    for (const duplicate of rows.slice(1)) {
      summary.merged += await updateForeignKeyIfExists('products', 'category_id', duplicate.id, canonicalId);
      await db.run('DELETE FROM categories WHERE id = $1', [duplicate.id]);
      summary.deleted += 1;
    }
  }

  return summary;
};

const cleanupDuplicateSellers = async () => {
  const summary = { merged: 0, deleted: 0, canonicalSellerId: null };

  const rows = await db.all(
    `SELECT id
     FROM sellers
     WHERE LOWER(shop_name) = LOWER($1)
        OR LOWER(email) = LOWER($2)
     ORDER BY id ASC`,
    ['Test Seller Shop', 'seller@example.com']
  );

  if (rows.length === 0) {
    return summary;
  }

  const canonicalId = rows[0].id;
  summary.canonicalSellerId = canonicalId;

  for (const duplicate of rows.slice(1)) {
    summary.merged += await updateForeignKeyIfExists('products', 'seller_id', duplicate.id, canonicalId);
    summary.merged += await updateForeignKeyIfExists('orders', 'seller_id', duplicate.id, canonicalId);
    summary.merged += await updateForeignKeyIfExists('reviews', 'seller_id', duplicate.id, canonicalId);
    summary.merged += await updateForeignKeyIfExists('follows', 'seller_id', duplicate.id, canonicalId);
    summary.merged += await updateForeignKeyIfExists('inventory_alerts', 'seller_id', duplicate.id, canonicalId);

    await db.run('DELETE FROM sellers WHERE id = $1', [duplicate.id]);
    summary.deleted += 1;
  }

  return summary;
};

const cleanupDuplicateProducts = async (canonicalSellerId) => {
  const summary = { merged: 0, deleted: 0 };

  if (!canonicalSellerId) {
    return summary;
  }

  const seedProductNames = ['iPhone 14', 'Men T-Shirt', 'Rice 5kg'];

  for (const productName of seedProductNames) {
    const rows = await db.all(
      `SELECT id
       FROM products
       WHERE seller_id = $1
         AND LOWER(name) = LOWER($2)
       ORDER BY id ASC`,
      [canonicalSellerId, productName]
    );

    if (rows.length <= 1) {
      continue;
    }

    const canonicalId = rows[0].id;
    for (const duplicate of rows.slice(1)) {
      summary.merged += await updateForeignKeyIfExists('order_items', 'product_id', duplicate.id, canonicalId);
      summary.merged += await updateForeignKeyIfExists('orders', 'product_id', duplicate.id, canonicalId);
      summary.merged += await updateForeignKeyIfExists('cart_items', 'product_id', duplicate.id, canonicalId);
      summary.merged += await updateForeignKeyIfExists('reviews', 'product_id', duplicate.id, canonicalId);
      summary.merged += await updateForeignKeyIfExists('inventory_alerts', 'product_id', duplicate.id, canonicalId);
      summary.merged += await updateForeignKeyIfExists('wishlist_items', 'product_id', duplicate.id, canonicalId);

      await db.run('DELETE FROM products WHERE id = $1', [duplicate.id]);
      summary.deleted += 1;
    }
  }

  return summary;
};

const cleanupDuplicateUsers = async () => {
  const summary = { merged: 0, deleted: 0 };
  const seedUserEmails = ['buyer@example.com', 'seller@example.com'];

  for (const userEmail of seedUserEmails) {
    const rows = await db.all(
      `SELECT id
       FROM users
       WHERE LOWER(email) = LOWER($1)
       ORDER BY id ASC`,
      [userEmail]
    );

    if (rows.length <= 1) {
      continue;
    }

    const canonicalId = rows[0].id;
    for (const duplicate of rows.slice(1)) {
      summary.merged += await updateForeignKeyIfExists('sellers', 'user_id', duplicate.id, canonicalId);
      summary.merged += await updateForeignKeyIfExists('orders', 'user_id', duplicate.id, canonicalId);
      summary.merged += await updateForeignKeyIfExists('carts', 'user_id', duplicate.id, canonicalId);
      summary.merged += await updateForeignKeyIfExists('coupon_usage', 'user_id', duplicate.id, canonicalId);

      await db.run('DELETE FROM users WHERE id = $1', [duplicate.id]);
      summary.deleted += 1;
    }
  }

  return summary;
};

const cleanupSeedDuplicates = async () => {
  const categorySummary = await cleanupDuplicateCategories();
  const sellerSummary = await cleanupDuplicateSellers();
  const productSummary = await cleanupDuplicateProducts(sellerSummary.canonicalSellerId);
  const userSummary = await cleanupDuplicateUsers();

  return {
    categories: categorySummary,
    sellers: sellerSummary,
    products: productSummary,
    users: userSummary
  };
};

if (require.main === module) {
  cleanupSeedDuplicates()
    .then((summary) => {
      console.log('✅ Seed duplicates cleanup completed:', summary);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed duplicates cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = cleanupSeedDuplicates;
