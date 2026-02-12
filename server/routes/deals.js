const express = require('express');
const router = express.Router();
const db = require('../models/database');

// ============================================================================
// FLASH DEALS ROUTES
// Note: These queries use PostgreSQL-specific functions (EXTRACT, EPOCH, NOW())
// If using a different database, these functions may need to be adapted
// ============================================================================

// Get all active flash deals
router.get('/', async (req, res) => {
  try {
    const { limit = 12, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const deals = await db.all(
      `SELECT fd.*, 
              p.id as product_id, p.name, p.slug, p.description, p.image_url, 
              p.stock, p.avg_rating, p.review_count,
              s.name as seller_name, s.slug as seller_slug, s.is_verified,
              EXTRACT(EPOCH FROM (fd.ends_at - NOW())) as seconds_remaining
       FROM flash_deals fd
       JOIN products p ON fd.product_id = p.id
       JOIN sellers s ON p.seller_id = s.id
       WHERE fd.is_active = true 
         AND fd.starts_at <= NOW() 
         AND fd.ends_at > NOW()
         AND fd.quantity_sold < fd.quantity_available
       ORDER BY fd.discount_percentage DESC, fd.ends_at ASC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    // Get total count
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM flash_deals fd
       WHERE fd.is_active = true 
         AND fd.starts_at <= NOW() 
         AND fd.ends_at > NOW()
         AND fd.quantity_sold < fd.quantity_available`
    );

    res.json({
      deals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.total),
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching flash deals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get flash deal for specific product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const deal = await db.get(
      `SELECT fd.*, 
              EXTRACT(EPOCH FROM (fd.ends_at - NOW())) as seconds_remaining
       FROM flash_deals fd
       WHERE fd.product_id = $1 
         AND fd.is_active = true 
         AND fd.starts_at <= NOW() 
         AND fd.ends_at > NOW()`,
      [productId]
    );

    if (!deal) {
      return res.json({ deal: null });
    }

    res.json({ deal });
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get deals ending soon (within 2 hours)
router.get('/ending-soon', async (req, res) => {
  try {
    const deals = await db.all(
      `SELECT fd.*, 
              p.id as product_id, p.name, p.slug, p.image_url,
              s.name as seller_name, s.is_verified,
              EXTRACT(EPOCH FROM (fd.ends_at - NOW())) as seconds_remaining
       FROM flash_deals fd
       JOIN products p ON fd.product_id = p.id
       JOIN sellers s ON p.seller_id = s.id
       WHERE fd.is_active = true 
         AND fd.starts_at <= NOW() 
         AND fd.ends_at > NOW()
         AND fd.ends_at <= NOW() + INTERVAL '2 hours'
         AND fd.quantity_sold < fd.quantity_available
       ORDER BY fd.ends_at ASC
       LIMIT 6`
    );

    res.json({ deals });
  } catch (error) {
    console.error('Error fetching ending soon deals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get top deals (highest discount)
router.get('/top', async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const deals = await db.all(
      `SELECT fd.*, 
              p.id as product_id, p.name, p.slug, p.image_url, p.avg_rating,
              s.name as seller_name, s.slug as seller_slug, s.is_verified,
              EXTRACT(EPOCH FROM (fd.ends_at - NOW())) as seconds_remaining
       FROM flash_deals fd
       JOIN products p ON fd.product_id = p.id
       JOIN sellers s ON p.seller_id = s.id
       WHERE fd.is_active = true 
         AND fd.starts_at <= NOW() 
         AND fd.ends_at > NOW()
         AND fd.quantity_sold < fd.quantity_available
       ORDER BY fd.discount_percentage DESC
       LIMIT $1`,
      [parseInt(limit)]
    );

    res.json({ deals });
  } catch (error) {
    console.error('Error fetching top deals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get upcoming deals (not started yet)
router.get('/upcoming', async (req, res) => {
  try {
    const deals = await db.all(
      `SELECT fd.*, 
              p.id as product_id, p.name, p.slug, p.image_url,
              s.name as seller_name, s.is_verified,
              EXTRACT(EPOCH FROM (fd.starts_at - NOW())) as seconds_until_start
       FROM flash_deals fd
       JOIN products p ON fd.product_id = p.id
       JOIN sellers s ON p.seller_id = s.id
       WHERE fd.is_active = true 
         AND fd.starts_at > NOW()
       ORDER BY fd.starts_at ASC
       LIMIT 6`
    );

    res.json({ deals });
  } catch (error) {
    console.error('Error fetching upcoming deals:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
