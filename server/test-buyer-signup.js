/**
 * Test script to verify buyer signup works correctly
 * This tests that the buyer_email column exists in the orders table
 */

const db = require('./models/database');
const bcrypt = require('bcryptjs');

async function testBuyerSignup() {
  try {
    console.log('🧪 Testing Buyer Signup Fix...\n');

    // Step 1: Initialize database (ensure tables exist with all columns)
    console.log('📦 Step 1: Initializing database...');
    const initDb = require('./scripts/initDb');
    await initDb();
    console.log('✅ Database initialized\n');

    // Step 2: Verify that orders table has buyer_email column
    console.log('🔍 Step 2: Checking if buyer_email column exists in orders table...');
    const columnCheck = await db.all(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'buyer_email'
    `);
    
    if (columnCheck && columnCheck.length > 0) {
      console.log('✅ buyer_email column exists in orders table');
      console.log(`   Type: ${columnCheck[0].data_type}\n`);
    } else {
      console.log('❌ buyer_email column NOT found in orders table\n');
      process.exit(1);
    }

    // Step 3: Create a test guest order (simulating checkout without account)
    console.log('📝 Step 3: Creating test guest order...');
    const testEmail = `test-${Date.now()}@example.com`;
    
    // First, get a test seller and product
    const seller = await db.get('SELECT id FROM sellers LIMIT 1');
    const product = await db.get('SELECT id, price FROM products LIMIT 1');
    
    if (!seller || !product) {
      console.log('⚠️  No test data found. Creating basic test data...');
      // Create minimal test data
      await db.run(`
        INSERT INTO sellers (shop_name, is_verified) 
        VALUES ('Test Shop', TRUE) 
        ON CONFLICT DO NOTHING
      `);
      await db.run(`
        INSERT INTO products (seller_id, name, price, stock) 
        SELECT id, 'Test Product', 10.00, 100 
        FROM sellers WHERE shop_name = 'Test Shop' LIMIT 1
        ON CONFLICT DO NOTHING
      `);
      const newSeller = await db.get('SELECT id FROM sellers LIMIT 1');
      const newProduct = await db.get('SELECT id, price FROM products LIMIT 1');
      
      if (!newSeller || !newProduct) {
        console.log('❌ Failed to create test data\n');
        process.exit(1);
      }
    }

    const orderData = await db.run(`
      INSERT INTO orders (
        order_number, buyer_name, buyer_email, buyer_phone, 
        seller_id, product_id, quantity, total_amount,
        delivery_address, subtotal, total, status
      ) VALUES (
        'TEST-' || (random() * 100000)::int,
        'Test Guest',
        $1,
        '1234567890',
        (SELECT id FROM sellers LIMIT 1),
        (SELECT id FROM products LIMIT 1),
        1,
        10.00,
        'Test Address',
        10.00,
        10.00,
        'pending'
      )
      RETURNING id, order_number
    `, [testEmail]);
    
    const orderId = orderData.rows[0].id;
    const orderNumber = orderData.rows[0].order_number;
    console.log(`✅ Guest order created: ${orderNumber}\n`);

    // Step 4: Create buyer account (simulating signup)
    console.log('👤 Step 4: Creating buyer account with same email...');
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    const buyerData = await db.run(`
      INSERT INTO buyers (name, email, password, phone, is_active)
      VALUES ($1, $2, $3, $4, TRUE)
      RETURNING id
    `, ['Test Buyer', testEmail, hashedPassword, '1234567890']);
    
    const buyerId = buyerData.rows[0].id;
    console.log(`✅ Buyer account created (ID: ${buyerId})\n`);

    // Step 5: Link guest orders to buyer account (this is where the error occurred)
    console.log('🔗 Step 5: Linking guest orders to buyer account...');
    console.log('   Running: UPDATE orders SET buyer_id = $1 WHERE buyer_email = $2 AND buyer_id IS NULL');
    
    const updateResult = await db.run(
      'UPDATE orders SET buyer_id = $1 WHERE buyer_email = $2 AND buyer_id IS NULL',
      [buyerId, testEmail]
    );
    
    console.log(`✅ Linked ${updateResult.rowCount} order(s) to buyer account\n`);

    // Step 6: Verify the link was successful
    console.log('🔍 Step 6: Verifying order was linked to buyer...');
    const linkedOrder = await db.get(
      'SELECT id, order_number, buyer_id, buyer_email FROM orders WHERE id = $1',
      [orderId]
    );
    
    if (linkedOrder && linkedOrder.buyer_id === buyerId) {
      console.log('✅ Order successfully linked to buyer account');
      console.log(`   Order: ${linkedOrder.order_number}`);
      console.log(`   Buyer ID: ${linkedOrder.buyer_id}`);
      console.log(`   Buyer Email: ${linkedOrder.buyer_email}\n`);
    } else {
      console.log('❌ Order was NOT linked to buyer account\n');
      process.exit(1);
    }

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await db.run('DELETE FROM orders WHERE id = $1', [orderId]);
    await db.run('DELETE FROM buyers WHERE id = $1', [buyerId]);
    console.log('✅ Test data cleaned up\n');

    console.log('✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅');
    console.log('\nThe buyer signup fix is working correctly!');
    console.log('The buyer_email column exists and orders can be linked to buyer accounts.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

// Run the test
testBuyerSignup();
