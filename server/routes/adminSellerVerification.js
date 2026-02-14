const express = require('express');
const router = express.Router();
const db = require('../models/database');

// GET /api/admin/sellers - List all sellers with verification status
router.get('/sellers', async (req, res) => {
  try {
    const { status, verified, search, limit = 50, offset = 0, dedupe = 'true' } = req.query;

    const dedupeEnabled = String(dedupe).toLowerCase() !== 'false';

    let query = `
      WITH ranked_sellers AS (
        SELECT
          s.*,
          ROW_NUMBER() OVER (
            PARTITION BY CASE
              WHEN COALESCE(NULLIF(TRIM(s.email), ''), '') <> '' THEN LOWER(TRIM(s.email))
              WHEN COALESCE(NULLIF(TRIM(s.shop_name), ''), '') <> '' THEN LOWER(TRIM(s.shop_name))
              ELSE CONCAT('id:', s.id::text)
            END
            ORDER BY s.created_at DESC, s.id DESC
          ) AS row_rank
        FROM sellers s
      )
      SELECT
        s.id,
        s.name,
        s.email,
        s.shop_name,
        s.slug,
        COALESCE(s.phone, '') as phone,
        COALESCE(s.location, '') as location,
        s.is_verified,
        s.email_verified,
        s.trust_level,
        s.total_sales,
        s.rating,
        s.review_count,
        s.is_active,
        s.created_at,
        s.last_login,
        (SELECT COUNT(*) FROM products WHERE seller_id = s.id) as product_count,
        (SELECT COUNT(*) FROM products WHERE seller_id = s.id AND is_available = TRUE) as active_products
      FROM ranked_sellers s
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;
    
    if (dedupeEnabled) {
      query += ` AND s.row_rank = 1`;
    }

    // Filter by verification status
    if (verified === 'true') {
      query += ` AND s.is_verified = TRUE`;
    } else if (verified === 'false') {
      query += ` AND s.is_verified = FALSE`;
    }
    
    // Filter by email verification
    if (status === 'email_verified') {
      query += ` AND s.email_verified = TRUE`;
    } else if (status === 'email_unverified') {
      query += ` AND s.email_verified = FALSE`;
    }
    
    // Search by name or email
    if (search) {
      query += ` AND (s.name ILIKE $${paramIndex} OR s.email ILIKE $${paramIndex} OR s.shop_name ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    
    query += ` ORDER BY s.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const sellers = await db.all(query, params);
    
    // Get total count
    let countQuery = `
      WITH ranked_sellers AS (
        SELECT
          s.*,
          ROW_NUMBER() OVER (
            PARTITION BY CASE
              WHEN COALESCE(NULLIF(TRIM(s.email), ''), '') <> '' THEN LOWER(TRIM(s.email))
              WHEN COALESCE(NULLIF(TRIM(s.shop_name), ''), '') <> '' THEN LOWER(TRIM(s.shop_name))
              ELSE CONCAT('id:', s.id::text)
            END
            ORDER BY s.created_at DESC, s.id DESC
          ) AS row_rank
        FROM sellers s
      )
      SELECT COUNT(*) as total FROM ranked_sellers WHERE 1=1
    `;
    const countParams = [];

    if (dedupeEnabled) {
      countQuery += ' AND row_rank = 1';
    }
    
    if (verified === 'true') {
      countQuery += ' AND is_verified = TRUE';
    } else if (verified === 'false') {
      countQuery += ' AND is_verified = FALSE';
    }
    
    if (search) {
      countQuery += ' AND (name ILIKE $1 OR email ILIKE $1 OR shop_name ILIKE $1)';
      countParams.push(`%${search}%`);
    }
    
    const countResult = await db.get(countQuery, countParams);
    
    res.json({
      sellers,
      total: countResult.total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

// GET /api/admin/sellers/:id - Get single seller details
router.get('/sellers/:id', async (req, res) => {
  try {
    const seller = await db.get(`
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM products WHERE seller_id = s.id) as product_count,
        (SELECT COUNT(*) FROM products WHERE seller_id = s.id AND is_available = TRUE) as active_products,
        (SELECT COUNT(*) FROM orders o 
         JOIN products p ON o.product_id = p.id 
         WHERE p.seller_id = s.id) as total_orders
      FROM sellers s
      WHERE s.id = $1
    `, [req.params.id]);
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    // Get recent products
    const products = await db.all(`
      SELECT id, name, price, stock, is_available, created_at
      FROM products
      WHERE seller_id = $1
      ORDER BY created_at DESC
      LIMIT 5
    `, [req.params.id]);
    
    res.json({
      seller,
      products
    });
  } catch (error) {
    console.error('Error fetching seller details:', error);
    res.status(500).json({ error: 'Failed to fetch seller details' });
  }
});

// PATCH /api/admin/sellers/:id/verification - Update seller verification status
router.patch('/sellers/:id/verification', async (req, res) => {
  try {
    const { is_verified, trust_level, admin_notes } = req.body;
    
    const seller = await db.get('SELECT * FROM sellers WHERE id = $1', [req.params.id]);
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    // Validate trust_level (0-10)
    if (trust_level !== undefined && (trust_level < 0 || trust_level > 10)) {
      return res.status(400).json({ error: 'Trust level must be between 0 and 10' });
    }
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (is_verified !== undefined) {
      updates.push(`is_verified = $${paramIndex}`);
      params.push(is_verified);
      paramIndex++;
    }
    
    if (trust_level !== undefined) {
      updates.push(`trust_level = $${paramIndex}`);
      params.push(trust_level);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);
    
    await db.run(
      `UPDATE sellers SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    );
    
    // Log the verification change
    console.log(`✅ Seller verification updated: ID=${req.params.id}, is_verified=${is_verified}, trust_level=${trust_level}`);
    if (admin_notes) {
      console.log(`   Admin notes: ${admin_notes}`);
    }
    
    const updatedSeller = await db.get('SELECT * FROM sellers WHERE id = $1', [req.params.id]);
    
    res.json({
      success: true,
      message: 'Seller verification updated successfully',
      seller: updatedSeller
    });
  } catch (error) {
    console.error('Error updating seller verification:', error);
    res.status(500).json({ error: 'Failed to update seller verification' });
  }
});

