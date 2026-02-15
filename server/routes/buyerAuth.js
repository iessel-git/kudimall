const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../models/database');
const logger = require('../utils/logger');
const { sendMailWithFallback, getFrontendBaseUrl, getEmailSender } = require('../utils/emailConfig');

// Validate JWT_SECRET is set (critical security requirement)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV !== 'test') {
  logger.error('FATAL: JWT_SECRET environment variable is not set. This is required for security.');
  logger.error('Please set JWT_SECRET in your .env file to a strong random string (minimum 32 characters).');
  process.exit(1);
}

const JWT_EXPIRY = '7d'; // 7 days for buyers
const JWT_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const FRONTEND_BASE_URL = getFrontendBaseUrl();

const EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES = 10;
const EMAIL_VERIFICATION_RESEND_LIMIT = 3;
const EMAIL_VERIFICATION_RESEND_WINDOW_MS = 60 * 60 * 1000;

const generateVerificationCode = () => {
  const crypto = require('crypto');
  return String(crypto.randomInt(100000, 999999));
};

const getResendState = (record) => {
  const lastSentAt = record.email_verification_last_sent_at
    ? new Date(record.email_verification_last_sent_at)
    : null;
  const sentCount = Number.isInteger(record.email_verification_sent_count)
    ? record.email_verification_sent_count
    : 0;

  if (!lastSentAt || Date.now() - lastSentAt.getTime() > EMAIL_VERIFICATION_RESEND_WINDOW_MS) {
    return { sentCount: 0, canSend: true, remaining: EMAIL_VERIFICATION_RESEND_LIMIT };
  }

  const remaining = Math.max(EMAIL_VERIFICATION_RESEND_LIMIT - sentCount, 0);
  return { sentCount, canSend: remaining > 0, remaining };
};

