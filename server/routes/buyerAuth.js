const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'kudimall_buyer_secret_key_2024';
const JWT_EXPIRY = '30d'; // 30 days for buyers
const FRONTEND_BASE_URL = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')[0]
  .trim() || 'http://localhost:3000';

// Email transporter configuration
const createEmailTransporter = () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
  
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Middleware to authenticate buyer token
const authenticateBuyerToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, buyer) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.buyer = buyer;
    next();
  });
};

// Buyer Signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    // Check if buyer already exists
    const existingBuyer = await db.get(
      'SELECT id FROM buyers WHERE email = $1',
      [email]
    );

    if (existingBuyer) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new buyer
    const result = await db.run(
      `INSERT INTO buyers (name, email, password, phone, default_address, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id`,
      [name, email, hashedPassword, phone || null, address || null]
    );

    // Validate that we got an ID back from the database
    if (!result.rows) {
      throw new Error('Database insert failed: No rows returned');
    }
    if (!result.rows[0]) {
      throw new Error(`Database insert failed: Empty result set (rowCount: ${result.rowCount})`);
    }
    if (!result.rows[0].id) {
      throw new Error('Database insert failed: No ID in result');
    }

    const buyerId = result.rows[0].id;

    // Link any existing guest orders to this buyer account
    await db.run(
      'UPDATE orders SET buyer_id = $1 WHERE buyer_email = $2 AND buyer_id IS NULL',
      [buyerId, email]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: buyerId, email, name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      buyer: {
        id: buyerId,
        name,
        email,
        phone: phone || null,
        default_address: address || null
      }
    });
  } catch (error) {
    console.error('Buyer signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// Buyer Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find buyer
    const buyer = await db.get(
      'SELECT * FROM buyers WHERE email = $1',
      [email]
    );

    if (!buyer) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if account is active
    if (!buyer.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, buyer.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await db.run(
      'UPDATE buyers SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [buyer.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: buyer.id, email: buyer.email, name: buyer.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    res.json({
      message: 'Login successful',
      token,
      buyer: {
        id: buyer.id,
        name: buyer.name,
        email: buyer.email,
        phone: buyer.phone,
        default_address: buyer.default_address
      }
    });
  } catch (error) {
    console.error('Buyer login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get Buyer Profile
router.get('/profile', authenticateBuyerToken, async (req, res) => {
  try {
    const buyer = await db.get(
      'SELECT id, name, email, phone, default_address, city, state, zip_code, created_at FROM buyers WHERE id = $1',
      [req.buyer.id]
    );

    if (!buyer) {
      return res.status(404).json({ error: 'Buyer not found' });
    }

    // Get order statistics
    const stats = await db.get(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_spent,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders
      FROM orders WHERE buyer_id = $1`,
      [req.buyer.id]
    );

    res.json({
      buyer,
      stats: stats || { total_orders: 0, total_spent: 0, completed_orders: 0, pending_orders: 0 }
    });
  } catch (error) {
    console.error('Get buyer profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update Buyer Profile
router.put('/profile', authenticateBuyerToken, async (req, res) => {
  try {
    const { name, phone, default_address, city, state, zip_code } = req.body;

    await db.run(
      `UPDATE buyers 
      SET name = $1, phone = $2, default_address = $3, city = $4, state = $5, zip_code = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7`,
      [name, phone, default_address, city, state, zip_code, req.buyer.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update buyer profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change Password
router.post('/change-password', authenticateBuyerToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    // Get buyer with password
    const buyer = await db.get(
      'SELECT password FROM buyers WHERE id = $1',
      [req.buyer.id]
    );

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, buyer.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.run(
      'UPDATE buyers SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, req.buyer.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Request Password Reset
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if buyer exists
    const buyer = await db.get(
      'SELECT id, name, email FROM buyers WHERE email = $1',
      [email]
    );

    // Always return success message to prevent email enumeration
    if (!buyer) {
      return res.json({ 
        message: 'If an account exists with this email, you will receive a password reset link shortly.' 
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000).toISOString(); // 1 hour from now

    // Save token to database
    await db.run(
      'UPDATE buyers SET reset_token = $1, reset_token_expiry = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [resetToken, resetTokenExpiry, buyer.id]
    );

    // Send password reset email
    try {
      const transporter = createEmailTransporter();
      const resetUrl = `${FRONTEND_BASE_URL}/buyer/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: buyer.email,
        subject: '🔐 Reset Your KudiMall Password',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0f1115 0%, #1b1f2a 100%); color: #c8a45a; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 15px 30px; background: linear-gradient(120deg, #b08a3d 0%, #c8a45a 45%, #e6c980 100%); color: #1a1d24; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
              .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hi ${buyer.name},</p>
                <p>We received a request to reset your password for your KudiMall buyer account.</p>
                <p>Click the button below to reset your password:</p>
                <p style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 5px;">${resetUrl}</p>
                <div class="warning">
                  <strong>⚠️ Important:</strong>
                  <ul>
                    <li>This link will expire in 1 hour</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Never share this link with anyone</li>
                  </ul>
                </div>
              </div>
              <div class="footer">
                <p>© 2026 KudiMall - Ghana's Premier E-Commerce Platform</p>
                <p>If you have any questions, contact us at ${process.env.EMAIL_USER}</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('✓ Password reset email sent to:', buyer.email);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Don't fail the request if email fails
    }

    res.json({ 
      message: 'If an account exists with this email, you will receive a password reset link shortly.' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset Password with Token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Find buyer with valid token
    const buyer = await db.get(
      `SELECT id, email, name, reset_token_expiry 
       FROM buyers 
      WHERE reset_token = $1 AND reset_token_expiry > NOW()`,
      [token]
    );

    if (!buyer) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await db.run(
      `UPDATE buyers 
      SET password = $1, reset_token = NULL, reset_token_expiry = NULL, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2`,
      [hashedPassword, buyer.id]
    );

    // Send confirmation email
    try {
      const transporter = createEmailTransporter();
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: buyer.email,
        subject: '✅ Your KudiMall Password Has Been Reset',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0f1115 0%, #1b1f2a 100%); color: #c8a45a; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
              .success { background: #d4edda; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; }
              .button { display: inline-block; padding: 15px 30px; background: linear-gradient(120deg, #b08a3d 0%, #c8a45a 45%, #e6c980 100%); color: #1a1d24; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Password Reset Successful</h1>
              </div>
              <div class="content">
                <p>Hi ${buyer.name},</p>
                <div class="success">
                  <strong>Your password has been successfully reset!</strong>
                </div>
                <p>You can now log in to your KudiMall account with your new password.</p>
                <p style="text-align: center;">
                  <a href="${FRONTEND_BASE_URL}/buyer/login" class="button">Log In Now</a>
                </p>
                <p><strong>If you didn't make this change:</strong> Please contact our support team immediately to secure your account.</p>
              </div>
              <div class="footer">
                <p>© 2026 KudiMall - Ghana's Premier E-Commerce Platform</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('✓ Password reset confirmation email sent to:', buyer.email);
    } catch (emailError) {
      console.error('Confirmation email error:', emailError);
      // Don't fail the request if email fails
    }

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = { router, authenticateBuyerToken };
