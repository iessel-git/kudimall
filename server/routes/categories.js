const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await db.all('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single category
router.get('/:slug', async (req, res) => {
  try {
    const category = await db.get(
      'SELECT * FROM categories WHERE slug = $1',
      [req.params.slug]
    );
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get products in a category
router.get('/:slug/products', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const category = await db.get(
      'SELECT id FROM categories WHERE slug = $1',
      [req.params.slug]
    );
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const products = await db.all(
      `SELECT p.*, 
              COALESCE(s.name, s.shop_name) as seller_name, 
              s.slug as seller_slug,
              s.trust_level, 
              s.is_verified,
              c.name as category_name,
              c.slug as category_slug
       FROM products p
       JOIN sellers s ON p.seller_id = s.id
       JOIN categories c ON p.category_id = c.id
       WHERE p.category_id = $1 AND p.is_available = TRUE
       ORDER BY p.is_featured DESC, p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [category.id, parseInt(limit), offset]
    );
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