const sendBuyerVerificationEmail = async (email, name, code) => {
  const mailOptions = {
    from: getEmailSender(),
    to: email,
    subject: '🔐 Your KudiMall Buyer Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #c8a45a;">Verify Your Email</h2>
        <p>Hi ${name},</p>
        <p>Use the verification code below to activate your buyer account:</p>
        <div style="text-align: center; margin: 20px 0;">
          <div style="display: inline-block; background: #0f1115; color: #c8a45a; padding: 14px 24px; border-radius: 8px; font-size: 24px; letter-spacing: 4px; font-weight: bold;">
            ${code}
          </div>
        </div>
        <p>This code expires in ${EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES} minutes.</p>
        <p style="color: #666; font-size: 12px;">If you did not create this account, please ignore this email.</p>
      </div>
    `
  };

  await sendMailWithFallback(mailOptions);
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

    // Generate email verification code
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
    const verificationSentAt = new Date();

    // Insert new buyer
    const result = await db.run(
      `INSERT INTO buyers (
        name, email, password, phone, default_address, is_active,
        email_verified, email_verification_token, email_verification_expires,
        email_verification_sent_count, email_verification_last_sent_at,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, TRUE, FALSE, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id`,
      [
        name,
        email,
        hashedPassword,
        phone || null,
        address || null,
        verificationCode,
        verificationExpires.toISOString(),
        1,
        verificationSentAt.toISOString()
      ]
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

    let emailSent = true;
    try {
      await sendBuyerVerificationEmail(email, name, verificationCode);
    } catch (emailError) {
      console.warn('Buyer verification email failed:', emailError.message);
      emailSent = false;
    }

    res.status(201).json({
      message: emailSent
        ? 'Account created successfully! Please check your email for your verification code.'
        : 'Account created successfully, but the verification email could not be sent. Please use the resend code option.',
      emailVerificationRequired: true,
      emailSent,
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

    if (!buyer.email_verified) {
      const resendState = getResendState(buyer);
      const now = new Date();
      let verificationCode = buyer.email_verification_token;
      let verificationExpires = buyer.email_verification_expires ? new Date(buyer.email_verification_expires) : null;
      const codeExpired = !verificationExpires || verificationExpires.getTime() < now.getTime();

      if ((!verificationCode || codeExpired) && !resendState.canSend) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Too many verification attempts. Please wait before requesting another code.',
          requiresEmailVerification: true
        });
      }

      if (!verificationCode || codeExpired) {
        verificationCode = generateVerificationCode();
        verificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
      }

      if (resendState.canSend) {
        await db.run(
          `UPDATE buyers
           SET email_verification_token = $1,
               email_verification_expires = $2,
               email_verification_sent_count = $3,
               email_verification_last_sent_at = $4,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $5`,
          [
            verificationCode,
            verificationExpires.toISOString(),
            resendState.sentCount + 1,
            now.toISOString(),
            buyer.id
          ]
        );

        sendBuyerVerificationEmail(buyer.email, buyer.name, verificationCode).catch((err) => {
          console.error('Buyer verification email failed:', err);
        });
      }

      return res.status(403).json({
        error: 'Email not verified',
        message: 'Please verify your email address before logging in. A verification code has been sent to your inbox.',
        requiresEmailVerification: true
      });
    }

    // Update last login
    await db.run(
      'UPDATE buyers SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [buyer.id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: buyer.id, email: buyer.email, name: buyer.name, type: 'buyer' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );

    // Set HttpOnly cookie for enhanced security
    res.cookie('buyer_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: JWT_EXPIRY_MS,
      path: '/'
    });

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

// POST /api/buyer-auth/verify-code - Verify buyer email with code
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const buyer = await db.get('SELECT * FROM buyers WHERE email = $1', [email]);
    if (!buyer) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (buyer.email_verified) {
      return res.json({
        success: true,
        message: 'Email already verified. You can now log in.',
        alreadyVerified: true
      });
    }

    if (!buyer.email_verification_token) {
      return res.status(400).json({ error: 'Please request a new verification code.' });
    }

    const expiresAt = new Date(buyer.email_verification_expires);
    if (expiresAt.getTime() < Date.now()) {
      return res.status(410).json({
        error: 'Code expired',
        message: 'Verification code has expired. Please request a new one.',
        expired: true
      });
    }

    if (String(code).trim() !== String(buyer.email_verification_token).trim()) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    await db.run(
      `UPDATE buyers
       SET email_verified = TRUE,
           email_verification_token = NULL,
           email_verification_expires = NULL,
           email_verification_sent_count = 0,
           email_verification_last_sent_at = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [buyer.id]
    );

    res.json({
      success: true,
      message: 'Email verified successfully! You can now log in.'
    });
  } catch (error) {
    console.error('Buyer verify code error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// POST /api/buyer-auth/resend-verification - Resend buyer verification code
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const buyer = await db.get('SELECT * FROM buyers WHERE email = $1', [email]);
    if (!buyer) {
      return res.status(404).json({ error: 'No buyer account found with this email' });
    }

    if (buyer.email_verified) {
      return res.json({
        success: true,
        message: 'Email is already verified. You can log in now.',
        alreadyVerified: true
      });
    }

    const resendState = getResendState(buyer);
    if (!resendState.canSend) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Too many verification attempts. Please wait before requesting another code.'
      });
    }

    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + EMAIL_VERIFICATION_CODE_EXPIRY_MINUTES * 60 * 1000);
    const sentAt = new Date();

    await db.run(
      `UPDATE buyers
       SET email_verification_token = $1,
           email_verification_expires = $2,
           email_verification_sent_count = $3,
           email_verification_last_sent_at = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        verificationCode,
        verificationExpires.toISOString(),
        resendState.sentCount + 1,
        sentAt.toISOString(),
        buyer.id
      ]
    );

    await sendBuyerVerificationEmail(buyer.email, buyer.name, verificationCode);

    res.json({
      success: true,
      message: 'Verification code sent! Please check your inbox.'
    });
  } catch (error) {
    console.error('Buyer resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
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
      const resetUrl = `${FRONTEND_BASE_URL}/buyer/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: getEmailSender(),
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

      await sendMailWithFallback(mailOptions);
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
      const mailOptions = {
        from: getEmailSender(),
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

      await sendMailWithFallback(mailOptions);
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

// POST /api/buyer-auth/logout - Clear HttpOnly cookie
router.post('/logout', (req, res) => {
  res.clearCookie('buyer_token', { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
  res.json({ message: 'Logged out successfully' });
});

module.exports = { router, authenticateBuyerToken };
