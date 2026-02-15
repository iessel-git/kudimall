const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../models/database');
const { sendMailWithFallback, getFrontendBaseUrl, getEmailSender } = require('../utils/emailConfig');

// GET /api/seller-applications/info - Get information about seller applications API
router.get('/info', (req, res) => {
  const baseUrl = getFrontendBaseUrl();
  
  res.json({
    name: 'Seller Applications API',
    description: 'Manage seller applications for KudiMall marketplace',
    endpoints: {
      create: {
        method: 'POST',
        path: '/api/seller-applications',
        description: 'Submit a new seller application'
      },
      list: {
        method: 'GET',
        path: '/api/seller-applications',
        description: 'Get all seller applications (admin only)',
        queryParams: {
          status: 'Filter by status (pending, reviewing, approved, rejected)',
          limit: 'Number of results per page',
          offset: 'Pagination offset'
        }
      },
      get: {
        method: 'GET',
        path: '/api/seller-applications/:id',
        description: 'Get a single application by ID or application_id'
      },
      update: {
        method: 'PATCH',
        path: '/api/seller-applications/:id',
        description: 'Update application status (admin only)',
        body: {
          status: 'New status (pending, reviewing, approved, rejected)',
          admin_notes: 'Admin notes about the application',
          reviewed_by: 'Name of admin who reviewed'
        }
      }
    },
    adminInterface: {
      url: `${baseUrl}/admin/applications`,
      description: 'Web interface for managing seller applications',
      features: [
        'View all applications',
        'Filter by status',
        'View detailed application information',
        'Approve or reject applications',
        'Add admin notes'
      ]
    }
  });
});

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
      const mailOptions = {
        from: getEmailSender(),
        to: 'csetechnologies6@gmail.com',
        subject: `New Seller Application: ${formData.storeName}`,
        html: emailHtml,
        replyTo: formData.email
      };

      await sendMailWithFallback(mailOptions);
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29)
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
      query += ' WHERE status = $1';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit));
      
      if (offset) {
        query += ` OFFSET $${params.length + 1}`;
        params.push(parseInt(offset));
      }
    }
    
    const applications = await db.all(query, params);
    
    // Get total count
    const countQuery = status 
      ? 'SELECT COUNT(*) as total FROM seller_applications WHERE status = $1' 
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
      'SELECT * FROM seller_applications WHERE id = $1 OR application_id = $2',
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

