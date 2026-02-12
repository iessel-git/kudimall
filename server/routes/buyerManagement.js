const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateBuyerToken } = require('./buyerAuth');

// Get all orders for logged-in buyer
router.get('/orders', authenticateBuyerToken, async (req, res) => {
  try {
    const orders = await db.all(
      `SELECT 
        o.id, o.order_number, o.buyer_name, o.buyer_email, o.buyer_phone,
        o.quantity, o.total_amount, o.status, o.escrow_status, o.delivery_address,
        o.created_at, o.updated_at,
        o.tracking_number, o.shipped_at, o.delivered_at, o.buyer_confirmed_at,
        o.delivery_proof_type, o.delivery_proof_url, o.delivery_signature_name,
        o.delivery_signature_data, o.delivery_photo_uploaded_by, o.delivery_signature_uploaded_by,
        p.id as product_id, p.name as product_name, p.slug as product_slug, 
        p.image_url as product_image, p.price as product_price,
        s.id as seller_id, s.name as seller_name, s.slug as seller_slug,
        s.email as seller_email, s.phone as seller_phone, s.is_verified as seller_verified
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN sellers s ON o.seller_id = s.id
       WHERE o.buyer_id = $1
       ORDER BY o.created_at DESC`,
      [req.buyer.id]
    );

    res.json({ orders });
  } catch (error) {
    console.error('Get buyer orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order details
router.get('/orders/:orderNumber', authenticateBuyerToken, async (req, res) => {
  try {
    const order = await db.get(
      `SELECT 
        o.id, o.order_number, o.buyer_name, o.buyer_email, o.buyer_phone,
        o.quantity, o.total_amount, o.status, o.escrow_status, o.delivery_address,
        o.created_at, o.updated_at,
        o.tracking_number, o.shipped_at, o.delivered_at, o.buyer_confirmed_at,
        o.delivery_proof_type, o.delivery_proof_url, o.delivery_signature_name,
        o.delivery_signature_data, o.delivery_photo_uploaded_by, o.delivery_signature_uploaded_by,
        p.id as product_id, p.name as product_name, p.slug as product_slug, 
        p.image_url as product_image, p.price as product_price, p.description as product_description,
        s.id as seller_id, s.name as seller_name, s.slug as seller_slug,
        s.email as seller_email, s.phone as seller_phone, s.is_verified as seller_verified
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN sellers s ON o.seller_id = s.id
       WHERE o.order_number = $1 AND o.buyer_id = $2`,
      [req.params.orderNumber, req.buyer.id]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Confirm order received and release escrow
router.post('/orders/:orderNumber/confirm-received', authenticateBuyerToken, async (req, res) => {
  try {
    const { signature_name, signature_data } = req.body;

    const order = await db.get(
      'SELECT * FROM orders WHERE order_number = $1 AND buyer_id = $2',
      [req.params.orderNumber, req.buyer.id]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'shipped' && order.status !== 'pending' && order.status !== 'delivered') {
      return res.status(400).json({ error: 'Order cannot be confirmed at this stage' });
    }

    if (!signature_name || !signature_data) {
      return res.status(400).json({ error: 'Buyer signature is required to confirm delivery' });
    }

    const proofType = order.delivery_proof_url ? 'photo+signature' : 'signature';

    // Update order status and release escrow
    await db.run(
      `UPDATE orders 
       SET status = 'completed',
           escrow_status = 'released',
           delivery_signature_name = $1,
           delivery_signature_data = $2,
           delivery_signature_uploaded_by = 'buyer',
           delivery_proof_type = $3,
           buyer_confirmed_at = CURRENT_TIMESTAMP,
           delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [signature_name, signature_data, proofType, order.id]
    );

    res.json({ message: 'Order confirmed and payment released to seller' });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

// Report an issue with order
router.post('/orders/:orderNumber/report-issue', authenticateBuyerToken, async (req, res) => {
  try {
    const { issue_description } = req.body;

    const order = await db.get(
      'SELECT * FROM orders WHERE order_number = $1 AND buyer_id = $2',
      [req.params.orderNumber, req.buyer.id]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status to disputed
    await db.run(
      `UPDATE orders 
       SET status = 'disputed', escrow_status = 'held', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [order.id]
    );

    // In a real system, you'd create a disputes table and notify admins
    // For now, we'll just update the status

    res.json({ message: 'Issue reported. Our team will review and contact you.' });
  } catch (error) {
    console.error('Report issue error:', error);
    res.status(500).json({ error: 'Failed to report issue' });
  }
});

// Get order statistics
router.get('/statistics', authenticateBuyerToken, async (req, res) => {
  try {
    const stats = await db.get(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_spent,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN status = 'disputed' THEN 1 END) as disputed_orders
       FROM orders WHERE buyer_id = $1`,
      [req.buyer.id]
    );

    res.json({ stats: stats || {} });
  } catch (error) {
    console.error('Get buyer statistics error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
