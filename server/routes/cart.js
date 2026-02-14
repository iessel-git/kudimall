const express = require('express');
const router = express.Router();
const db = require('../models/database');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET && process.env.NODE_ENV !== 'test') {
  logger.error('FATAL: JWT_SECRET environment variable is not set');
  process.exit(1);
}

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
      return res.status(401).json({ error: 'Invalid token' });
    }
    // Check if user is buyer
    if (user.type && user.type !== 'buyer') {
      return res.status(403).json({ error: 'Access denied. Buyers only.' });
    }
    req.user = user;
    next();
  });
};

// ============================================================================
// CART ROUTES
// ============================================================================

// Get user's cart
router.get('/', requireAuth, async (req, res) => {
  try {
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

    const items = await db.all(
      `SELECT ci.id, ci.quantity, ci.price as unit_price, ci.saved_for_later,
              p.price as current_product_price,
              COALESCE(fd.deal_price, ci.price) as effective_price,
              (ci.quantity * COALESCE(fd.deal_price, ci.price)) as subtotal,
              p.id as product_id, p.name, p.slug, p.image_url, p.stock, p.is_available,
              s.name as seller_name, s.slug as seller_slug, s.id as seller_id,
              fd.deal_price, fd.discount_percentage, fd.ends_at as deal_ends_at
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN sellers s ON p.seller_id = s.id
       LEFT JOIN flash_deals fd ON fd.product_id = p.id 
         AND fd.is_active = true 
         AND fd.starts_at <= NOW() 
         AND fd.ends_at > NOW()
       WHERE ci.cart_id = $1 AND ci.saved_for_later = false
       ORDER BY ci.created_at DESC`,
      [cart.id]
    );

    const savedItems = await db.all(
      `SELECT ci.id, ci.quantity, ci.price as unit_price,
              p.price as current_product_price,
              COALESCE(fd.deal_price, ci.price) as effective_price,
              (ci.quantity * COALESCE(fd.deal_price, ci.price)) as subtotal,
              p.id as product_id, p.name, p.slug, p.image_url, p.stock, p.is_available,
              s.name as seller_name, s.slug as seller_slug, s.id as seller_id,
              fd.deal_price, fd.discount_percentage, fd.ends_at as deal_ends_at
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN sellers s ON p.seller_id = s.id
       LEFT JOIN flash_deals fd ON fd.product_id = p.id 
         AND fd.is_active = true 
         AND fd.starts_at <= NOW() 
         AND fd.ends_at > NOW()
       WHERE ci.cart_id = $1 AND ci.saved_for_later = true
       ORDER BY ci.created_at DESC`,
      [cart.id]
    );

    // Calculate totals
    const cartTotal = (items || []).reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
    const itemCount = (items || []).reduce((sum, item) => sum + item.quantity, 0);

    // Group by seller for checkout
    const sellerGroups = {};
    (items || []).forEach(item => {
      if (!sellerGroups[item.seller_id]) {
        sellerGroups[item.seller_id] = {
          seller_id: item.seller_id,
          seller_name: item.seller_name,
          seller_slug: item.seller_slug,
          items: [],
          subtotal: 0
        };
      }
      sellerGroups[item.seller_id].items.push(item);
      sellerGroups[item.seller_id].subtotal += parseFloat(item.subtotal);
    });

    res.json({
      cart_id: cart.id,
      items,
      saved_items: savedItems,
      seller_groups: Object.values(sellerGroups),
      cart_total: cartTotal,
      item_count: itemCount
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add item to cart
router.post('/', requireAuth, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    // Validate quantity first
    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than zero' });
    }
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Get product info
    const product = await db.get(
      'SELECT id, price, stock, is_available FROM products WHERE id = $1',
      [product_id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.is_available) {
      return res.status(400).json({ error: 'Product is not available' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

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

    // Check for active flash deal
    const deal = await db.get(
      `SELECT deal_price FROM flash_deals 
       WHERE product_id = $1 AND is_active = true 
       AND starts_at <= NOW() AND ends_at > NOW()`,
      [product_id]
    );

    const price = deal ? deal.deal_price : product.price;

    // Add or update cart item
    await db.run(
      `INSERT INTO cart_items (cart_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (cart_id, product_id) 
       DO UPDATE SET quantity = cart_items.quantity + $3, 
                     price = $4,
                     updated_at = NOW(),
                     saved_for_later = false`,
      [cart.id, product_id, quantity, price]
    );

    // Get updated cart count
    const countResult = await db.get(
      'SELECT SUM(quantity) as count FROM cart_items WHERE cart_id = $1 AND saved_for_later = false',
      [cart.id]
    );

    res.status(201).json({ 
      message: 'Added to cart',
      cart_count: countResult.count || 0
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add item to cart (alias endpoint for frontend compatibility)
router.post('/add', requireAuth, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    // Validate quantity first
    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than zero' });
    }
    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Get product info
    const product = await db.get(
      'SELECT id, price, stock, is_available FROM products WHERE id = $1',
      [product_id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.is_available) {
      return res.status(400).json({ error: 'Product is not available' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

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

    // Check for active flash deal
    const deal = await db.get(
      `SELECT deal_price FROM flash_deals 
       WHERE product_id = $1 AND is_active = true 
       AND starts_at <= NOW() AND ends_at > NOW()`,
      [product_id]
    );

    const price = deal ? deal.deal_price : product.price;

    // Add or update cart item
    await db.run(
      `INSERT INTO cart_items (cart_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (cart_id, product_id) 
       DO UPDATE SET quantity = cart_items.quantity + $3, 
                     price = $4,
                     updated_at = NOW(),
                     saved_for_later = false`,
      [cart.id, product_id, quantity, price]
    );

    // Get updated cart count
    const countResult = await db.get(
      'SELECT SUM(quantity) as count FROM cart_items WHERE cart_id = $1 AND saved_for_later = false',
      [cart.id]
    );

    res.status(201).json({ 
      message: 'Added to cart',
      cart_count: countResult.count || 0
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update cart item quantity
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ error: 'Quantity must be at least 1' });
    }

    // Get cart item and verify ownership
    const item = await db.get(
      `SELECT ci.*, c.user_id, p.stock 
       FROM cart_items ci 
       JOIN carts c ON ci.cart_id = c.id
       JOIN products p ON ci.product_id = p.id
       WHERE ci.id = $1`,
      [id]
    );

    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (item.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (item.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    await db.run(
      'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2',
      [quantity, id]
    );

    res.json({ message: 'Cart updated' });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear entire cart (must come before /:id route)
router.delete('/clear', requireAuth, async (req, res) => {
  try {
    const cart = await db.get(
      'SELECT id FROM carts WHERE user_id = $1',
      [req.user.id]
    );

    if (cart) {
      await db.run(
        'DELETE FROM cart_items WHERE cart_id = $1 AND saved_for_later = false',
        [cart.id]
      );
    }

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove item from cart
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const item = await db.get(
      `SELECT ci.id, c.user_id 
       FROM cart_items ci 
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = $1`,
      [id]
    );

    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (item.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.run('DELETE FROM cart_items WHERE id = $1', [id]);

    res.json({ message: 'Removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save item for later
router.post('/save-for-later/:itemId', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Verify ownership
    const item = await db.get(
      `SELECT ci.id, c.user_id 
       FROM cart_items ci 
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = $1`,
      [itemId]
    );

    if (!item || item.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await db.run(
      'UPDATE cart_items SET saved_for_later = true, updated_at = NOW() WHERE id = $1',
      [itemId]
    );

    res.json({ message: 'Saved for later' });
  } catch (error) {
    console.error('Error saving for later:', error);
    res.status(500).json({ error: error.message });
  }
});

// Move saved item back to cart
router.post('/move-to-cart/:itemId', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params;

    // Verify ownership
    const item = await db.get(
      `SELECT ci.id, c.user_id 
       FROM cart_items ci 
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = $1`,
      [itemId]
    );

    if (!item || item.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Item not found' });
    }

    await db.run(
      'UPDATE cart_items SET saved_for_later = false, updated_at = NOW() WHERE id = $1',
      [itemId]
    );

    res.json({ message: 'Moved to cart' });
  } catch (error) {
    console.error('Error moving to cart:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get cart count only
router.get('/count', optionalAuth, async (req, res) => {
  try {
    // If not authenticated, return 0
    if (!req.user || !req.user.id) {
      return res.json({ count: 0 });
    }

    const cart = await db.get(
      'SELECT id FROM carts WHERE user_id = $1',
      [req.user.id]
    );

    if (!cart) {
      return res.json({ count: 0 });
    }

    const result = await db.get(
      'SELECT COALESCE(SUM(quantity), 0) as count FROM cart_items WHERE cart_id = $1 AND saved_for_later = false',
      [cart.id]
    );

    res.json({ count: parseInt(result.count) || 0 });
  } catch (error) {
    console.error('Error getting cart count:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get cart total
router.get('/total', requireAuth, async (req, res) => {
  try {
    // Get cart
    const cart = await db.get(
      'SELECT id FROM carts WHERE user_id = $1',
      [req.user.id]
    );

    if (!cart) {
      return res.json({ total: 0, item_count: 0 });
    }

    // Calculate total from cart items
    const result = await db.get(
      `SELECT 
        COALESCE(SUM(ci.quantity * ci.price), 0) as total,
        COALESCE(SUM(ci.quantity), 0) as item_count
       FROM cart_items ci
       WHERE ci.cart_id = $1 AND ci.saved_for_later = false`,
      [cart.id]
    );

    res.json({
      total: parseFloat(result.total) || 0,
      item_count: parseInt(result.item_count) || 0
    });
  } catch (error) {
    console.error('Error getting cart total:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clear entire cart (root alias)
router.delete('/', requireAuth, async (req, res) => {
  try {
    const cart = await db.get(
      'SELECT id FROM carts WHERE user_id = $1',
      [req.user.id]
    );

    if (cart) {
      await db.run(
        'DELETE FROM cart_items WHERE cart_id = $1 AND saved_for_later = false',
        [cart.id]
      );
    }

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
