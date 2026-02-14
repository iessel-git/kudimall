const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../models/database');
const { authenticateToken } = require('./auth');

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

// Helper function to generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// GET /api/seller/products - Get seller's own products
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const products = await db.all(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = $1
      ORDER BY p.created_at DESC
    `, [req.seller.id]);

    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching seller products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/seller/products - Create new product
router.post('/products', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category_id,
      stock,
      image_url,
      images,
      is_available
    } = req.body;

    // Validate required fields
    if (!name || !price || !category_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Name, price, and category are required'
      });
    }

    // Validate category exists
      const category = await db.get('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (!category) {
      return res.status(400).json({
        error: 'Invalid category',
        message: 'Category does not exist'
      });
    }

    // Generate unique slug
    let slug = generateSlug(name);
    let slugExists = await db.get(
      'SELECT id FROM products WHERE slug = $1 AND seller_id = $2',
        [slug, req.seller.id]
    );
    let counter = 1;

    while (slugExists) {
      slug = `${generateSlug(name)}-${counter}`;
      slugExists = await db.get(
        'SELECT id FROM products WHERE slug = $1 AND seller_id = $2',
        [slug, req.seller.id]
      );
      counter++;
    }

    // Create product
    const result = await db.run(`
      INSERT INTO products (
        seller_id, category_id, name, slug, description, price, 
        stock, image_url, images, is_available, is_featured
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE)
      `, [
      req.seller.id,
      category_id,
      name,
      slug,
      description || null,
      price,
      stock || 0,
      image_url || null,
      images ? JSON.stringify(images) : null,
      is_available !== undefined ? is_available : true
    ]);

    const product = await db.get('SELECT * FROM products WHERE id = $1', [result.id]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      error: 'Failed to create product',
      message: error.message
    });
  }
});

// GET /api/seller/products/:id - Get single product
router.get('/products/:id', authenticateToken, async (req, res) => {
  try {
    const product = await db.get(`
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = $1 AND p.seller_id = $2
    `, [req.params.id, req.seller.id]);

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'Product not found or you do not have permission to access it'
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// PUT /api/seller/products/:id - Update product
router.put('/products/:id', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category_id,
      stock,
      image_url,
      images,
      is_available
    } = req.body;

    // Check if product exists and belongs to seller
    const existingProduct = await db.get(
      'SELECT * FROM products WHERE id = $1 AND seller_id = $2',
        [req.params.id, req.seller.id]
    );

    if (!existingProduct) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'Product not found or you do not have permission to edit it'
      });
    }

    // Validate category if provided
    if (category_id) {
      const category = await db.get('SELECT id FROM categories WHERE id = $1', [category_id]);
      if (!category) {
        return res.status(400).json({
          error: 'Invalid category',
          message: 'Category does not exist'
        });
      }
    }

    const updates = [];
    const params = [];

    if (name) {
      updates.push(`name = $${params.length + 1}`);
        params.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${params.length + 1}`);
        params.push(description);
    }
    if (price !== undefined) {
      updates.push(`price = $${params.length + 1}`);
        params.push(price);
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${params.length + 1}`);
        params.push(category_id);
    }
    if (stock !== undefined) {
      updates.push(`stock = $${params.length + 1}`);
        params.push(stock);
    }
    if (image_url !== undefined) {
      updates.push(`image_url = $${params.length + 1}`);
        params.push(image_url);
    }
    if (images !== undefined) {
      updates.push(`images = $${params.length + 1}`);
        params.push(JSON.stringify(images));
    }
    if (is_available !== undefined) {
      updates.push(`is_available = $${params.length + 1}`);
        params.push(is_available);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);
    params.push(req.seller.id);

    await db.run(
      `UPDATE products SET ${updates.join(', ')} WHERE id = $${params.length - 1} AND seller_id = $${params.length}`,
        params
    );

    const updatedProduct = await db.get(
      'SELECT * FROM products WHERE id = $1',
        [req.params.id]
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      error: 'Failed to update product',
      message: error.message
    });
  }
});

// DELETE /api/seller/products/:id - Delete product
router.delete('/products/:id', authenticateToken, async (req, res) => {
  try {
    // Check if product exists and belongs to seller
    const product = await db.get(
      'SELECT * FROM products WHERE id = $1 AND seller_id = $2',
      [req.params.id, req.seller.id]
    );

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'Product not found or you do not have permission to delete it'
      });
    }

    await db.run(
      'DELETE FROM products WHERE id = $1 AND seller_id = $2',
      [req.params.id, req.seller.id]
    );

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      error: 'Failed to delete product',
      message: error.message
    });
  }
});

// GET /api/seller/stats - Get seller statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN is_available = TRUE THEN 1 ELSE 0 END) as active_products,
        COALESCE(SUM(stock), 0) as total_stock
      FROM products
      WHERE seller_id = $1
    `, [req.seller.id]);

    const recentOrders = await db.all(`
      SELECT COUNT(*) as count, status
      FROM orders
      WHERE seller_id = $1
      GROUP BY status
    `, [req.seller.id]);

    res.json({
      success: true,
      stats: {
        ...stats,
        orders_by_status: recentOrders
      }
    });
  } catch (error) {
    console.error('Error fetching seller stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/seller/orders - Get seller's orders
router.get('/orders', authenticateToken, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;

    let query = `
      SELECT o.*, 
             p.name as product_name, 
             p.image_url as product_image
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.seller_id = $1
    `;
    const params = [req.seller.id];

    if (status) {
      query += ' AND o.status = $2';
      params.push(status);
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));

    const orders = await db.all(query, params);

    res.json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH /api/seller/orders/:orderNumber/status - Update order status
router.patch('/orders/:orderNumber/status', authenticateToken, async (req, res) => {
  try {
    const { status, tracking_number } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        message: 'Status must be one of: ' + validStatuses.join(', ')
      });
    }

    // Check if order belongs to seller
    const order = await db.get(
      'SELECT * FROM orders WHERE order_number = $1 AND seller_id = $2',
        [req.params.orderNumber, req.seller.id]
    );

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'Order not found or you do not have permission to update it'
      });
    }

    const updates = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];

    if (tracking_number) {
      updates.push('tracking_number = $' + (params.length + 1));
        params.push(tracking_number);
    }

    if (status === 'shipped' && !order.shipped_at) {
      updates.push('shipped_at = CURRENT_TIMESTAMP');
    }

    if (status === 'delivered' && !order.delivered_at) {
      updates.push('delivered_at = CURRENT_TIMESTAMP');
    }

    params.push(req.params.orderNumber);

    await db.run(
      `UPDATE orders SET ${updates.join(', ')} WHERE order_number = $${params.length}`,
      params
    );

    const updatedOrder = await db.get(
      'SELECT * FROM orders WHERE order_number = $1',
        [req.params.orderNumber]
    );

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// POST /api/seller/orders/:orderNumber/delivery-proof/photo - DISABLED: Only delivery drivers can upload proof
// This endpoint has been disabled to enforce the proper delivery flow:
// Seller ships → Delivery driver uploads proof → Buyer confirms
// Delivery drivers should use: POST /api/delivery/orders/:orderNumber/delivery-proof/photo
router.post('/orders/:orderNumber/delivery-proof/photo', authenticateToken, async (req, res) => {
  return res.status(403).json({ 
    error: 'Sellers cannot upload delivery proof',
    message: 'Only assigned delivery drivers can upload delivery proof. Please assign a delivery driver to complete this step.'
  });
});

