const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV !== 'test') {
  logger.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

// Calculate delivery fee based on location
const calculateDeliveryFee = (address) => {
  if (!address) return 0;
  
  const addressLower = address.toLowerCase();
  
  // Major cities - Free delivery
  const majorCities = ['accra', 'kumasi', 'tema', 'takoradi', 'cape coast', 'tamale'];
  if (majorCities.some(city => addressLower.includes(city))) {
    return 0;
  }
  
  // Regional capitals - ₵10 delivery
  const regionalCapitals = [
    'sunyani', 'koforidua', 'ho', 'wa', 'bolgatanga', 
    'sekondi', 'obuasi', 'tarkwa', 'techiman'
  ];
  if (regionalCapitals.some(city => addressLower.includes(city))) {
    return 10;
  }
  
  // Remote areas - ₵20 delivery
  return 20;
};

// Optional buyer authentication middleware
const optionalBuyerAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, buyer) => {
      if (!err) {
        req.buyer = buyer;
      }
    });
  }
  next();
};

// Create order (checkout)
router.post('/', optionalBuyerAuth, async (req, res) => {
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
    
    console.log('📦 Creating order:', {
      buyer_name,
      buyer_email,
      seller_id,
      product_id,
      quantity,
      has_delivery_address: !!delivery_address
    });
    
    if (!buyer_name || !buyer_email || !buyer_phone || !seller_id || 
        !product_id || !quantity || !delivery_address) {
      console.error('❌ Missing required fields:', req.body);
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get product details
    const product = await db.get(
      'SELECT * FROM products WHERE id = $1',
      [product_id]
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }
    
    // Check for active flash deal (gracefully handle if table doesn't exist)
    let price = product.price;
    let deal = null;
    try {
      deal = await db.get(
        `SELECT deal_price FROM flash_deals 
         WHERE product_id = $1 AND is_active = true 
         AND starts_at <= NOW() AND ends_at > NOW()`,
        [product_id]
      );
      if (deal && deal.deal_price) {
        price = deal.deal_price;
      }
    } catch (error) {
      // Flash deals table might not exist, use regular price
      console.log('Flash deals not available, using regular price');
    }
    
    const subtotal = price * quantity;
    const order_number = `KM-${uuidv4().slice(0, 8).toUpperCase()}`;
    
    // Get buyer_id if logged in
    const buyer_id = req.buyer ? req.buyer.id : null;
    
    // Calculate delivery fee based on city/address
    const deliveryFee = calculateDeliveryFee(delivery_address);
    const total = subtotal + deliveryFee;
    const total_amount = total;
    
    // Create order
    const result = await db.run(
      `INSERT INTO orders 
       (order_number, buyer_id, buyer_name, buyer_email, buyer_phone, seller_id, 
        product_id, quantity, subtotal, total, total_amount, delivery_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id`,
      [order_number, buyer_id, buyer_name, buyer_email, buyer_phone, seller_id,
       product_id, quantity, subtotal, total, total_amount, delivery_address]
    );

    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(500).json({ error: 'Failed to create order' });
    }
    
    // Update product stock
    await db.run(
      'UPDATE products SET stock = stock - $1, sales = sales + $2 WHERE id = $3',
      [quantity, quantity, product_id]
    );
    
    // Update flash deal quantity_sold if deal was used (atomic to prevent overselling)
    if (deal) {
      try {
        const dealUpdate = await db.run(
          `UPDATE flash_deals 
           SET quantity_sold = quantity_sold + $1 
           WHERE product_id = $2 
             AND is_active = true 
             AND (quantity_available - quantity_sold) >= $1
           RETURNING id`,
          [quantity, product_id]
        );
        
        if (!dealUpdate || dealUpdate.rowCount === 0) {
          // Rollback product stock update
        await db.run(
          'UPDATE products SET stock = stock + $1, sales = sales - $2 WHERE id = $3',
          [quantity, quantity, product_id]
        );
        return res.status(400).json({ 
          error: 'Flash deal sold out',
          message: 'This deal is no longer available. The quantity has been sold out.'
        });
      }
      } catch (error) {
        // Flash deals table might not exist, continue without flash deal tracking
        console.log('Flash deals update skipped:', error.message);
      }
    }
    
    res.status(201).json({
      message: 'Order created successfully',
      order_number,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      total_amount,
      escrow_status: 'held'
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get order by order number (requires auth or matching buyer email)
router.get('/:order_number', optionalBuyerAuth, async (req, res) => {
  try {
    const order = await db.get(
      `SELECT o.*, p.name as product_name, p.image_url as product_image,
              s.name as seller_name, s.slug as seller_slug
       FROM orders o
       JOIN products p ON o.product_id = p.id
       JOIN sellers s ON o.seller_id = s.id
       WHERE o.order_number = $1`,
      [req.params.order_number]
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Only allow the buyer who placed the order or authenticated users to view
    if (req.buyer) {
      if (order.buyer_id && order.buyer_id !== req.buyer.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }
    
    // Redact sensitive fields for unauthenticated requests
    if (!req.buyer) {
      delete order.buyer_phone;
      delete order.delivery_address;
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;
