const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Add your MySQL password if needed
    database: 'kudimall',
    multipleStatements: true
  });

  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'phase1_cart_coupons_escrow.sql'),
      'utf8'
    );
    
    console.log('🔄 Running migration...');
    await connection.query(sql);
    console.log('✅ Migration completed successfully!');
    console.log('✅ Created: carts, cart_items, coupons, coupon_usage, inventory_alerts, payment_webhooks');
    console.log('✅ Updated: orders table with escrow fields');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await connection.end();
  }
}

runMigration();