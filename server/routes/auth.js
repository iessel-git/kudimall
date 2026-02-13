const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../models/database');

const JWT_SECRET = process.env.JWT_SECRET || 'kudimall-secret-key-change-in-production';
const FRONTEND_BASE_URL = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')[0]
  .trim() || 'http://localhost:3000';

// Error codes that are safe to expose to clients (don't reveal system configuration)
// Configuration errors (EMAIL_NOT_CONFIGURED, EMAIL_PLACEHOLDER_VALUES) and 
// authentication errors (EMAIL_AUTH_FAILED) are excluded because they reveal
// details about the server's email setup and credentials, which could aid attackers.
const EXPOSABLE_ERROR_CODES = ['EMAIL_CONNECTION_FAILED', 'EMAIL_INVALID', 'EMAIL_SEND_FAILED'];

// Error codes that indicate configuration issues (grouped for easier maintenance)
const CONFIG_ERROR_CODES = ['EMAIL_NOT_CONFIGURED', 'EMAIL_PLACEHOLDER_VALUES'];

// Error codes that indicate authentication issues (grouped for easier maintenance)
const AUTH_ERROR_CODES = ['EMAIL_AUTH_FAILED'];

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
    // Check if email is properly configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email not configured (EMAIL_USER or EMAIL_PASSWORD missing). Skipping verification email.');
      return { 
        success: false, 
        error: 'Email service not configured',
        code: 'EMAIL_NOT_CONFIGURED'
      };
    }

    // Check if using default/placeholder values
    const isPlaceholder = 
      process.env.EMAIL_USER === 'your-email@gmail.com' ||
      process.env.EMAIL_PASSWORD === 'your-app-password' ||
      process.env.EMAIL_PASSWORD === 'your-password' ||
      process.env.EMAIL_PASSWORD === 'your-16-character-app-password';
    
    if (isPlaceholder) {
      console.warn('⚠️ Email configured with placeholder values. Please update EMAIL_USER and EMAIL_PASSWORD in .env file.');
      return { 
        success: false, 
        error: 'Email service not configured properly',
        code: 'EMAIL_PLACEHOLDER_VALUES'
      };
    }

    const transporter = createEmailTransporter();
    const verificationUrl = `${FRONTEND_BASE_URL}/seller/verify?token=${token}`;
    
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
    return { success: true };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    
    // Determine error type for better error handling
    let errorCode = 'EMAIL_SEND_FAILED';
    let errorMessage = 'Failed to send email';
    
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      errorCode = 'EMAIL_AUTH_FAILED';
      errorMessage = 'Email authentication failed';
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorCode = 'EMAIL_CONNECTION_FAILED';
      errorMessage = 'Could not connect to email server';
    } else if (error.code === 'EMESSAGE') {
      errorCode = 'EMAIL_INVALID';
      errorMessage = 'Invalid email address or message';
    }
    
    return { 
      success: false, 
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    };
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

// Helper function to get exposable error information from email result
// Returns filtered error info that's safe to expose to clients based on environment
const getExposableErrorInfo = (emailResult) => {
  if (!emailResult || emailResult.success) {
    return { emailError: undefined, errorCode: undefined, errorDetails: undefined };
  }
  
  // In production, don't expose any error details
  if (process.env.NODE_ENV === 'production') {
    return { emailError: undefined, errorCode: undefined, errorDetails: undefined };
  }
  
  // In non-production environments, filter based on error code sensitivity
  const isExposableCode = EXPOSABLE_ERROR_CODES.includes(emailResult.code);
  
  // Only expose error information if the error code is safe to expose
  // This maintains consistency: if we don't expose the code, we don't expose details either
  const exposableError = {
    emailError: isExposableCode ? emailResult.error : undefined,
    errorCode: isExposableCode ? emailResult.code : undefined,
    errorDetails: isExposableCode ? emailResult.details : undefined
  };
  
  return exposableError;
};

