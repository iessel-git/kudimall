const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'kudimall-secret-key-change-in-production';

// Email transporter configuration
const createEmailTransporter = () => {
  // Check if using Gmail (simple configuration)
  if (process.env.EMAIL_USER && process.env.EMAIL_USER.includes('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASSWORD || 'your-app-password'
      }
    });
  }
  
  // Custom domain SMTP configuration
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'noreply@example.com',
      pass: process.env.EMAIL_PASSWORD || 'your-password'
    }
  });
};

// Helper function to send verification email
const sendVerificationEmail = async (email, name, token) => {
  try {
    const transporter = createEmailTransporter();
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/seller/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@kudimall.com',
      to: email,
      subject: '🔐 Verify Your KudiMall Seller Email',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0f1115 0%, #1b1f2a 100%); 
                      color: #c8a45a; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f6f1e6; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #c8a45a; color: white; 
                      padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                      font-weight: bold; margin: 20px 0; }
            .button:hover { background: #b08d45; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; 
                       padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Verify Your Email</h1>
              <p>KudiMall Marketplace</p>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for signing up as a seller on KudiMall!</p>
              <p>To complete your registration and start selling, please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666; font-size: 12px;">${verificationUrl}</p>
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This verification link will expire in 24 hours</li>
                  <li>If you didn't create an account with KudiMall, please ignore this email</li>
                  <li>Never share this verification link with anyone</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>© 2026 KudiMall. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('✓ Verification email sent to:', email);
    return true;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
};

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.seller = verified;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Helper function to generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// POST /api/auth/seller/signup - Register new seller
router.post('/seller/signup', async (req, res) => {
  try {
    const { name, email, password, phone, location, description } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'Name, email, and password are required' 
      });
    }

    // Check if seller already exists
    const existingSeller = await db.get(
      'SELECT * FROM sellers WHERE email = ?',
      [email]
    );

    if (existingSeller) {
      return res.status(409).json({ 
        error: 'Email already exists',
        message: 'A seller with this email already exists' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique slug
    let slug = generateSlug(name);
    let slugExists = await db.get('SELECT id FROM sellers WHERE slug = ?', [slug]);
    let counter = 1;
    
    while (slugExists) {
      slug = `${generateSlug(name)}-${counter}`;
      slugExists = await db.get('SELECT id FROM sellers WHERE slug = ?', [slug]);
      counter++;
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create seller with email_verified = 0
    const result = await db.run(`
      INSERT INTO sellers (
        name, slug, email, password, phone, location, description, is_active,
        email_verified, email_verification_token, email_verification_expires
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
    `, [name, slug, email, hashedPassword, phone || null, location || null, description || null, verificationToken, verificationExpires.toISOString()]);

    // Send verification email
    const emailSent = await sendVerificationEmail(email, name, verificationToken);

    res.status(201).json({
      success: true,
      message: emailSent 
        ? 'Seller account created successfully! Please check your email to verify your account.'
        : 'Seller account created successfully! Verification email could not be sent. Please contact support.',
      emailVerificationRequired: true,
      seller: {
        id: result.id,
        name,
        email,
        slug,
        phone,
        location,
        description,
        email_verified: false
      }
    });
  } catch (error) {
    console.error('Error creating seller account:', error);
    res.status(500).json({ 
      error: 'Failed to create account',
      message: error.message 
    });
  }
});

// POST /api/auth/seller/login - Login seller
router.post('/seller/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing credentials',
        message: 'Email and password are required' 
      });
    }

    // Find seller
    const seller = await db.get(
      'SELECT * FROM sellers WHERE email = ?',
      [email]
    );

    if (!seller) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect' 
      });
    }

    // Check if seller has password (might be from old seeded data)
    if (!seller.password) {
      return res.status(401).json({ 
        error: 'Account not activated',
        message: 'Please complete seller application first or reset your password' 
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, seller.password);
    if (!validPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect' 
      });
    }

    // Check if email is verified
    if (!seller.email_verified) {
      return res.status(403).json({ 
        error: 'Email not verified',
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.',
        requiresEmailVerification: true
      });
    }

    // Check if seller is active
    if (!seller.is_active) {
      return res.status(403).json({ 
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact support.' 
      });
    }

    // Update last login
    await db.run(
      'UPDATE sellers SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [seller.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: seller.id, 
        email: seller.email, 
        name: seller.name, 
        slug: seller.slug 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        slug: seller.slug,
        phone: seller.phone,
        location: seller.location,
        description: seller.description,
        logo_url: seller.logo_url,
        banner_url: seller.banner_url,
        is_verified: seller.is_verified,
        trust_level: seller.trust_level,
        total_sales: seller.total_sales,
        rating: seller.rating
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: error.message 
    });
  }
});

