const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Get all products (with filters)
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      featured = false,
      min_price,
      max_price,
      trust_level,
      available = true
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, s.name as seller_name, s.trust_level, s.is_verified, 
             c.name as category_name
      FROM products p
      JOIN sellers s ON p.seller_id = s.id
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];
    
    if (featured === 'true') {
      query += ' AND p.is_featured = 1';
    }
    
    if (available === 'true') {
      query += ' AND p.is_available = 1';
    }
    
    if (min_price) {
      query += ' AND p.price >= ?';
      params.push(parseFloat(min_price));
    }
    
    if (max_price) {
      query += ' AND p.price <= ?';
      params.push(parseFloat(max_price));
    }
    
    if (trust_level) {
      query += ' AND s.trust_level >= ?';
      params.push(parseInt(trust_level));
    }
    
    query += ' ORDER BY p.is_featured DESC, p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    
    const products = await db.all(query, params);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product
router.get('/:slug', async (req, res) => {
  try {
    const product = await db.get(
      `SELECT p.*, s.name as seller_name, s.slug as seller_slug, 
              s.trust_level, s.is_verified, s.location as seller_location,
              c.name as category_name, c.slug as category_slug
       FROM products p
       JOIN sellers s ON p.seller_id = s.id
       JOIN categories c ON p.category_id = c.id
       WHERE p.slug = ?`,
      [req.params.slug]
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Increment view count
    await db.run(
      'UPDATE products SET views = views + 1 WHERE id = ?',
      [product.id]
    );
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product reviews
router.get('/:slug/reviews', async (req, res) => {
  try {
    const product = await db.get(
      'SELECT id FROM products WHERE slug = ?',
      [req.params.slug]
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const reviews = await db.all(
      'SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC',
      [product.id]
    );
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
