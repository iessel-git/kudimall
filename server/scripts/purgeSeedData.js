const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../models/database');

const SEED_USER_EMAILS = ['buyer@example.com', 'seller@example.com'];
const SEED_SELLER_SHOP = 'Test Seller Shop';
const SEED_SELLER_EMAIL = 'seller@example.com';
const SEED_PRODUCT_NAMES = ['iPhone 14', 'Men T-Shirt', 'Rice 5kg'];
const SEED_COUPON_CODES = ['WELCOME10', 'FIRST20', 'FREESHIP'];

const toIdList = (rows) => rows.map((row) => row.id).filter(Boolean);
const inClause = (ids, startAt = 1) => ids.map((_, index) => `$${startAt + index}`).join(', ');

const purgeSeedData = async () => {
  const summary = {
    users: 0,
    sellers: 0,
    products: 0,
    categories: 0,
    coupons: 0,
    orders: 0,
    orderItems: 0,
    cartItems: 0,
    carts: 0,
    follows: 0,
    reviews: 0,
    inventoryAlerts: 0,
    sellerApplications: 0,
    couponUsage: 0
  };

  try {
    await db.run('BEGIN');

    const seedUsers = await db.all(
      `SELECT id FROM users WHERE LOWER(email) = ANY($1::text[])`,
      [SEED_USER_EMAILS.map((email) => email.toLowerCase())]
    );
    const seedUserIds = toIdList(seedUsers);

    const seedSellers = await db.all(
      `SELECT id FROM sellers
       WHERE LOWER(shop_name) = LOWER($1)
          OR LOWER(email) = LOWER($2)
          OR user_id = ANY($3::int[])`,
      [SEED_SELLER_SHOP, SEED_SELLER_EMAIL, seedUserIds.length ? seedUserIds : [0]]
    );
    const seedSellerIds = [...new Set(toIdList(seedSellers))];

    const seedProducts = await db.all(
      `SELECT id FROM products
       WHERE LOWER(name) = ANY($1::text[])
          OR seller_id = ANY($2::int[])`,
      [SEED_PRODUCT_NAMES.map((name) => name.toLowerCase()), seedSellerIds.length ? seedSellerIds : [0]]
    );
    const seedProductIds = [...new Set(toIdList(seedProducts))];

    const seedCategories = await db.all(
      `SELECT id FROM categories
       WHERE LOWER(name) = ANY($1::text[])
         AND (description ILIKE '%Phones, gadgets%' OR description ILIKE '%Clothing and accessories%' OR description ILIKE '%Food and beverages%')`,
      [['electronics', 'fashion', 'groceries']]
    );
    const seedCategoryIds = toIdList(seedCategories);

    const seedCoupons = await db.all(
      `SELECT id FROM coupons WHERE UPPER(code) = ANY($1::text[])`,
      [SEED_COUPON_CODES]
    );
    const seedCouponIds = toIdList(seedCoupons);

    if (seedProductIds.length) {
      const placeholders = inClause(seedProductIds);
      const orderItemsDelete = await db.run(`DELETE FROM order_items WHERE product_id IN (${placeholders})`, seedProductIds);
      summary.orderItems += orderItemsDelete.rowCount || 0;

      const ordersByProductDelete = await db.run(`DELETE FROM orders WHERE product_id IN (${placeholders})`, seedProductIds);
      summary.orders += ordersByProductDelete.rowCount || 0;

      const cartItemsDelete = await db.run(`DELETE FROM cart_items WHERE product_id IN (${placeholders})`, seedProductIds);
      summary.cartItems += cartItemsDelete.rowCount || 0;

      const reviewsDelete = await db.run(`DELETE FROM reviews WHERE product_id IN (${placeholders})`, seedProductIds);
      summary.reviews += reviewsDelete.rowCount || 0;

      const inventoryDelete = await db.run(`DELETE FROM inventory_alerts WHERE product_id IN (${placeholders})`, seedProductIds);
      summary.inventoryAlerts += inventoryDelete.rowCount || 0;
    }

    if (seedSellerIds.length) {
      const placeholders = inClause(seedSellerIds);

      const orderItemsBySellerDelete = await db.run(
        `DELETE FROM order_items
         WHERE order_id IN (SELECT id FROM orders WHERE seller_id IN (${placeholders}))`,
        seedSellerIds
      );
      summary.orderItems += orderItemsBySellerDelete.rowCount || 0;

      const ordersDelete = await db.run(`DELETE FROM orders WHERE seller_id IN (${placeholders})`, seedSellerIds);
      summary.orders += ordersDelete.rowCount || 0;

      const followsDelete = await db.run(`DELETE FROM follows WHERE seller_id IN (${placeholders})`, seedSellerIds);
      summary.follows += followsDelete.rowCount || 0;

      const reviewsDelete = await db.run(`DELETE FROM reviews WHERE seller_id IN (${placeholders})`, seedSellerIds);
      summary.reviews += reviewsDelete.rowCount || 0;

      const inventoryDelete = await db.run(`DELETE FROM inventory_alerts WHERE seller_id IN (${placeholders})`, seedSellerIds);
      summary.inventoryAlerts += inventoryDelete.rowCount || 0;

      const productsDelete = await db.run(`DELETE FROM products WHERE seller_id IN (${placeholders})`, seedSellerIds);
      summary.products += productsDelete.rowCount || 0;

      const sellersDelete = await db.run(`DELETE FROM sellers WHERE id IN (${placeholders})`, seedSellerIds);
      summary.sellers += sellersDelete.rowCount || 0;
    }

    if (seedProductIds.length) {
      const placeholders = inClause(seedProductIds);
      const productsDelete = await db.run(`DELETE FROM products WHERE id IN (${placeholders})`, seedProductIds);
      summary.products += productsDelete.rowCount || 0;
    }

    if (seedCouponIds.length) {
      const placeholders = inClause(seedCouponIds);
      const couponUsageDelete = await db.run(`DELETE FROM coupon_usage WHERE coupon_id IN (${placeholders})`, seedCouponIds);
      summary.couponUsage += couponUsageDelete.rowCount || 0;

      const couponsDelete = await db.run(`DELETE FROM coupons WHERE id IN (${placeholders})`, seedCouponIds);
      summary.coupons += couponsDelete.rowCount || 0;
    }

    if (seedCategoryIds.length) {
      const placeholders = inClause(seedCategoryIds);
      const categoriesDelete = await db.run(`DELETE FROM categories WHERE id IN (${placeholders})`, seedCategoryIds);
      summary.categories += categoriesDelete.rowCount || 0;
    }

    if (seedUserIds.length) {
      const placeholders = inClause(seedUserIds);
      const cartsDelete = await db.run(`DELETE FROM carts WHERE user_id IN (${placeholders})`, seedUserIds);
      summary.carts += cartsDelete.rowCount || 0;

      const usersDelete = await db.run(`DELETE FROM users WHERE id IN (${placeholders})`, seedUserIds);
      summary.users += usersDelete.rowCount || 0;
    }

    const appsDelete = await db.run(
      `DELETE FROM seller_applications
       WHERE LOWER(email) = LOWER($1)
          OR LOWER(store_name) = LOWER($2)
          OR LOWER(first_name || ' ' || last_name) = LOWER($3)`,
      [SEED_SELLER_EMAIL, SEED_SELLER_SHOP, 'Test Seller']
    );
    summary.sellerApplications += appsDelete.rowCount || 0;

    await db.run('COMMIT');
    return summary;
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
};

if (require.main === module) {
  purgeSeedData()
    .then((summary) => {
      console.log('✅ Seed data purge complete:', summary);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed data purge failed:', error);
      process.exit(1);
    });
}

module.exports = purgeSeedData;
