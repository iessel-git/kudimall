const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');

// Create order (checkout)
router.post('/', async (req, res) => {
  try {
    const {
      buyer_name,
      buyer_email,
      buyer_phone,
      seller_id,
      product_id,
      quantity,
      delivery_address
    } = req.body;
    
    if (!buyer_name || !buyer_email || !buyer_phone || !seller_id || 
        !product_id || !quantity || !delivery_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get product details
    const product = await db.get(
      'SELECT * FROM products WHERE id = ?',
      [product_id]
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    
    const total_amount = product.price * quantity;
    const order_number = `KM-${uuidv4().slice(0, 8).toUpperCase()}`;
    
    // Create order
    const result = await db.run(
      `INSERT INTO orders 
       (order_number, buyer_name, buyer_email, buyer_phone, seller_id, 
        product_id, quantity, total_amount, delivery_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_number, buyer_name, buyer_email, buyer_phone, seller_id,
       product_id, quantity, total_amount, delivery_address]
    );
    
    // Update product stock
    await db.run(
      'UPDATE products SET stock = stock - ?, sales = sales + ? WHERE id = ?',
      [quantity, quantity, product_id]
    );
    
    res.status(201).json({
      message: 'Order created successfully',
      order_number,
      total_amount,
      escrow_status: 'held'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order by order number
router.get('/:order_number', async (req, res) => {
  try {
    const order = await db.get(
      `SELECT o.*, p.name as product_name, p.image_url as product_image,
              s.name as seller_name, s.slug as seller_slug
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN sellers s ON o.seller_id = s.id
       WHERE o.order_number = ?`,
      [req.params.order_number]
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