// ============================================================================
// FLASH DEALS MANAGEMENT - Seller creates and manages their own deals
// ============================================================================

// GET /api/seller/deals - Get seller's flash deals
router.get('/deals', authenticateToken, async (req, res) => {
  try {
    const deals = await db.all(`
      SELECT fd.*, 
             p.name as product_name, p.slug as product_slug, p.image_url,
             EXTRACT(EPOCH FROM (fd.ends_at - NOW())) as seconds_remaining
      FROM flash_deals fd
      JOIN products p ON fd.product_id = p.id
      WHERE fd.seller_id = $1
      ORDER BY fd.created_at DESC
    `, [req.seller.id]);

    res.json({ success: true, deals });
  } catch (error) {
    console.error('Error fetching seller deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// POST /api/seller/deals - Create a new flash deal
router.post('/deals', authenticateToken, async (req, res) => {
  try {
    const {
      product_id,
      original_price,
      deal_price,
      discount_percentage,
      quantity_available,
      starts_at,
      ends_at
    } = req.body;

    // Validate required fields
    if (!product_id || !original_price || !deal_price || !discount_percentage || !quantity_available || !starts_at || !ends_at) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'All deal fields are required'
      });
    }

    // Verify product belongs to seller
    const product = await db.get(
      'SELECT id, price, stock FROM products WHERE id = $1 AND seller_id = $2',
      [product_id, req.seller.id]
    );

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'Product does not exist or does not belong to you'
      });
    }

    // Validate deal price is less than original price
    if (parseFloat(deal_price) >= parseFloat(original_price)) {
      return res.status(400).json({
        error: 'Invalid pricing',
        message: 'Deal price must be less than original price'
      });
    }

    // Validate quantity available doesn't exceed stock
    if (parseInt(quantity_available) > product.stock) {
      return res.status(400).json({
        error: 'Invalid quantity',
        message: `Quantity available (${quantity_available}) cannot exceed product stock (${product.stock})`
      });
    }

    // Validate dates
    const startDate = new Date(starts_at);
    const endDate = new Date(ends_at);
    
    if (endDate <= startDate) {
      return res.status(400).json({
        error: 'Invalid dates',
        message: 'End date must be after start date'
      });
    }

    // Check for overlapping deals on the same product
    const overlapping = await db.get(`
      SELECT id FROM flash_deals 
      WHERE product_id = $1 
        AND is_active = true
        AND (
          (starts_at <= $2 AND ends_at >= $2) OR
          (starts_at <= $3 AND ends_at >= $3) OR
          (starts_at >= $2 AND ends_at <= $3)
        )
    `, [product_id, starts_at, ends_at]);

    if (overlapping) {
      return res.status(400).json({
        error: 'Overlapping deal',
        message: 'This product already has an active deal during this time period'
      });
    }

    // Create the deal
    const result = await db.run(`
      INSERT INTO flash_deals (
        product_id, seller_id, original_price, deal_price, 
        discount_percentage, quantity_available, quantity_sold,
        starts_at, ends_at, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, true)
    `, [
      product_id,
      req.seller.id,
      original_price,
      deal_price,
      discount_percentage,
      quantity_available,
      starts_at,
      ends_at
    ]);

    const newDeal = await db.get(`
      SELECT fd.*, 
             p.name as product_name, p.slug as product_slug, p.image_url
      FROM flash_deals fd
      JOIN products p ON fd.product_id = p.id
      WHERE fd.id = $1
    `, [result.lastID]);

    res.json({
      success: true,
      message: 'Flash deal created successfully',
      deal: newDeal
    });
  } catch (error) {
    console.error('Error creating flash deal:', error);
    res.status(500).json({ error: 'Failed to create flash deal' });
  }
});

