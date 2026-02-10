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
      WHERE p.seller_id = ?
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
    const category = await db.get('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!category) {
      return res.status(400).json({
        error: 'Invalid category',
        message: 'Category does not exist'
      });
    }

    // Generate unique slug
    let slug = generateSlug(name);
    let slugExists = await db.get(
      'SELECT id FROM products WHERE slug = ? AND seller_id = ?',
      [slug, req.seller.id]
    );
    let counter = 1;

    while (slugExists) {
      slug = `${generateSlug(name)}-${counter}`;
      slugExists = await db.get(
        'SELECT id FROM products WHERE slug = ? AND seller_id = ?',
        [slug, req.seller.id]
      );
      counter++;
    }

    // Create product
    const result = await db.run(`
      INSERT INTO products (
        seller_id, category_id, name, slug, description, price, 
        stock, image_url, images, is_available, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
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
      is_available !== undefined ? is_available : 1
    ]);

    const product = await db.get('SELECT * FROM products WHERE id = ?', [result.id]);

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
      WHERE p.id = ? AND p.seller_id = ?
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
      'SELECT * FROM products WHERE id = ? AND seller_id = ?',
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
      const category = await db.get('SELECT id FROM categories WHERE id = ?', [category_id]);
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
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      params.push(price);
    }
    if (category_id !== undefined) {
      updates.push('category_id = ?');
      params.push(category_id);
    }
    if (stock !== undefined) {
      updates.push('stock = ?');
      params.push(stock);
    }
    if (image_url !== undefined) {
      updates.push('image_url = ?');
      params.push(image_url);
    }
    if (images !== undefined) {
      updates.push('images = ?');
      params.push(JSON.stringify(images));
    }
    if (is_available !== undefined) {
      updates.push('is_available = ?');
      params.push(is_available);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);
    params.push(req.seller.id);

    await db.run(
      `UPDATE products SET ${updates.join(', ')} WHERE id = ? AND seller_id = ?`,
      params
    );

    const updatedProduct = await db.get(
      'SELECT * FROM products WHERE id = ?',
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
      'SELECT * FROM products WHERE id = ? AND seller_id = ?',
      [req.params.id, req.seller.id]
    );

    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        message: 'Product not found or you do not have permission to delete it'
      });
    }

    await db.run(
      'DELETE FROM products WHERE id = ? AND seller_id = ?',
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
        SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as active_products,
        SUM(stock) as total_stock,
        SUM(views) as total_views,
        SUM(sales) as total_sales
      FROM products
      WHERE seller_id = ?
    `, [req.seller.id]);

    const recentOrders = await db.all(`
      SELECT COUNT(*) as count, status
      FROM orders
      WHERE seller_id = ?
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
      WHERE o.seller_id = ?
    `;
    const params = [req.seller.id];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC LIMIT ?';
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
      'SELECT * FROM orders WHERE order_number = ? AND seller_id = ?',
      [req.params.orderNumber, req.seller.id]
    );

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'Order not found or you do not have permission to update it'
      });
    }

    const updates = ['status = ?', 'updated_at = CURRENT_TIMESTAMP'];
    const params = [status];

    if (tracking_number) {
      updates.push('tracking_number = ?');
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
      `UPDATE orders SET ${updates.join(', ')} WHERE order_number = ?`,
      params
    );

    const updatedOrder = await db.get(
      'SELECT * FROM orders WHERE order_number = ?',
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

// POST /api/seller/orders/:orderNumber/delivery-proof/photo - Upload delivery photo proof
router.post('/orders/:orderNumber/delivery-proof/photo', authenticateToken, deliveryProofUpload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Delivery photo is required' });
    }

    const order = await db.get(
      'SELECT * FROM orders WHERE order_number = ? AND seller_id = ?',
      [req.params.orderNumber, req.seller.id]
    );

    if (!order) {
      return res.status(404).json({
        error: 'Order not found',
        message: 'Order not found or you do not have permission to update it'
      });
    }

    const deliveredBy = req.body.delivered_by || 'delivery';
    const proofUrl = `/uploads/delivery-proofs/${req.file.filename}`;
    const proofType = order.delivery_signature_data ? 'photo+signature' : 'photo';

    await db.run(
      `UPDATE orders
       SET status = 'delivered',
           delivered_at = COALESCE(delivered_at, CURRENT_TIMESTAMP),
           delivery_proof_type = ?,
           delivery_proof_url = ?,
           delivery_photo_uploaded_by = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [proofType, proofUrl, deliveredBy, order.id]
    );

    const updatedOrder = await db.get(
      'SELECT * FROM orders WHERE id = ?',
      [order.id]
    );

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
