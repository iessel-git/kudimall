# Seller Verification Flow

## 🔍 Overview

The seller verification process in KudiMall involves multiple stages and two separate verification systems that work together to create trusted seller accounts.

---

## 📋 Complete Seller Onboarding Flow

### **Stage 1: Application Submission**

```
┌─────────────────────────────────────────────────────────────┐
│             STEP 1: Potential Seller Applies                │
└─────────────────────────────────────────────────────────────┘

User Action:
  └─► Navigate to /seller-application page
  └─► Fill out comprehensive application form:
      - Personal Information (name, email, phone)
      - Business Information (business name, type, address, tax ID)
      - Store Information (store name, description, categories)
      - Bank Information (account details for payments)
      - ID Verification (ID type and number)
      - Social Media (optional: Instagram, Facebook, Twitter, etc.)
      - Agreements (Terms & Conditions, Data Privacy)
  
System Action:
  └─► POST /api/seller-applications
  └─► Generate unique Application ID (APP-{timestamp}-{random})
  └─► Store application in `seller_applications` table
  └─► Set status to "pending"
  └─► Send email notification to admin (if configured)
  └─► Return application ID to user

Database:
  └─► seller_applications table
      - id, application_id, status='pending'
      - All submitted form data
      - created_at timestamp

Result: Application submitted, awaiting admin review
```

---

### **Stage 2: Admin Review & Approval**

```
┌─────────────────────────────────────────────────────────────┐
│           STEP 2: Admin Reviews Application                 │
└─────────────────────────────────────────────────────────────┘

Admin Action:
  └─► Navigate to /admin/applications
  └─► Filter applications by status (pending, reviewing, approved, rejected)
  └─► Click "View Details" on application
  └─► Review all submitted information:
      - Verify personal information
      - Check business legitimacy
      - Verify bank account details
      - Review ID information
      - Check social media presence
  └─► Add admin notes (optional)
  └─► Update status:
      ├─► "Mark as Reviewing" - application under review
      ├─► "Approve" - application accepted
      └─► "Reject" - application declined

System Action:
  └─► PATCH /api/seller-applications/:id
  └─► Update status in database
  └─► Record reviewed_by and reviewed_at timestamp
  └─► Save admin_notes

Database:
  └─► seller_applications table updated:
      - status changed to 'approved'
      - reviewed_by = admin name
      - reviewed_at = current timestamp
      - admin_notes stored

Result: Application status updated to "approved"
```

---

### **Stage 3: Create Seller Account** ⚠️ **MANUAL PROCESS**

```
┌─────────────────────────────────────────────────────────────┐
│         STEP 3: Create Seller Account (CURRENT GAP)         │
└─────────────────────────────────────────────────────────────┘

Current State: ⚠️ NO AUTOMATIC ACCOUNT CREATION

What SHOULD happen (not yet implemented):
  └─► When application status = 'approved'
  └─► Automatically create seller account:
      - Generate seller account in `sellers` table
      - Transfer data from seller_applications
      - Set is_verified = false (initially)
      - Set email_verified = false
      - Set trust_level = 0
      - Generate unique slug
      - Send welcome email with credentials
  
Current Workaround (Manual):
  └─► Admin must manually create seller account via:
      - Direct database INSERT, or
      - Use seller signup endpoint with application data
  
Database Schema:
  └─► sellers table fields:
      - id (auto-increment)
      - name (from first_name + last_name)
      - email (from application)
      - password (must be set)
      - shop_name (from store_name)
      - phone
      - location
      - description (from store_description)
      - is_verified = false
      - email_verified = false
      - trust_level = 0
      - slug (generated)
      - created_at

⚠️ IMPLEMENTATION NEEDED: Automated seller account creation
```

---

### **Stage 4: Email Verification**