// Helper function to generate slug
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Helper function to create seller account from approved application
const createSellerAccountFromApplication = async (application) => {
  try {
    // Check if seller already exists with this email
    const existingSeller = await db.get(
      'SELECT id FROM sellers WHERE email = $1',
      [application.email]
    );

    if (existingSeller) {
      console.log(`⚠️ Seller account already exists for email: ${application.email}`);
      return {
        success: false,
        message: 'Seller account already exists',
        sellerId: existingSeller.id
      };
    }

    // Generate temporary password (seller must reset on first login)
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Generate unique slug from store name
    let slug = generateSlug(application.store_name);
    let slugExists = await db.get('SELECT id FROM sellers WHERE slug = $1', [slug]);
    let counter = 1;
    
    while (slugExists) {
      slug = `${generateSlug(application.store_name)}-${counter}`;
      slugExists = await db.get('SELECT id FROM sellers WHERE slug = $1', [slug]);
      counter++;
    }

    // Generate email verification code
    const verificationCode = String(Math.floor(100000 + Math.random() * 900000));
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);
    const verificationSentAt = new Date();

    // Create seller account
    const fullName = `${application.first_name} ${application.last_name}`;
    const result = await db.run(`
      INSERT INTO sellers (
        name, slug, email, password, phone, location, description, shop_name, 
        is_active, is_verified, email_verified, trust_level,
        email_verification_token, email_verification_expires,
        email_verification_sent_count, email_verification_last_sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, FALSE, FALSE, 0, $9, $10, $11, $12)
    `, [
      fullName,
      slug,
      application.email,
      hashedPassword,
      application.phone,
      `${application.city}, ${application.state}, ${application.country}`,
      application.store_description,
      application.store_name,
      verificationCode,
      verificationExpires.toISOString(),
      1,
      verificationSentAt.toISOString()
    ]);

    // Send welcome email with credentials
    const baseUrl = getFrontendBaseUrl();
    const loginUrl = `${baseUrl}/seller/login`;
    const verifyUrl = `${baseUrl}/seller/verify-code`;

    try {
      await sendMailWithFallback({
        from: getEmailSender(),
        to: application.email,
        subject: '🎉 Welcome to KudiMall - Your Seller Application Approved!',
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
              .credentials { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #c8a45a; }
              .button { display: inline-block; background: #c8a45a; color: white; 
                        padding: 12px 30px; text-decoration: none; border-radius: 5px; 
                        font-weight: bold; margin: 10px 5px; }
              .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Congratulations ${fullName}!</h1>
                <p>Your seller application has been approved</p>
              </div>
              <div class="content">
                <p>Welcome to the KudiMall marketplace! Your application for <strong>${application.store_name}</strong> has been approved.</p>
                
                <div class="credentials">
                  <h3>🔐 Your Login Credentials</h3>
                  <p><strong>Email:</strong> ${application.email}</p>
                  <p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p>
                </div>

                <div class="warning">
                  <strong>⚠️ Important Security Steps:</strong>
                  <ol>
                    <li>Verify your email address using the code below</li>
                    <li>Login with your temporary password</li>
                    <li>Change your password immediately after first login</li>
                  </ol>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <div style="display: inline-block; background: #0f1115; color: #c8a45a; padding: 14px 24px; border-radius: 8px; font-size: 24px; letter-spacing: 4px; font-weight: bold;">
                    ${verificationCode}
                  </div>
                  <p style="margin-top: 12px;">Code expires in 10 minutes.</p>
                  <a href="${verifyUrl}" class="button">✉️ Enter Verification Code</a>
                  <a href="${loginUrl}" class="button">🚀 Login to Dashboard</a>
                </div>

                <h3>📋 Next Steps:</h3>
                <ul>
                  <li>✅ Verify your email address with the code</li>
                  <li>✅ Login and change your password</li>
                  <li>✅ Complete your seller profile</li>
                  <li>✅ Add your products</li>
                  <li>✅ Start selling!</li>
                </ul>

                <p style="margin-top: 30px; font-size: 14px; color: #666;">
                  If you have any questions, please contact our support team.
                </p>
              </div>
            </div>
          </body>
          </html>
        `
      });
      console.log(`✅ Welcome email sent to: ${application.email}`);
    } catch (emailError) {
      console.warn('⚠️ Failed to send welcome email:', emailError.message);
    }

    return {
      success: true,
      message: 'Seller account created successfully',
      sellerId: result.id,
      tempPassword,
      slug
    };
  } catch (error) {
    console.error('Error creating seller account:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// PATCH /api/seller-applications/:id - Update application status
router.patch('/:id', async (req, res) => {
  try {
    const { status, admin_notes, reviewed_by } = req.body;
    
    const application = await db.get(
      'SELECT * FROM seller_applications WHERE id = $1 OR application_id = $2',
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
      updates.push(`status = $${params.length + 1}`);
      params.push(status);
      
      if (status === 'approved' || status === 'rejected') {
        updates.push('reviewed_at = CURRENT_TIMESTAMP');
      }
    }
    
    if (admin_notes !== undefined) {
      updates.push(`admin_notes = $${params.length + 1}`);
      params.push(admin_notes);
    }
    
    if (reviewed_by) {
      updates.push(`reviewed_by = $${params.length + 1}`);
      params.push(reviewed_by);
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    params.push(application.id);
    
    await db.run(
      `UPDATE seller_applications SET ${updates.join(', ')} WHERE id = $${params.length}`,
      params
    );
    
    const updatedApplication = await db.get(
      'SELECT * FROM seller_applications WHERE id = $1',
      [application.id]
    );

    // 🆕 AUTOMATED SELLER ACCOUNT CREATION
    let sellerAccountResult = null;
    if (status === 'approved' && application.status !== 'approved') {
      console.log(`🔄 Application approved! Creating seller account for: ${application.email}`);
      sellerAccountResult = await createSellerAccountFromApplication(application);
      
      if (sellerAccountResult.success) {
        console.log(`✅ Seller account created! ID: ${sellerAccountResult.sellerId}, Slug: ${sellerAccountResult.slug}`);
      } else {
        console.warn(`⚠️ Could not create seller account: ${sellerAccountResult.message}`);
      }
    }
    
    res.json({
      success: true,
      message: 'Application updated successfully',
      application: updatedApplication,
      sellerAccount: sellerAccountResult
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

module.exports = router;