// PUT /api/seller/deals/:id - Update a flash deal
router.put('/deals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      deal_price,
      discount_percentage,
      quantity_available,
      ends_at,
      is_active
    } = req.body;

    // Verify deal belongs to seller
    const deal = await db.get(
      'SELECT * FROM flash_deals WHERE id = $1 AND seller_id = $2',
      [id, req.seller.id]
    );

    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found',
        message: 'Flash deal does not exist or does not belong to you'
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (deal_price !== undefined) {
      updates.push(`deal_price = $${paramIndex++}`);
      params.push(deal_price);
    }

    if (discount_percentage !== undefined) {
      updates.push(`discount_percentage = $${paramIndex++}`);
      params.push(discount_percentage);
    }

    if (quantity_available !== undefined) {
      updates.push(`quantity_available = $${paramIndex++}`);
      params.push(quantity_available);
    }

    if (ends_at !== undefined) {
      updates.push(`ends_at = $${paramIndex++}`);
      params.push(ends_at);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide fields to update'
      });
    }

    params.push(id);
    await db.run(
      `UPDATE flash_deals SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    const updatedDeal = await db.get(`
      SELECT fd.*, 
             p.name as product_name, p.slug as product_slug, p.image_url,
             EXTRACT(EPOCH FROM (fd.ends_at - NOW())) as seconds_remaining
      FROM flash_deals fd
      JOIN products p ON fd.product_id = p.id
      WHERE fd.id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Flash deal updated successfully',
      deal: updatedDeal
    });
  } catch (error) {
    console.error('Error updating flash deal:', error);
    res.status(500).json({ error: 'Failed to update flash deal' });
  }
});

// DELETE /api/seller/deals/:id - Delete a flash deal
router.delete('/deals/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify deal belongs to seller
    const deal = await db.get(
      'SELECT * FROM flash_deals WHERE id = $1 AND seller_id = $2',
      [id, req.seller.id]
    );

    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found',
        message: 'Flash deal does not exist or does not belong to you'
      });
    }

    // Check if deal has sales
    if (deal.quantity_sold > 0) {
      // Deactivate instead of delete if there are sales
      await db.run('UPDATE flash_deals SET is_active = false WHERE id = $1', [id]);
      return res.json({
        success: true,
        message: 'Flash deal deactivated (has existing sales)'
      });
    }

    // Delete if no sales
    await db.run('DELETE FROM flash_deals WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Flash deal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting flash deal:', error);
    res.status(500).json({ error: 'Failed to delete flash deal' });
  }
});

module.exports = router;
