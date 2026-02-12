const express = require('express');
const router = express.Router();
const db = require('../models/database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kudimall_buyer_secret_key_2024';

// Optional authentication middleware
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// Required authentication middleware
const requireAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ============================================================================
// WISHLIST ROUTES
// ============================================================================

// Get user's wishlist
router.get('/', requireAuth, async (req, res) => {
  try {
    const wishlist = await db.all(
      `SELECT w.id, w.created_at as added_at,
              p.id as product_id, p.name, p.slug, p.price, p.image_url, 
              p.stock, p.is_available, p.avg_rating, p.review_count,
              s.name as seller_name, s.slug as seller_slug, s.is_verified,
              fd.deal_price, fd.discount_percentage, fd.ends_at as deal_ends_at
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       JOIN sellers s ON p.seller_id = s.id
       LEFT JOIN flash_deals fd ON fd.product_id = p.id 
         AND fd.is_active = true 
         AND fd.starts_at <= NOW() 
         AND fd.ends_at > NOW()
       WHERE w.buyer_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );

    res.json({ wishlist, count: wishlist.length });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add item to wishlist
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const product = await db.get('SELECT id FROM products WHERE id = $1', [product_id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if already in wishlist
    const existing = await db.get(
      'SELECT id FROM wishlists WHERE buyer_id = $1 AND product_id = $2',
      [req.user.id, product_id]
    );

    if (existing) {
      return res.status(400).json({ error: 'Product already in wishlist' });
    }

    await db.run(
      'INSERT INTO wishlists (buyer_id, product_id) VALUES ($1, $2)',
      [req.user.id, product_id]
    );

    res.status(201).json({ message: 'Added to wishlist' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove item from wishlist
router.delete('/remove/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await db.run(
      'DELETE FROM wishlists WHERE buyer_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Item not found in wishlist' });
    }

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if product is in wishlist
router.get('/check/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    const item = await db.get(
      'SELECT id FROM wishlists WHERE buyer_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );

    res.json({ inWishlist: !!item });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ error: error.message });
  }
});

// Move wishlist item to cart
router.post('/move-to-cart/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    // Get or create cart
    let cart = await db.get(
      'SELECT id FROM carts WHERE user_id = $1',
      [req.user.id]
    );

    if (!cart) {
      const result = await db.run(
        'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
        [req.user.id]
      );
      cart = { id: result.rows[0].id };
    }

    // Get product info
    const product = await db.get(
      'SELECT id, price FROM products WHERE id = $1',
      [productId]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Add to cart
    await db.run(
      `INSERT INTO cart_items (cart_id, product_id, quantity, price)
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (cart_id, product_id) 
       DO UPDATE SET quantity = cart_items.quantity + 1, updated_at = NOW()`,
      [cart.id, productId, product.price]
    );

    // Remove from wishlist
    await db.run(
      'DELETE FROM wishlists WHERE buyer_id = $1 AND product_id = $2',
      [req.user.id, productId]
    );

    res.json({ message: 'Moved to cart' });
  } catch (error) {
    console.error('Error moving to cart:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
