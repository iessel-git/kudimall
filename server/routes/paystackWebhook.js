const express = require('express');
const router = express.Router();
const paystackService = require('../services/paystackService');
const db = require('../models/database');

/**
 * Handle Paystack webhooks
 * POST /api/webhooks/paystack
 */
router.post('/', express.json(), async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    
    // Verify webhook signature
    if (!paystackService.verifyWebhookSignature(req.body, signature)) {
      console.warn('⚠️  Invalid webhook signature received');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;

    console.log('📨 Webhook received:', event, '- Reference:', data.reference);

    switch (event) {
      case 'charge.success':
        await handleChargeSuccess(data);
        break;
      
      case 'charge.failed':
        await handleChargeFailed(data);
        break;
      
      case 'transfer.success':
        console.log('✅ Transfer completed successfully:', data.reference);
        break;
      
      case 'transfer.failed':
        console.error('❌ Transfer failed:', data.reference);
        break;
      
      default:
        console.log('ℹ️  Unhandled webhook event:', event);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Handle successful charge/payment
 */
async function handleChargeSuccess(data) {
  const { reference, amount, customer, metadata } = data;
  const orderNumber = metadata?.order_number;

  if (!orderNumber) {
    console.error('❌ No order number in webhook data, reference:', reference);
    return;
  }

  try {
    // Check if order exists and hasn't been processed yet
    const order = await db.get(
      'SELECT * FROM orders WHERE payment_reference = $1',
      [reference]
    );

    if (!order) {
      console.warn('⚠️  Order not found for payment reference:', reference);
      return;
    }

    if (order.payment_status === 'paid') {
      console.log('ℹ️  Order already marked as paid:', orderNumber);
      return;
    }

    // Update order payment status - FUNDS ARE NOW IN ESCROW
    await db.run(
      `UPDATE orders 
       SET payment_status = 'paid',
           order_status = 'confirmed',
           payment_verified_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE payment_reference = $1`,
      [reference]
    );

    console.log('✅ Order payment confirmed via webhook:', { 
      order_number: orderNumber,
      reference,
      amount: amount / 100,
      status: 'FUNDS IN ESCROW - Held until delivery confirmation'
    });

    // TODO: Send email confirmation to buyer
    // TODO: Notify seller of new paid order

  } catch (error) {
    console.error('❌ Failed to process successful charge:', error.message);
  }
}

/**
 * Handle failed charge/payment
 */
async function handleChargeFailed(data) {
  const { reference, metadata } = data;
  const orderNumber = metadata?.order_number;

  if (!orderNumber) {
    console.error('❌ No order number in failed charge webhook, reference:', reference);
    return;
  }

  try {
    await db.run(
      `UPDATE orders 
       SET payment_status = 'failed',
           updated_at = CURRENT_TIMESTAMP
       WHERE payment_reference = $1`,
      [reference]
    );

    console.log('⚠️  Order payment marked as failed via webhook:', { order_number: orderNumber, reference });

    // TODO: Send email notification to buyer about failed payment

  } catch (error) {
    console.error('❌ Failed to process failed charge:', error.message);
  }
}

module.exports = router;
