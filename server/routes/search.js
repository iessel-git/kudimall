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
      try {
        results.products = await db.all(
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
           WHERE (p.name ILIKE $1 OR p.description ILIKE $2) 
           AND p.is_available = TRUE
           ORDER BY p.is_featured DESC, p.views DESC
           LIMIT $3 OFFSET $4`,
          [searchTerm, searchTerm, parseInt(limit), offset]
        );
      } catch (productError) {
        console.error('Error searching products:', productError);
        // Continue with empty products array
      }
    }
    
    // Search sellers
    if (type === 'all' || type === 'sellers') {
      try {
        results.sellers = await db.all(
          `SELECT id, 
                  COALESCE(name, shop_name) as name, 
                  shop_name,
                  slug,
                  description, 
                  trust_level, 
                  total_sales,
                  is_verified,
                  logo_url
           FROM sellers 
           WHERE (name ILIKE $1 OR shop_name ILIKE $2 OR description ILIKE $3)
           ORDER BY trust_level DESC, total_sales DESC
           LIMIT $4 OFFSET $5`,
          [searchTerm, searchTerm, searchTerm, parseInt(limit), offset]
        );
      } catch (sellerError) {
        console.error('Error searching sellers:', sellerError);
        // Continue with empty sellers array
      }
    }
    
    // Search categories
    if (type === 'all' || type === 'categories') {
      try {
        results.categories = await db.all(
          `SELECT * FROM categories 
           WHERE name ILIKE $1 OR description ILIKE $2
           LIMIT $3`,
          [searchTerm, searchTerm, parseInt(limit)]
        );
      } catch (categoryError) {
        console.error('Error searching categories:', categoryError);
        // Continue with empty categories array
      }
    }
    
    res.json(results);
  } catch (error) {
    console.error('Search endpoint error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
