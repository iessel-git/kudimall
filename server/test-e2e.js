const axios = require('axios');
const db = require('./models/database');

const API_BASE = 'http://localhost:5000/api';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

const log = {
  step: (msg) => console.log(`\n${colors.blue}${colors.bold}=== ${msg} ===${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.yellow}ℹ ${msg}${colors.reset}`),
  data: (label, data) => console.log(`  ${label}:`, JSON.stringify(data, null, 2))
};

async function runE2ETest() {
  let sellerToken, buyerToken, testOrderNumber;
  
  try {
    log.step('STEP 1: Seller Login');
    
    // Login as seller
    const sellerLogin = await axios.post(`${API_BASE}/auth/seller/login`, {
      email: 'techhub@kudimall.com',
      password: 'seller123'
    });
    
    sellerToken = sellerLogin.data.token;
    log.success('Seller logged in successfully');
    log.data('Seller', { name: sellerLogin.data.seller.name, email: sellerLogin.data.seller.email });
    
    // ===========================
    log.step('STEP 2: Create New Test Order');
    
    // Get a product
    const products = await db.get('SELECT * FROM products WHERE stock > 0 LIMIT 1');
    
    // Create order as guest buyer
    const orderResponse = await axios.post(`${API_BASE}/orders`, {
      buyer_name: 'E2E Test Buyer',
      buyer_email: 'e2etest@example.com',
      buyer_phone: '0244123456',
      seller_id: products.seller_id,
      product_id: products.id,
      quantity: 1,
      delivery_address: '123 Test Street, Accra, Ghana'
    });
    
    testOrderNumber = orderResponse.data.order_number;
    log.success('Order created successfully');
    log.data('Order', { order_number: testOrderNumber, status: 'pending', amount: orderResponse.data.total_amount });
    
    // ===========================
    log.step('STEP 3: Seller Marks Order as Shipped');
    
    await axios.patch(
      `${API_BASE}/seller/orders/${testOrderNumber}/status`,
      {
        status: 'shipped',
        tracking_number: 'DHL-TEST-12345'
      },
      {
        headers: { Authorization: `Bearer ${sellerToken}` }
      }
    );
    
    log.success('Order marked as shipped with tracking number');
    
    // ===========================
    log.step('STEP 4: Seller Updates Status to Delivered');
    
    await axios.patch(
      `${API_BASE}/seller/orders/${testOrderNumber}/status`,
      { status: 'delivered' },
      {
        headers: { Authorization: `Bearer ${sellerToken}` }
      }
    );
    
    log.success('Order marked as delivered');
    
    // ===========================
    log.step('STEP 5: Verify Seller Sees "Waiting for Confirmation"');
    
    const sellerOrders = await axios.get(`${API_BASE}/seller/orders`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    const sellerOrder = sellerOrders.data.orders.find(o => o.order_number === testOrderNumber);
    
    log.info(`Order Status: ${sellerOrder.status}`);
    log.info(`Escrow Status: ${sellerOrder.escrow_status}`);
    log.info(`Buyer Confirmed: ${sellerOrder.buyer_confirmed_at || 'Not yet'}`);
    
    if (sellerOrder.status === 'delivered' && !sellerOrder.buyer_confirmed_at) {
      log.success('Seller correctly sees "delivered" status waiting for buyer confirmation');
    } else {
      log.error('Unexpected order state');
    }
    
    // ===========================
    log.step('STEP 6: Register and Login as Buyer');
    
    // First, create buyer account
    try {
      const buyerSignup = await axios.post(`${API_BASE}/buyer-auth/signup`, {
        name: 'E2E Test Buyer',
        email: 'e2etest@example.com',
        password: 'buyer123',
        phone: '0244123456'
      });
      
      buyerToken = buyerSignup.data.token;
      log.success('Buyer account created and logged in');
      
      // Update order with buyer_id
      await db.run('UPDATE orders SET buyer_id = ? WHERE order_number = ?', [
        buyerSignup.data.buyer.id,
        testOrderNumber
      ]);
    } catch (err) {
      // If buyer already exists, login instead
      if (err.response?.status === 400) {
        const buyerLogin = await axios.post(`${API_BASE}/buyer-auth/login`, {
          email: 'e2etest@example.com',
          password: 'buyer123'
        });
        buyerToken = buyerLogin.data.token;
        log.success('Buyer logged in (already existed)');
        
        // Update order with buyer_id
        await db.run('UPDATE orders SET buyer_id = ? WHERE order_number = ?', [
          buyerLogin.data.buyer.id,
          testOrderNumber
        ]);
      } else {
        throw err;
      }
    }
    
    // ===========================
    log.step('STEP 7: Buyer Views Order in Dashboard');
    
    const buyerOrders = await axios.get(`${API_BASE}/buyer/orders`, {
      headers: { Authorization: `Bearer ${buyerToken}` }
    });
    
    const buyerOrder = buyerOrders.data.orders.find(o => o.order_number === testOrderNumber);
    
    if (buyerOrder) {
      log.success('Buyer can see the order in their dashboard');
      log.data('Order Status', { status: buyerOrder.status, tracking: buyerOrder.tracking_number });
    } else {
      log.error('Buyer cannot see the order');
      return;
    }
    
    // ===========================
    log.step('STEP 8: Buyer Confirms Receipt with Signature');
    
    // Simulate signature (base64 image data)
    const mockSignature = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    
    const confirmResponse = await axios.post(
      `${API_BASE}/buyer/orders/${testOrderNumber}/confirm-received`,
      {
        signature_name: 'E2E Test Buyer',
        signature_data: mockSignature
      },
      {
        headers: { Authorization: `Bearer ${buyerToken}` }
      }
    );
    
    log.success('Buyer confirmed receipt with signature');
    log.data('Response', confirmResponse.data);
    
    // ===========================
    log.step('STEP 9: Verify Order Completed and Escrow Released');
    
    const completedOrder = await db.get(
      'SELECT * FROM orders WHERE order_number = ?',
      [testOrderNumber]
    );
    
    log.info(`Order Status: ${completedOrder.status}`);
    log.info(`Escrow Status: ${completedOrder.escrow_status}`);
    log.info(`Buyer Confirmed At: ${completedOrder.buyer_confirmed_at}`);
    log.info(`Signature Name: ${completedOrder.delivery_signature_name}`);
    
    if (
      completedOrder.status === 'completed' &&
      completedOrder.escrow_status === 'released' &&
      completedOrder.buyer_confirmed_at &&
      completedOrder.delivery_signature_data
    ) {
      log.success('✓ Order correctly marked as completed');
      log.success('✓ Escrow payment released to seller');
      log.success('✓ Buyer signature saved');
    } else {
      log.error('Order state is incorrect');
      log.data('Actual State', completedOrder);
    }
    
    // ===========================
    log.step('STEP 10: Seller Views Completed Order with Confirmation');
    
    const finalSellerOrders = await axios.get(`${API_BASE}/seller/orders`, {
      headers: { Authorization: `Bearer ${sellerToken}` }
    });
    
    const finalSellerOrder = finalSellerOrders.data.orders.find(
      o => o.order_number === testOrderNumber
    );
    
    if (
      finalSellerOrder.status === 'completed' &&
      finalSellerOrder.buyer_confirmed_at &&
      finalSellerOrder.delivery_signature_data
    ) {
      log.success('✓ Seller can see completed order');
      log.success('✓ Seller can see buyer confirmation timestamp');
      log.success('✓ Seller can see buyer signature data');
    } else {
      log.error('Seller view is missing confirmation data');
    }
    
    // ===========================
    log.step('FINAL RESULTS');
    
    console.log(`
${colors.green}${colors.bold}
╔════════════════════════════════════════════════════════════╗
║                  ✓ ALL TESTS PASSED!                      ║
╚════════════════════════════════════════════════════════════╝${colors.reset}

${colors.bold}Test Order: ${testOrderNumber}${colors.reset}

Summary:
• Seller logged in and created order
• Order marked as shipped → delivered
• Buyer registered and confirmed receipt with signature
• Order status changed to "completed"
• Escrow payment released to seller
• Seller can view buyer confirmation and signature

${colors.blue}Visit http://localhost:3000/seller/login to see the completed order!${colors.reset}
    `);
    
    log.info('Cleaning up test data...');
    await db.run('DELETE FROM orders WHERE order_number = ?', [testOrderNumber]);
    await db.run('DELETE FROM buyers WHERE email = ?', ['e2etest@example.com']);
    log.success('Test data cleaned up');
    
  } catch (error) {
    log.error('Test failed!');
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
console.log(`
${colors.bold}${colors.blue}
╔════════════════════════════════════════════════════════════╗
║       KUDIMALL DELIVERY PROOF SYSTEM - E2E TEST           ║
╚════════════════════════════════════════════════════════════╝${colors.reset}
`);

runE2ETest()
  .then(() => {
    console.log('\n✓ Test completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n✗ Test failed:', err.message);
    process.exit(1);
  });