// PATCH /api/admin/sellers/:id - Update seller profile information
router.patch('/sellers/:id', async (req, res) => {
  try {
    const { name, email, phone, shop_name, location, description } = req.body;
    
    const seller = await db.get('SELECT * FROM sellers WHERE id = $1', [req.params.id]);
    
    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }
    
    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Check if email is already used by another seller
    if (email && email !== seller.email) {
      const existingSeller = await db.get('SELECT id FROM sellers WHERE email = $1 AND id != $2', [email, req.params.id]);
      if (existingSeller) {
        return res.status(400).json({ error: 'Email already in use by another seller' });
      }
    }
    
    const updates = [];
    const params = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(name || null);
      paramIndex++;
    }
    
    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      params.push(email || null);
      paramIndex++;
    }
    
    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      params.push(phone || null);
      paramIndex++;
    }
    
    if (shop_name !== undefined) {
      updates.push(`shop_name = $${paramIndex}`);
      params.push(shop_name);
      paramIndex++;
    }
    
    if (location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      params.push(location || null);
      paramIndex++;
    }
    
    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description || null);
      paramIndex++;
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.params.id);
    
    await db.run(
      `UPDATE sellers SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      params
    );
    
    console.log(`✅ Seller profile updated: ID=${req.params.id}`);
    
    const updatedSeller = await db.get('SELECT * FROM sellers WHERE id = $1', [req.params.id]);
    
    res.json({
      success: true,
      message: 'Seller profile updated successfully',
      seller: updatedSeller
    });
  } catch (error) {
    console.error('Error updating seller profile:', error);
    res.status(500).json({ error: 'Failed to update seller profile' });
  }
});

// GET /api/admin/sellers/stats - Get verification statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.get(`
      WITH ranked_sellers AS (
        SELECT
          s.*,
          ROW_NUMBER() OVER (
            PARTITION BY CASE
              WHEN COALESCE(NULLIF(TRIM(s.email), ''), '') <> '' THEN LOWER(TRIM(s.email))
              WHEN COALESCE(NULLIF(TRIM(s.shop_name), ''), '') <> '' THEN LOWER(TRIM(s.shop_name))
              ELSE CONCAT('id:', s.id::text)
            END
            ORDER BY s.created_at DESC, s.id DESC
          ) AS row_rank
        FROM sellers s
      )
      SELECT 
        COUNT(*) as total_sellers,
        COUNT(CASE WHEN is_verified = TRUE THEN 1 END) as verified_sellers,
        COUNT(CASE WHEN is_verified = FALSE THEN 1 END) as unverified_sellers,
        COUNT(CASE WHEN email_verified = TRUE THEN 1 END) as email_verified_sellers,
        COUNT(CASE WHEN email_verified = FALSE THEN 1 END) as email_unverified_sellers,
        COUNT(CASE WHEN trust_level >= 4 THEN 1 END) as high_trust_sellers,
        COUNT(CASE WHEN is_verified = TRUE AND trust_level >= 4 THEN 1 END) as featured_eligible,
        AVG(trust_level) as avg_trust_level
      FROM ranked_sellers
      WHERE row_rank = 1
    `);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
