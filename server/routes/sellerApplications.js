const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../models/database');

// Configure email transporter
const createTransporter = () => {
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

// POST /api/seller-applications - Create new seller application
router.post('/', async (req, res) => {
  try {
    const formData = req.body;
    
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        message: 'First name, last name, and email are required' 
      });
    }

    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0f1115 0%, #1b1f2a 100%); 
                    color: #c8a45a; padding: 30px; text-align: center; }
          .section { background: #f6f1e6; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .section h3 { color: #0f1115; border-bottom: 2px solid #c8a45a; padding-bottom: 10px; }
          .field { margin: 10px 0; }
          .label { font-weight: bold; color: #0f1115; }
          .value { color: #666; margin-left: 10px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Seller Application Received</h1>
            <p>KudiMall Marketplace</p>
          </div>

          <div class="section">
            <h3>📋 Personal Information</h3>
            <div class="field">
              <span class="label">Name:</span>
              <span class="value">${formData.firstName} ${formData.lastName}</span>
            </div>
            <div class="field">
              <span class="label">Email:</span>
              <span class="value">${formData.email}</span>
            </div>
            <div class="field">
              <span class="label">Phone:</span>
              <span class="value">${formData.phone}</span>
            </div>
          </div>

          <div class="section">
            <h3>🏢 Business Information</h3>
            <div class="field">
              <span class="label">Business Name:</span>
              <span class="value">${formData.businessName}</span>
            </div>
            <div class="field">
              <span class="label">Business Type:</span>
              <span class="value">${formData.businessType}</span>
            </div>
            <div class="field">
              <span class="label">Address:</span>
              <span class="value">${formData.businessAddress}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}</span>
            </div>
            ${formData.taxId ? `
            <div class="field">
              <span class="label">Tax ID:</span>
              <span class="value">${formData.taxId}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <h3>🏪 Store Information</h3>
            <div class="field">
              <span class="label">Store Name:</span>
              <span class="value">${formData.storeName}</span>
            </div>
            <div class="field">
              <span class="label">Description:</span>
              <span class="value">${formData.storeDescription}</span>
            </div>
            <div class="field">
              <span class="label">Product Categories:</span>
              <span class="value">${formData.productCategories.join(', ')}</span>
            </div>
            ${formData.estimatedMonthlyVolume ? `
            <div class="field">
              <span class="label">Estimated Monthly Volume:</span>
              <span class="value">${formData.estimatedMonthlyVolume}</span>
            </div>
            ` : ''}
          </div>

          ${formData.instagramHandle || formData.facebookPage || formData.twitterHandle || formData.tiktokHandle || formData.websiteUrl ? `
          <div class="section">
            <h3>📱 Social Media Presence</h3>
            ${formData.instagramHandle ? `
            <div class="field">
              <span class="label">Instagram:</span>
              <span class="value">${formData.instagramHandle}</span>
            </div>
            ` : ''}
            ${formData.facebookPage ? `
            <div class="field">
              <span class="label">Facebook:</span>
              <span class="value">${formData.facebookPage}</span>
            </div>
            ` : ''}
            ${formData.twitterHandle ? `
            <div class="field">
              <span class="label">Twitter/X:</span>
              <span class="value">${formData.twitterHandle}</span>
            </div>
            ` : ''}
            ${formData.tiktokHandle ? `
            <div class="field">
              <span class="label">TikTok:</span>
              <span class="value">${formData.tiktokHandle}</span>
            </div>
            ` : ''}
            ${formData.websiteUrl ? `
            <div class="field">
              <span class="label">Website:</span>
              <span class="value">${formData.websiteUrl}</span>
            </div>
            ` : ''}
          </div>
          ` : ''}

          <div class="section">
            <h3>🏦 Banking Information</h3>
            <div class="field">
              <span class="label">Bank Name:</span>
              <span class="value">${formData.bankName}</span>
            </div>
            <div class="field">
              <span class="label">Account Holder:</span>
              <span class="value">${formData.accountHolderName}</span>
            </div>
            <div class="field">
              <span class="label">Account Number:</span>
              <span class="value">****${formData.accountNumber.slice(-4)}</span>
            </div>
            <div class="field">
              <span class="label">Routing Number:</span>
              <span class="value">${formData.routingNumber}</span>
            </div>
          </div>

          <div class="section">
            <h3>✅ Verification & Agreements</h3>
            <div class="field">
              <span class="label">ID Type:</span>
              <span class="value">${formData.idType}</span>
            </div>
            <div class="field">
              <span class="label">ID Number:</span>
              <span class="value">${formData.idNumber}</span>
            </div>
            <div class="field">
              <span class="label">Agreed to Terms:</span>
              <span class="value">${formData.agreeToTerms ? '✓ Yes' : '✗ No'}</span>
            </div>
            <div class="field">
              <span class="label">Agreed to Commission Structure:</span>
              <span class="value">${formData.agreeToCommission ? '✓ Yes' : '✗ No'}</span>
            </div>
            <div class="field">
              <span class="label">Agreed to Seller Standards:</span>
              <span class="value">${formData.agreeToStandards ? '✓ Yes' : '✗ No'}</span>
            </div>
          </div>

          <div class="footer">
            <p>This application was submitted on ${new Date().toLocaleString()}</p>
            <p>Please review and respond within 24-48 hours</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email (non-blocking - don't fail if email fails)
    try {
      const transporter = createTransporter();
      const mailOptions = {
        from: process.env.EMAIL_USER || 'noreply@kudimall.com',
        to: 'csetechnologies6@gmail.com',
        subject: `New Seller Application: ${formData.storeName}`,
        html: emailHtml,
        replyTo: formData.email
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Email notification sent successfully');
    } catch (emailError) {
      // Log email error but don't fail the application submission
      console.warn('⚠️ Failed to send email notification:', emailError.message);
      console.log('Application will still be saved to database');
    }

    // Generate application ID
    const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Save application to database
    await db.run(`
      INSERT INTO seller_applications (
        application_id, first_name, last_name, email, phone,
        business_name, business_type, business_address, city, state, zip_code, country, tax_id,
        store_name, store_description, product_categories, estimated_monthly_volume,
        instagram_handle, facebook_page, twitter_handle, tiktok_handle, website_url,
        bank_name, account_holder_name, account_number_last4, routing_number,
        id_type, id_number, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      applicationId,
      formData.firstName,
      formData.lastName,
      formData.email,
      formData.phone,
      formData.businessName,
      formData.businessType,
      formData.businessAddress,
      formData.city,
      formData.state,
      formData.zipCode,
      formData.country,
      formData.taxId,
      formData.storeName,
      formData.storeDescription,
      formData.productCategories ? formData.productCategories.join(',') : '',
      formData.estimatedMonthlyVolume,
      formData.instagramHandle,
      formData.facebookPage,
      formData.twitterHandle,
      formData.tiktokHandle,
      formData.websiteUrl,
      formData.bankName,
      formData.accountHolderName,
      formData.accountNumber ? formData.accountNumber.slice(-4) : '',
      formData.routingNumber,
      formData.idType,
      formData.idNumber,
      'pending'
    ]);

    // Log application (in production, save to database)
    console.log('✅ Seller application received:', {
      name: `${formData.firstName} ${formData.lastName}`,
      email: formData.email,
      storeName: formData.storeName,
      timestamp: new Date().toISOString()
    });

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! We will review your application within 24-48 hours.',
      applicationId: applicationId
    });

  } catch (error) {
    console.error('Error processing seller application:', error);
    
    // Send error response
    res.status(500).json({
      error: 'Failed to submit application',
      message: 'There was an error processing your application. Please try again or contact support.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/seller-applications - Get all applications (admin only)
router.get('/', async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    
    let query = 'SELECT * FROM seller_applications';
    const params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
      
      if (offset) {
        query += ' OFFSET ?';
        params.push(parseInt(offset));
      }
    }
    
    const applications = await db.all(query, params);
    
    // Get total count
    const countQuery = status 
      ? 'SELECT COUNT(*) as total FROM seller_applications WHERE status = ?' 
      : 'SELECT COUNT(*) as total FROM seller_applications';
    const countResult = await db.get(countQuery, status ? [status] : []);
    
    res.json({
      applications,
      total: countResult.total,
      limit: limit ? parseInt(limit) : null,
      offset: offset ? parseInt(offset) : 0
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// GET /api/seller-applications/:id - Get single application
router.get('/:id', async (req, res) => {
  try {
    const application = await db.get(
      'SELECT * FROM seller_applications WHERE id = ? OR application_id = ?',
      [req.params.id, req.params.id]
    );
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// PATCH /api/seller-applications/:id - Update application status
router.patch('/:id', async (req, res) => {
  try {
    const { status, admin_notes, reviewed_by } = req.body;
    
    const application = await db.get(
      'SELECT * FROM seller_applications WHERE id = ? OR application_id = ?',
      [req.params.id, req.params.id]
    );
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Valid status values
    const validStatuses = ['pending', 'reviewing', 'approved', 'rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    
    const updates = [];
    const params = [];
    
    if (status) {
      updates.push('status = ?');
      params.push(status);
      
      if (status === 'approved' || status === 'rejected') {
        updates.push('reviewed_at = CURRENT_TIMESTAMP');
      }
    }
    
    if (admin_notes !== undefined) {
      updates.push('admin_notes = ?');
      params.push(admin_notes);
    }
    
    if (reviewed_by) {
      updates.push('reviewed_by = ?');
      params.push(reviewed_by);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    params.push(application.id);
    
    await db.run(
      `UPDATE seller_applications SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    const updatedApplication = await db.get(
      'SELECT * FROM seller_applications WHERE id = ?',
      [application.id]
    );
    
    res.json({
      success: true,
      message: 'Application updated successfully',
      application: updatedApplication
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

module.exports = router;
