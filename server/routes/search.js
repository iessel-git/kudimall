const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Global search
router.get('/', async (req, res) => {
  try {
    const { q, type = 'all', page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const offset = (page - 1) * limit;
    const searchTerm = `%${q}%`;
    
    const results = {
      products: [],
      sellers: [],
      categories: []
    };
    
    // Search products
    if (type === 'all' || type === 'products') {
      results.products = await db.all(
        `SELECT p.*, s.name as seller_name, s.trust_level, s.is_verified,
                c.name as category_name
         FROM products p
         JOIN sellers s ON p.seller_id = s.id
         JOIN categories c ON p.category_id = c.id
         WHERE (p.name ILIKE $1 OR p.description ILIKE $2) 
         AND p.is_available = TRUE
         ORDER BY p.is_featured DESC, p.views DESC
         LIMIT $3 OFFSET $4`,
        [searchTerm, searchTerm, parseInt(limit), offset]
      );
    }
    
    // Search sellers
    if (type === 'all' || type === 'sellers') {
      results.sellers = await db.all(
        `SELECT * FROM sellers 
         WHERE name ILIKE $1 OR description ILIKE $2
         ORDER BY trust_level DESC, total_sales DESC
         LIMIT $3 OFFSET $4`,
        [searchTerm, searchTerm, parseInt(limit), offset]
      );
    }
    
    // Search categories
    if (type === 'all' || type === 'categories') {
      results.categories = await db.all(
        `SELECT * FROM categories 
         WHERE name ILIKE $1 OR description ILIKE $2
         LIMIT $3`,
        [searchTerm, searchTerm, parseInt(limit)]
      );
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
