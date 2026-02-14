const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Get all sellers (featured on homepage)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, featured = false } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM sellers WHERE 1=1';
    const params = [];
    
    if (featured === 'true') {
      query += ' AND is_verified = TRUE AND trust_level >= 4';
    }
    
    query += ' ORDER BY trust_level DESC, total_sales DESC LIMIT $1 OFFSET $2';
    params.push(parseInt(limit), offset);
    
    const sellers = await db.all(query, params);
    res.json(sellers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single seller/store
router.get('/:slug', async (req, res) => {
  try {
    const seller = await db.get(
      'SELECT * FROM sellers WHERE slug = $1',
      [req.params.slug]
    );
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    res.json(seller);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get seller's products
router.get('/:slug/products', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const seller = await db.get(
      'SELECT id FROM sellers WHERE slug = $1',
      [req.params.slug]
    );
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    const products = await db.all(
      `SELECT p.*, c.name as category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
      WHERE p.seller_id = $1 AND p.is_available = TRUE
       ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3`,
      [seller.id, parseInt(limit), offset]
    );
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get seller reviews
router.get('/:slug/reviews', async (req, res) => {
  try {
    const seller = await db.get(
      'SELECT id FROM sellers WHERE slug = $1',
      [req.params.slug]
    );
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    const reviews = await db.all(
      `SELECT r.*, p.name as product_name
       FROM reviews r
       JOIN products p ON r.product_id = p.id
      WHERE r.seller_id = $1
       ORDER BY r.created_at DESC`,
      [seller.id]
    );
    
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Follow a seller
router.post('/:slug/follow', async (req, res) => {
  try {
    const { buyer_email } = req.body;
    
    if (!buyer_email) {
      return res.status(400).json({ error: 'Buyer email required' });
    }
    
    const seller = await db.get(
      'SELECT id FROM sellers WHERE slug = $1',
      [req.params.slug]
    );
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    await db.run(
      'INSERT INTO follows (buyer_email, seller_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [buyer_email, seller.id]
    );
    
    res.json({ message: 'Successfully followed seller' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unfollow a seller
router.delete('/:slug/follow', async (req, res) => {
  try {
    const { buyer_email } = req.body;
    
    if (!buyer_email) {
      return res.status(400).json({ error: 'Buyer email required' });
    }
    
    const seller = await db.get(
      'SELECT id FROM sellers WHERE slug = $1',
      [req.params.slug]
    );
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    await db.run(
      'DELETE FROM follows WHERE buyer_email = $1 AND seller_id = $2',
      [buyer_email, seller.id]
    );
    
    res.json({ message: 'Successfully unfollowed seller' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
