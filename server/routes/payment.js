const express = require('express');
const router = express.Router();
const paystackService = require('../services/paystackService');
const db = require('../models/database');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV !== 'test') {
  logger.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

// Authentication middleware for buyers
const authenticateBuyer = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    if (user.type !== 'buyer') {
      return res.status(403).json({ error: 'Buyer access only' });
    }
    
    req.user = user;
    next();
  });
};

/**
 * Initialize payment for an order
 * POST /api/payment/initialize
 */
router.post('/initialize', authenticateBuyer, async (req, res) => {
  try {
    const { order_number, email } = req.body;
    const buyerId = req.user.userId;

    if (!order_number) {
      return res.status(400).json({ error: 'Order number is required' });
    }

    // Get order details
    const order = await db.get(
      `SELECT o.*, b.email as buyer_email, b.name as buyer_name
       FROM orders o
       LEFT JOIN buyers b ON o.buyer_id = b.id
       WHERE o.order_number = $1`,
      [order_number]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify order belongs to buyer (if buyer is logged in)
    if (order.buyer_id && order.buyer_id !== buyerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if order is already paid
    if (order.payment_status === 'paid' || order.payment_status === 'escrow') {
      return res.status(400).json({ 
        error: 'Order has already been paid',
        payment_status: order.payment_status 
      });
    }

    // Generate payment reference
    const reference = paystackService.generateReference(order_number);

    // Get buyer email (use provided email or order email)
    const buyerEmail = email || order.buyer_email || '';
    
    if (!buyerEmail) {
      return res.status(400).json({ error: 'Email address is required for payment' });
    }

    // Initialize payment with Paystack
    const paymentResult = await paystackService.initializePayment({
      email: buyerEmail,
      amount: order.total_amount || order.total,
      reference,
      metadata: {
        order_number,
        buyer_id: buyerId,
        buyer_name: order.buyer_name || 'Guest',
        buyer_email: buyerEmail
      },
      callback_url: `${process.env.PAYSTACK_CALLBACK_URL}?reference=${reference}`
    });

    if (!paymentResult.success) {
      console.error('Payment initialization failed:', paymentResult.error);
      return res.status(500).json({ 
        error: 'Failed to initialize payment',
        details: paymentResult.error 
      });
    }

    // Save payment reference to order
    await db.run(
      `UPDATE orders 
       SET payment_reference = $1, 
           payment_method = 'paystack',
           updated_at = CURRENT_TIMESTAMP
       WHERE order_number = $2`,
      [reference, order_number]
    );

    console.log('✅ Payment initialized:', { order_number, reference, amount: order.total_amount || order.total });

    res.json({
      success: true,
      authorization_url: paymentResult.data.authorization_url,
      access_code: paymentResult.data.access_code,
      reference: paymentResult.data.reference,
      amount: order.total_amount || order.total
    });

  } catch (error) {
    console.error('❌ Payment initialization error:', error.message);
    res.status(500).json({ 
      error: 'Failed to initialize payment',
      details: error.message 
    });
  }
});

/**
 * Verify payment
 * GET /api/payment/verify/:reference
 */
router.get('/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    // Verify payment with Paystack
    const verificationResult = await paystackService.verifyPayment(reference);

    if (!verificationResult.success) {
      console.error('Payment verification failed:', verificationResult.error);
      return res.status(400).json({ 
        success: false,
        error: 'Payment verification failed',
        details: verificationResult.error 
      });
    }

    const paymentData = verificationResult.data;

    // Check payment status
    if (paymentData.status !== 'success') {
      return res.json({
        success: false,
        status: paymentData.status,
        message: 'Payment was not successful'
      });
    }

    // Get order by payment reference
    const order = await db.get(
      'SELECT * FROM orders WHERE payment_reference = $1',
      [reference]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found for this payment reference' });
    }

    // Update order payment status - SET TO ESCROW (funds held until delivery confirmed)
    await db.run(
      `UPDATE orders 
       SET payment_status = 'paid',
           order_status = 'confirmed',
           payment_verified_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE order_number = $1`,
      [order.order_number]
    );

    console.log('✅ Payment verified and order updated to PAID:', { 
      order_number: order.order_number,
      reference,
      amount: paymentData.amount / 100
    });

    res.json({
      success: true,
      status: 'success',
      order_number: order.order_number,
      amount: paymentData.amount / 100,
      message: 'Payment successful! Funds are held in escrow until delivery confirmation.'
    });

  } catch (error) {
    console.error('❌ Payment verification error:', error.message);
    res.status(500).json({ 
      error: 'Failed to verify payment',
      details: error.message 
    });
  }
});

/**
 * Get payment status for an order
 * GET /api/payment/status/:order_number
 */
router.get('/status/:order_number', async (req, res) => {
  try {
    const { order_number } = req.params;

    const order = await db.get(
      `SELECT order_number, payment_status, payment_method, payment_reference, 
              order_status, total_amount, payment_verified_at
       FROM orders 
       WHERE order_number = $1`,
      [order_number]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      success: true,
      payment: {
        order_number: order.order_number,
        payment_status: order.payment_status,
        payment_method: order.payment_method,
        payment_reference: order.payment_reference,
        order_status: order.order_status,
        amount: order.total_amount,
        verified_at: order.payment_verified_at
      }
    });

  } catch (error) {
    console.error('❌ Get payment status error:', error.message);
    res.status(500).json({ 
      error: 'Failed to get payment status',
      details: error.message 
    });
  }
});

module.exports = router;
