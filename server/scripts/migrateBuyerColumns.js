const db = require('../models/database');

const migrateBuyerColumns = async () => {
  try {
    console.log('🔧 Migrating database for buyer authentication...');

    // Check if buyer_id column exists in orders table
    const ordersInfo = await db.all('PRAGMA table_info(orders)');
    const hasBuyerId = ordersInfo.some(col => col.name === 'buyer_id');

    if (!hasBuyerId) {
      console.log('Adding buyer_id column to orders table...');
      await db.run('ALTER TABLE orders ADD COLUMN buyer_id INTEGER');
      console.log('✓ Added buyer_id column to orders');
    } else {
      console.log('✓ buyer_id column already exists in orders');
    }

    // Check if buyer_id column exists in reviews table
    const reviewsInfo = await db.all('PRAGMA table_info(reviews)');
    const hasReviewBuyerId = reviewsInfo.some(col => col.name === 'buyer_id');

    if (!hasReviewBuyerId) {
      console.log('Adding buyer_id column to reviews table...');
      await db.run('ALTER TABLE reviews ADD COLUMN buyer_id INTEGER');
      console.log('✓ Added buyer_id column to reviews');
    } else {
      console.log('✓ buyer_id column already exists in reviews');
    }

    // Check if buyer_id column exists in follows table
    const followsInfo = await db.all('PRAGMA table_info(follows)');
    const hasFollowBuyerId = followsInfo.some(col => col.name === 'buyer_id');

    if (!hasFollowBuyerId) {
      console.log('Adding buyer_id column to follows table...');
      await db.run('ALTER TABLE follows ADD COLUMN buyer_id INTEGER');
      console.log('✓ Added buyer_id column to follows');
    } else {
      console.log('✓ buyer_id column already exists in follows');
    }

    console.log('✅ Buyer columns migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

migrateBuyerColumns();