// Helper function to get user-friendly error message based on error code
const getUserFriendlyEmailErrorMessage = (emailResult) => {
  if (!emailResult || emailResult.success) {
    return null;
  }
  
  if (CONFIG_ERROR_CODES.includes(emailResult.code)) {
    return 'Email service is not configured. Please contact support.';
  } else if (AUTH_ERROR_CODES.includes(emailResult.code)) {
    return 'Email service authentication failed. Please contact support.';
  } else if (emailResult.code === 'EMAIL_CONNECTION_FAILED') {
    return 'Could not connect to email server. Please try again in a few moments.';
  }
  
  return 'Failed to send verification email. Please try again later.';
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
    try {
      const existingSeller = await db.get(
        'SELECT * FROM sellers WHERE email = $1',
        [email]
      );

      if (existingSeller) {
        return res.status(409).json({ 
          error: 'Email already exists',
          message: 'A seller with this email already exists' 
        });
      }
    } catch (dbError) {
      // Check if error is due to missing email column
      if (dbError.message && dbError.message.includes('column') && dbError.message.includes('email')) {
        console.error('❌ Database schema error: sellers table missing email column');
        console.error('   Run: POST /api/debug/migrate (in development) or restart the server to auto-migrate');
        return res.status(503).json({
          error: 'Database configuration error',
          message: 'The database schema needs to be updated. Please contact the administrator or restart the server to auto-migrate.'
        });
      }
      throw dbError;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique slug
    let slug = generateSlug(name);
    let slugExists = await db.get('SELECT id FROM sellers WHERE slug = $1', [slug]);
    let counter = 1;
    
    while (slugExists) {
      slug = `${generateSlug(name)}-${counter}`;
      slugExists = await db.get('SELECT id FROM sellers WHERE slug = $1', [slug]);
      counter++;
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create seller with email_verified = FALSE
    // Note: shop_name defaults to seller's name
    const result = await db.run(`
      INSERT INTO sellers (
        name, slug, email, password, phone, location, description, shop_name, is_active,
        email_verified, email_verification_token, email_verification_expires
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, FALSE, $9, $10)
    `, [name, slug, email, hashedPassword, phone || null, location || null, description || null, name /* shop_name defaults to name */, verificationToken, verificationExpires.toISOString()]);

    // Send verification email
    const emailResult = await sendVerificationEmail(email, name, verificationToken);
    const exposableErrorInfo = getExposableErrorInfo(emailResult);

    // Construct appropriate message based on email result
    let responseMessage;
    if (emailResult.success) {
      responseMessage = 'Seller account created successfully! Please check your email to verify your account.';
    } else {
      const errorDetail = getUserFriendlyEmailErrorMessage(emailResult);
      responseMessage = `Seller account created successfully, but the verification email could not be sent. ${errorDetail.replace(/\.$/, '')} - you can use the "Resend Verification Email" option.`;
    }

    res.status(201).json({
      success: true,
      message: responseMessage,
      emailVerificationRequired: true,
      emailSent: emailResult.success,
      ...exposableErrorInfo,
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
      'SELECT * FROM sellers WHERE email = $1',
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
      'UPDATE sellers SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
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
      'SELECT id, name, slug, email, phone, location, description, logo_url, banner_url, is_verified, trust_level, total_sales, rating, review_count, created_at FROM sellers WHERE id = $1',
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
      updates.push('name = $' + (updates.length + 1));
      params.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = $' + (updates.length + 1));
      params.push(phone);
    }
    if (location !== undefined) {
      updates.push('location = $' + (updates.length + 1));
      params.push(location);
    }
    if (description !== undefined) {
      updates.push('description = $' + (updates.length + 1));
      params.push(description);
    }
    if (logo_url !== undefined) {
      updates.push('logo_url = $' + (updates.length + 1));
      params.push(logo_url);
    }
    if (banner_url !== undefined) {
      updates.push('banner_url = $' + (updates.length + 1));
      params.push(banner_url);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.seller.id);
    
    await db.run(
      `UPDATE sellers SET ${updates.join(', ')} WHERE id = $${updates.length + 1}`,
      params
    );
    
    const updatedSeller = await db.get(
      'SELECT id, name, slug, email, phone, location, description, logo_url, banner_url, is_verified, trust_level FROM sellers WHERE id = $1',
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
      'SELECT * FROM sellers WHERE email_verification_token = $1',
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
       SET email_verified = TRUE, 
           email_verification_token = NULL, 
           email_verification_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
      WHERE id = $1`,
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
      'SELECT * FROM sellers WHERE email = $1',
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
         SET email_verification_token = $1, 
           email_verification_expires = $2,
           updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
      [verificationToken, verificationExpires.toISOString(), seller.id]
    );

    // Send verification email
    const emailResult = await sendVerificationEmail(email, seller.name, verificationToken);

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Verification email sent! Please check your inbox.'
      });
    } else {
      // Get user-friendly error message
      const userMessage = getUserFriendlyEmailErrorMessage(emailResult);
      
      // Get filtered error information safe to expose to clients
      const exposableErrorInfo = getExposableErrorInfo(emailResult);
      
      res.status(500).json({
        error: 'Email failed',
        message: userMessage,
        ...exposableErrorInfo
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