// GET /api/auth/seller/me - Get current seller info
router.get('/seller/me', authenticateToken, async (req, res) => {
  try {
    const seller = await db.get(
      'SELECT id, name, slug, email, phone, location, description, logo_url, banner_url, is_verified, trust_level, total_sales, rating, review_count, created_at FROM sellers WHERE id = ?',
      [req.seller.id]
    );

    if (!seller) {
      return res.status(404).json({ 
        error: 'Seller not found',
        message: 'Seller account not found' 
      });
    }

    res.json({ success: true, seller });
  } catch (error) {
    console.error('Error fetching seller info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch seller info',
      message: error.message 
    });
  }
});

// PUT /api/auth/seller/profile - Update seller profile
router.put('/seller/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, location, description, logo_url, banner_url } = req.body;
    
    const updates = [];
    const params = [];
    
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (logo_url !== undefined) {
      updates.push('logo_url = ?');
      params.push(logo_url);
    }
    if (banner_url !== undefined) {
      updates.push('banner_url = ?');
      params.push(banner_url);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.seller.id);
    
    await db.run(
      `UPDATE sellers SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    const updatedSeller = await db.get(
      'SELECT id, name, slug, email, phone, location, description, logo_url, banner_url, is_verified, trust_level FROM sellers WHERE id = ?',
      [req.seller.id]
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      seller: updatedSeller
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      message: error.message 
    });
  }
});

// GET /api/auth/seller/verify-email - Verify seller email
router.get('/seller/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Verification token is required'
      });
    }

    // Find seller by verification token
    const seller = await db.get(
      'SELECT * FROM sellers WHERE email_verification_token = ?',
      [token]
    );

    if (!seller) {
      return res.status(404).json({
        error: 'Invalid token',
        message: 'Verification token is invalid or expired'
      });
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(seller.email_verification_expires);
    
    if (now > expiresAt) {
      return res.status(410).json({
        error: 'Token expired',
        message: 'Verification link has expired. Please request a new verification email.',
        expired: true
      });
    }

    // Check if already verified
    if (seller.email_verified) {
      return res.json({
        success: true,
        message: 'Email already verified. You can now log in.',
        alreadyVerified: true
      });
    }

    // Verify the email
    await db.run(
      `UPDATE sellers 
       SET email_verified = 1, 
           email_verification_token = NULL, 
           email_verification_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [seller.id]
    );

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in to your seller account.',
      seller: {
        name: seller.name,
        email: seller.email
      }
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({
      error: 'Verification failed',
      message: error.message
    });
  }
});

// POST /api/auth/seller/resend-verification - Resend verification email
router.post('/seller/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Missing email',
        message: 'Email address is required'
      });
    }

    // Find seller
    const seller = await db.get(
      'SELECT * FROM sellers WHERE email = ?',
      [email]
    );

    if (!seller) {
      return res.status(404).json({
        error: 'Account not found',
        message: 'No seller account found with this email address'
      });
    }

    // Check if already verified
    if (seller.email_verified) {
      return res.json({
        success: true,
        message: 'Email is already verified. You can log in now.',
        alreadyVerified: true
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update seller with new token
    await db.run(
      `UPDATE sellers 
       SET email_verification_token = ?, 
           email_verification_expires = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [verificationToken, verificationExpires.toISOString(), seller.id]
    );

    // Send verification email
    const emailSent = await sendVerificationEmail(email, seller.name, verificationToken);

    if (emailSent) {
      res.json({
        success: true,
        message: 'Verification email sent! Please check your inbox.'
      });
    } else {
      res.status(500).json({
        error: 'Email failed',
        message: 'Failed to send verification email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Error resending verification email:', error);
    res.status(500).json({
      error: 'Failed to resend verification',
      message: error.message
    });
  }
});

module.exports = { router, authenticateToken };
