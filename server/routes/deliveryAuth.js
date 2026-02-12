const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'kudimall_delivery_secret_key_2024';
const JWT_EXPIRY = '30d';

const authenticateDeliveryToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, deliveryUser) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.deliveryUser = deliveryUser;
    next();
  });
};

// Delivery Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existingUser = await db.get(
      'SELECT id FROM delivery_users WHERE email = $1',
      [email]
    );

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.run(
      `INSERT INTO delivery_users (name, email, password, phone, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [name, email, hashedPassword, phone || null]
    );

    const token = jwt.sign(
      { id: result.id, email, name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(201).json({
      message: 'Delivery account created successfully',
      token,
      deliveryUser: {
        id: result.id,
        name,
        email,
        phone: phone || null
      }
    });
  } catch (error) {
    console.error('Delivery signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Delivery Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const deliveryUser = await db.get(
      'SELECT * FROM delivery_users WHERE email = $1',
      [email]
    );

    if (!deliveryUser) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!deliveryUser.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    const passwordMatch = await bcrypt.compare(password, deliveryUser.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    await db.run(
      'UPDATE delivery_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [deliveryUser.id]
    );

    const token = jwt.sign(
      { id: deliveryUser.id, email: deliveryUser.email, name: deliveryUser.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.json({
      message: 'Login successful',
      token,
      deliveryUser: {
        id: deliveryUser.id,
        name: deliveryUser.name,
        email: deliveryUser.email,
        phone: deliveryUser.phone
      }
    });
  } catch (error) {
    console.error('Delivery login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Delivery Profile
router.get('/profile', authenticateDeliveryToken, async (req, res) => {
  try {
    const deliveryUser = await db.get(
      'SELECT id, name, email, phone, created_at FROM delivery_users WHERE id = $1',
      [req.deliveryUser.id]
    );

    if (!deliveryUser) {
      return res.status(404).json({ error: 'Delivery user not found' });
    }

    res.json({ deliveryUser });
  } catch (error) {
    console.error('Get delivery profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = { router, authenticateDeliveryToken };