```
┌─────────────────────────────────────────────────────────────┐
│            STEP 4: Seller Email Verification                │
└─────────────────────────────────────────────────────────────┘

System Action:
  └─► When seller account is created
  └─► Generate email verification token
  └─► Send verification email to seller
  └─► Token expires after 24-48 hours

Seller Action:
  └─► Receive email with verification link
  └─► Click verification link
  └─► Redirected to verification endpoint

System Action:
  └─► Validate token
  └─► Update sellers table:
      - email_verified = true
      - email_verification_token = null
      - email_verification_expires = null

Database:
  └─► sellers table updated:
      - email_verified = true

Result: Email verified, account partially active
```

---

### **Stage 5: Platform Verification (Verified Badge)**

```
┌─────────────────────────────────────────────────────────────┐
│          STEP 5: Platform Verification for Badge            │
└─────────────────────────────────────────────────────────────┘

Admin/System Action:
  └─► Review seller performance:
      - Check sales history
      - Review customer feedback
      - Verify product quality
      - Check compliance with policies
  
  └─► Manually update seller verification:
      - Set is_verified = true (for verified badge)
      - Set trust_level = 1-10 based on performance

SQL Command:
  UPDATE sellers 
  SET is_verified = true, trust_level = 5 
  WHERE id = [seller_id];

Verification Criteria:
  ├─► Minimum sales threshold met
  ├─► Positive customer reviews
  ├─► No policy violations
  ├─► Complete profile information
  ├─► Responsive to customer inquiries
  └─► Quality product listings

Database:
  └─► sellers table updated:
      - is_verified = true
      - trust_level = 5 (or appropriate level)

Result: Seller is now a "Verified Seller" with badge
```

---

## 🔑 Key Verification Fields

### In `sellers` Table:

| Field | Type | Purpose | How Set |
|-------|------|---------|---------|
| **email_verified** | boolean | Email ownership confirmation | Automated via email verification link |
| **is_verified** | boolean | Platform-verified seller badge | Manual by admin after performance review |
| **trust_level** | integer | Seller reputation score (0-10) | Manual by admin based on performance |

### Verification States:

```
┌─────────────────────────────────────────────────────────────┐
│                  Seller Account States                       │
└─────────────────────────────────────────────────────────────┘

State 1: New Account
  - email_verified = false
  - is_verified = false
  - trust_level = 0
  → Can login but limited features

State 2: Email Verified
  - email_verified = true
  - is_verified = false
  - trust_level = 0
  → Can list products, make sales

State 3: Verified Seller (Full Access)
  - email_verified = true
  - is_verified = true
  - trust_level = 4-10
  → Full features + verified badge + featured listings
```

---

## 🎯 Featured Sellers Criteria

To appear in the "Featured Sellers" section on homepage:

```sql
SELECT * FROM sellers 
WHERE is_verified = TRUE 
  AND trust_level >= 4
ORDER BY trust_level DESC, total_sales DESC
LIMIT 6;
```

**Requirements:**
- ✅ is_verified = true
- ✅ trust_level >= 4
- ✅ Active account (is_active = true)

---

## ⚠️ Current Implementation Gaps

### 1. **Automated Seller Account Creation**
**Status:** ❌ Not Implemented

**What's Missing:**
- Automatic creation of seller account when application is approved
- Transfer of data from seller_applications to sellers table
- Welcome email with login credentials
- Password generation and secure delivery

**Current Workaround:**
Sellers must separately sign up at `/seller-signup` after approval

**Recommended Fix:**
Create a webhook or automated process that:
1. Listens for application status change to "approved"
2. Creates seller account in sellers table
3. Generates secure temporary password
4. Sends welcome email with credentials
5. Links application_id to seller_id

---

### 2. **Email Verification System**
**Status:** ✅ Implemented (for new seller signups)

**How it Works:**
- Seller signs up at `/seller-signup`
- System generates verification token
- Email sent with verification link
- Clicking link sets email_verified = true

**Location:** `server/routes/auth.js`

---

### 3. **Platform Verification System**
**Status:** ⚠️ Manual Process Only

