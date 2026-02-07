const express = require('express');
const router = express.Router();
const db = require('../models/database');

// Create a review
router.post('/', async (req, res) => {
  try {
    const { product_id, seller_id, buyer_name, rating, comment } = req.body;
    
    if (!product_id || !seller_id || !buyer_name || !rating) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const result = await db.run(
      `INSERT INTO reviews (product_id, seller_id, buyer_name, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [product_id, seller_id, buyer_name, rating, comment]
    );
    
    res.status(201).json({ 
      message: 'Review created successfully',
      id: result.id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
