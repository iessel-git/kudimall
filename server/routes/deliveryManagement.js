const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../models/database');
const { authenticateDeliveryToken } = require('./deliveryAuth');

const deliveryProofDir = path.join(__dirname, '..', 'uploads', 'delivery-proofs');
if (!fs.existsSync(deliveryProofDir)) {
  fs.mkdirSync(deliveryProofDir, { recursive: true });
}

const deliveryProofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, deliveryProofDir);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${req.params.orderNumber}-${Date.now()}${extension}`);
  }
});

const deliveryProofUpload = multer({
  storage: deliveryProofStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }
    cb(null, true);
  }
});

// GET /api/delivery/orders - Get assigned delivery orders
router.get('/orders', authenticateDeliveryToken, async (req, res) => {
  try {
    const { status } = req.query;

    let query = `
      SELECT o.*, p.name as product_name, p.image_url as product_image,
             s.name as seller_name, s.phone as seller_phone
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN sellers s ON o.seller_id = s.id
      WHERE o.delivery_person_id = $1
    `;
    const params = [req.deliveryUser.id];

    if (status) {
      query += ' AND o.status = $2';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const orders = await db.all(query, params);

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching delivery orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/delivery/available-orders - Get available orders that can be claimed
router.get('/available-orders', authenticateDeliveryToken, async (req, res) => {
  try {
    const query = `
      SELECT o.*, p.name as product_name, p.image_url as product_image,
             s.name as seller_name, s.phone as seller_phone
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN sellers s ON o.seller_id = s.id
      WHERE o.status = 'shipped' AND o.delivery_person_id IS NULL
      ORDER BY o.created_at DESC
      LIMIT 50
    `;

    const orders = await db.all(query);

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching available orders:', error);
    res.status(500).json({ error: 'Failed to fetch available orders' });
  }
});

// POST /api/delivery/orders/:orderNumber/claim - Claim an order for delivery
router.post('/orders/:orderNumber/claim', authenticateDeliveryToken, async (req, res) => {
  try {
    const order = await db.get(
      'SELECT * FROM orders WHERE order_number = $1',
      [req.params.orderNumber]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.delivery_person_id && order.delivery_person_id !== req.deliveryUser.id) {
      return res.status(403).json({ error: 'Order already assigned to another delivery account' });
    }

    if (order.status !== 'shipped' && order.status !== 'processing') {
      return res.status(400).json({ error: 'Order is not ready for delivery' });
    }

    if (!order.delivery_person_id) {
      await db.run(
        'UPDATE orders SET delivery_person_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [req.deliveryUser.id, order.id]
      );
    }

    const updatedOrder = await db.get(
      'SELECT * FROM orders WHERE id = $1',
      [order.id]
    );

    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error claiming order:', error);
    res.status(500).json({ error: 'Failed to claim order' });
  }
});

// POST /api/delivery/orders/:orderNumber/delivery-proof/photo - Upload delivery photo
router.post('/orders/:orderNumber/delivery-proof/photo', authenticateDeliveryToken, deliveryProofUpload.single('photo'), async (req, res) => {
  try {
    const order = await db.get(
      'SELECT * FROM orders WHERE order_number = $1',
      [req.params.orderNumber]
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.delivery_person_id && order.delivery_person_id !== req.deliveryUser.id) {
      return res.status(403).json({ error: 'Order already assigned to another delivery account' });
    }

    if (order.status !== 'shipped' && order.status !== 'delivered' && order.status !== 'completed') {
      return res.status(400).json({ error: 'Order is not ready for delivery proof' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Delivery photo is required' });
    }

    const proofUrl = `/uploads/delivery-proofs/${req.file.filename}`;
    const proofType = order.delivery_signature_data ? 'photo+signature' : 'photo';

    await db.run(
      `UPDATE orders
       SET delivery_person_id = COALESCE(delivery_person_id, $1),
           delivery_proof_url = $2,
           delivery_photo_uploaded_by = 'delivery',
           delivery_proof_type = $3,
           status = CASE WHEN status = 'completed' THEN status ELSE 'delivered' END,
           delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [req.deliveryUser.id, proofUrl, proofType, order.id]
    );

    const updatedOrder = await db.get('SELECT * FROM orders WHERE id = $1', [order.id]);

    res.json({
      success: true,
      message: 'Delivery proof uploaded successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error uploading delivery proof:', error);
    res.status(500).json({ error: 'Failed to upload delivery proof' });
  }
});

module.exports = router;