**Current Method:**
```sql
-- Admin must run SQL command manually
UPDATE sellers 
SET is_verified = true, trust_level = 5 
WHERE id = 1;
```

**Recommended Improvement:**
Create admin interface to:
- View seller performance metrics
- Set verification status with one click
- Adjust trust level based on criteria
- Add verification notes

---

## 📊 Database Tables Involved

### seller_applications
```sql
CREATE TABLE seller_applications (
  id SERIAL PRIMARY KEY,
  application_id VARCHAR(50) UNIQUE,
  status VARCHAR(20), -- pending, reviewing, approved, rejected
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  business_name VARCHAR(255),
  store_name VARCHAR(255),
  store_description TEXT,
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMP,
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### sellers
```sql
CREATE TABLE sellers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255),
  shop_name VARCHAR(255),
  slug VARCHAR(255) UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  trust_level INTEGER DEFAULT 0,
  email_verification_token VARCHAR(255),
  email_verification_expires TIMESTAMP,
  total_sales INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔧 How to Manually Verify a Seller

### Step 1: Check Seller ID
```sql
SELECT id, name, email, is_verified, email_verified, trust_level 
FROM sellers;
```

### Step 2: Verify Email (if needed)
```sql
UPDATE sellers 
SET email_verified = true,
    email_verification_token = null,
    email_verification_expires = null
WHERE id = [seller_id];
```

### Step 3: Grant Verified Status
```sql
UPDATE sellers 
SET is_verified = true,
    trust_level = 5
WHERE id = [seller_id];
```

### Step 4: Verify Changes
```sql
SELECT id, name, email, is_verified, email_verified, trust_level 
FROM sellers 
WHERE id = [seller_id];
```

---

## 🚀 Testing the Flow

### Test Seller Application:
```bash
# 1. Submit application
Navigate to: http://localhost:3000/seller-application
Fill form and submit

# 2. Check application in admin panel
Navigate to: http://localhost:3000/admin/applications
Review and approve application

# 3. Manually create seller account (current workaround)
Navigate to: http://localhost:3000/seller-signup
Create account with same email

# 4. Verify seller (manual SQL)
$env:PGPASSWORD = "@Memba3nyinaa2$"
psql -U postgres -d kudimall_dev -c "UPDATE sellers SET is_verified = true, trust_level = 5 WHERE email = 'seller@example.com';"

# 5. Verify featured sellers API
Invoke-RestMethod -Uri "http://localhost:5000/api/sellers?featured=true"
```

---

## 📝 Recommended Improvements

### Priority 1: Automated Account Creation
- Implement webhook on application approval
- Auto-create seller account with secure credentials
- Send welcome email with setup instructions

### Priority 2: Admin Verification Interface
- Create UI for seller verification management
- Display seller metrics and performance
- One-click verification with trust level setting
- Audit log for verification actions

### Priority 3: Progressive Trust System
- Automatic trust level increases based on:
  - Sales volume
  - Customer ratings
  - Response time
  - Policy compliance
- Automated verification for high-performing sellers

---

## 🔒 Security Considerations

1. **Email Verification:**
   - Required before seller can start selling
   - Token expires after 24 hours
   - One-time use tokens

2. **Platform Verification:**
   - Manual review by admin
   - Based on actual performance
   - Can be revoked if policies violated

3. **Trust Level:**
   - Affects search ranking
   - Determines featured placement
   - Unlocks premium features (4+)

---

## 📞 Support

**For Administrators:**
- Review application at: `/admin/applications`
- Manual verification via SQL commands above
- Contact dev team for automated verification setup

**For Sellers:**
- Apply at: `/seller-application`
- Check email for verification link after approval
- Contact admin for verification badge eligibility

---

**Last Updated:** February 12, 2026  
**Status:** Documentation Complete | Implementation Partial  
**Next Action:** Implement automated seller account creation from approved applications
