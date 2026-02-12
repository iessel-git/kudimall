# KudiMall Database Schema

This document provides a comprehensive overview of all databases, tables, and columns used in the KudiMall application.

## Database

**Database Name:** `kudimall_dev` (development) / configured via `DATABASE_URL` (production)  
**Database Type:** PostgreSQL  
**Connection:** Configured in `server/models/database.js`

---

## Tables Overview

The KudiMall database consists of **17 main tables**:

1. [users](#1-users)
2. [sellers](#2-sellers)
3. [categories](#3-categories)
4. [products](#4-products)
5. [carts](#5-carts)
6. [cart_items](#6-cart_items)
7. [coupons](#7-coupons)
8. [coupon_usage](#8-coupon_usage)
9. [orders](#9-orders)
10. [order_items](#10-order_items)
11. [inventory_alerts](#11-inventory_alerts)
12. [payment_webhooks](#12-payment_webhooks)
13. [buyers](#13-buyers)
14. [delivery_users](#14-delivery_users)
15. [reviews](#15-reviews)
16. [follows](#16-follows)
17. [seller_applications](#17-seller_applications)

---

## Table Definitions

### 1. users

**Purpose:** Stores user account information.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique user identifier |
| name | VARCHAR(100) | NOT NULL | User's full name |
| email | VARCHAR(100) | UNIQUE, NOT NULL | User's email address |
| password | VARCHAR(255) | NOT NULL | Hashed password |
| phone | VARCHAR(20) | | User's phone number |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `email`

---

### 2. sellers

**Purpose:** Stores seller/vendor information and their shop details.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique seller identifier |
| user_id | INT | REFERENCES users(id) ON DELETE CASCADE | Link to user account |
| shop_name | VARCHAR(100) | NOT NULL | Name of the shop |
| address | TEXT | | Physical shop address |
| is_verified | BOOLEAN | DEFAULT FALSE | Seller verification status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Seller registration timestamp |
| name | VARCHAR(255) | | Seller's full name |
| slug | VARCHAR(255) | UNIQUE | URL-friendly identifier |
| email | VARCHAR(255) | UNIQUE | Seller's email address |
| phone | VARCHAR(50) | | Seller's phone number |
| location | TEXT | | Seller's location details |
| description | TEXT | | Shop description |
| logo_url | TEXT | | URL to shop logo |
| banner_url | TEXT | | URL to shop banner |
| trust_level | INTEGER | DEFAULT 0 | Seller trust/reputation score |
| password | VARCHAR(255) | | Hashed password for direct seller login |
| email_verified | BOOLEAN | DEFAULT FALSE | Email verification status |
| email_verification_token | VARCHAR(255) | | Token for email verification |
| email_verification_expires | TIMESTAMP | | Expiration time for verification token |
| last_login | TIMESTAMP | | Last login timestamp |
| total_sales | INTEGER | DEFAULT 0 | Total number of sales |
| rating | NUMERIC(3,2) | | Average seller rating |
| review_count | INTEGER | DEFAULT 0 | Number of reviews received |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |
| is_active | BOOLEAN | DEFAULT TRUE | Seller account active status |
| bank_name | VARCHAR(100) | | Bank name for payments |
| account_holder | VARCHAR(100) | | Bank account holder name |
| account_number | VARCHAR(50) | | Bank account number |
| routing_number | VARCHAR(50) | | Bank routing number |
| government_id | VARCHAR(100) | | Government ID type |
| id_number | VARCHAR(100) | | Government ID number |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `slug`
- UNIQUE constraint on `email`
- INDEX on `email` (idx_sellers_email)
- INDEX on `slug` (idx_sellers_slug)
- INDEX on `email_verified` (idx_sellers_email_verified)

---

### 3. categories

**Purpose:** Stores product categories for organization.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique category identifier |
| name | VARCHAR(100) | NOT NULL | Category name |
| description | TEXT | | Category description |
| slug | VARCHAR(255) | UNIQUE | URL-friendly identifier |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `slug`
- INDEX on `slug` (idx_categories_slug)

**Seed Data:**
- Electronics
- Fashion
- Groceries

---

### 4. products

**Purpose:** Stores product listings from sellers.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique product identifier |
| seller_id | INT | REFERENCES sellers(id) ON DELETE CASCADE | Product owner |
| category_id | INT | REFERENCES categories(id) ON DELETE SET NULL | Product category |
| name | VARCHAR(100) | NOT NULL | Product name |
| description | TEXT | | Product description |
| price | NUMERIC(10,2) | NOT NULL | Product price |
| stock | INT | DEFAULT 0 | Available stock quantity |
| image_url | TEXT | | Primary product image URL |
| is_available | BOOLEAN | DEFAULT TRUE | Product availability status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Product creation timestamp |
| slug | VARCHAR(255) | | URL-friendly identifier |
| views | INTEGER | DEFAULT 0 | Number of product views |
| sales | INTEGER | DEFAULT 0 | Number of sales |
| images | JSONB | | Array of product image URLs |
| is_featured | BOOLEAN | DEFAULT FALSE | Featured product status |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `(seller_id, slug)` (products_seller_slug_unique)
- INDEX on `slug` (idx_products_slug)
- INDEX on `seller_id` (idx_products_seller_id)
- INDEX on `category_id` (idx_products_category_id)
- INDEX on `is_available` (idx_products_is_available)
- INDEX on `is_featured` (idx_products_is_featured)

---

### 5. carts

**Purpose:** Stores shopping carts for users.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique cart identifier |
| user_id | INT | REFERENCES users(id) ON DELETE CASCADE | Cart owner |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Cart creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`

---

### 6. cart_items

**Purpose:** Stores individual items in shopping carts.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique cart item identifier |
| cart_id | INT | REFERENCES carts(id) ON DELETE CASCADE | Parent cart |
| product_id | INT | REFERENCES products(id) ON DELETE CASCADE | Product in cart |
| quantity | INT | NOT NULL, DEFAULT 1 | Item quantity |
| price | NUMERIC(10,2) | NOT NULL | Item price at time of adding |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Item added timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `(cart_id, product_id)` - Ensures each product appears only once per cart; quantity updates modify the existing record

---

### 7. coupons

**Purpose:** Stores discount coupons and promotional codes.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique coupon identifier |
| code | VARCHAR(50) | UNIQUE, NOT NULL | Coupon code |
| discount_type | VARCHAR(20) | CHECK (discount_type IN ('percentage', 'fixed')) | Type of discount |
| discount_value | NUMERIC(10,2) | NOT NULL | Discount amount/percentage |
| min_purchase | NUMERIC(10,2) | DEFAULT 0 | Minimum purchase amount |
| max_discount | NUMERIC(10,2) | | Maximum discount amount |
| usage_limit | INT | | Maximum number of uses |
| used_count | INT | DEFAULT 0 | Current usage count |
| valid_from | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Coupon valid from date |
| valid_until | TIMESTAMP | | Coupon expiration date |
| is_active | BOOLEAN | DEFAULT TRUE | Coupon active status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Coupon creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `code`

**Seed Data:**
- WELCOME10 (10% off, min GHS 50)
- FIRST20 (GHS 20 off, min GHS 100)
- FREESHIP (GHS 5 off)

*Note: Currency values in the database are stored as numeric amounts. The Ghanaian Cedi (GHS) is the primary currency used in the application.*

---

### 8. coupon_usage

**Purpose:** Tracks coupon usage by users.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique usage record identifier |
| coupon_id | INT | REFERENCES coupons(id) ON DELETE CASCADE | Used coupon |
| user_id | INT | REFERENCES users(id) ON DELETE CASCADE | User who used coupon |
| order_id | INT | | Associated order |
| discount_amount | NUMERIC(10,2) | NOT NULL | Actual discount applied |
| used_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Usage timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `(user_id, coupon_id, order_id)`

---

### 9. orders

**Purpose:** Stores customer orders and their status.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique order identifier |
| user_id | INT | REFERENCES users(id) ON DELETE SET NULL | Ordering user (legacy) |
| seller_id | INT | REFERENCES sellers(id) ON DELETE SET NULL | Order seller |
| subtotal | NUMERIC(10,2) | NOT NULL | Order subtotal |
| discount_amount | NUMERIC(10,2) | DEFAULT 0.00 | Discount applied |
| coupon_id | INT | REFERENCES coupons(id) ON DELETE SET NULL | Applied coupon |
| total | NUMERIC(10,2) | NOT NULL | Order total amount |
| status | VARCHAR(30) | DEFAULT 'pending' | Order status |
| escrow_status | VARCHAR(20) | DEFAULT 'held' | Escrow/payment hold status |
| payment_provider | VARCHAR(50) | DEFAULT 'hubtel' | Payment service provider |
| payment_reference | VARCHAR(100) | UNIQUE | Payment reference number |
| payment_status | VARCHAR(20) | DEFAULT 'pending' | Payment status |
| delivery_confirmed_at | TIMESTAMP | | Delivery confirmation timestamp |
| driver_confirmed | BOOLEAN | DEFAULT FALSE | Driver confirmation status |
| customer_confirmed | BOOLEAN | DEFAULT FALSE | Customer confirmation status |
| cancellation_reason | TEXT | | Reason for cancellation |
| cancelled_by | VARCHAR(20) | | Who cancelled the order |
| cancelled_at | TIMESTAMP | | Cancellation timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Order creation timestamp |
| order_number | VARCHAR(50) | UNIQUE | Human-readable order number |
| buyer_id | INTEGER | REFERENCES buyers(id) ON DELETE SET NULL | Buyer who placed order |
| buyer_name | VARCHAR(255) | | Buyer's name |
| buyer_email | VARCHAR(255) | | Buyer's email |
| buyer_phone | VARCHAR(50) | | Buyer's phone |
| product_id | INTEGER | REFERENCES products(id) ON DELETE SET NULL | Ordered product (legacy) |
| quantity | INTEGER | DEFAULT 1 | Order quantity (legacy) |
| total_amount | NUMERIC(10,2) | | Total order amount |
| delivery_address | TEXT | | Delivery address |
| tracking_number | VARCHAR(255) | | Shipping tracking number |
| shipped_at | TIMESTAMP | | Shipment timestamp |
| delivered_at | TIMESTAMP | | Delivery timestamp |
| buyer_confirmed_at | TIMESTAMP | | Buyer confirmation timestamp |
| delivery_signature_name | VARCHAR(255) | | Name of person who signed |
| delivery_signature_data | TEXT | | Signature data/image |
| delivery_proof_type | VARCHAR(50) | | Type of delivery proof |
| delivery_proof_url | TEXT | | URL to delivery proof |
| delivery_photo_uploaded_by | VARCHAR(50) | | Who uploaded delivery photo |
| delivery_signature_uploaded_by | VARCHAR(50) | | Who uploaded signature |
| delivery_person_id | INTEGER | | Delivery person ID |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `payment_reference`
- UNIQUE constraint on `order_number`
- INDEX on `order_number` (idx_orders_order_number)
- INDEX on `buyer_id` (idx_orders_buyer_id)
- INDEX on `buyer_email` (idx_orders_buyer_email)
- INDEX on `seller_id` (idx_orders_seller_id)
- INDEX on `status` (idx_orders_status)
- INDEX on `delivery_person_id` (idx_orders_delivery_person_id)

---

### 10. order_items

**Purpose:** Stores individual items within orders.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique order item identifier |
| order_id | INT | REFERENCES orders(id) ON DELETE CASCADE | Parent order |
| product_id | INT | REFERENCES products(id) ON DELETE SET NULL | Ordered product |
| quantity | INT | NOT NULL | Item quantity |
| price | NUMERIC(10,2) | NOT NULL | Item price at time of order |

**Indexes:**
- PRIMARY KEY on `id`

---

### 11. inventory_alerts

**Purpose:** Stores inventory alerts for low/out of stock products.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique alert identifier |
| product_id | INT | REFERENCES products(id) ON DELETE CASCADE | Product with alert |
| seller_id | INT | REFERENCES sellers(id) ON DELETE CASCADE | Seller to notify |
| alert_type | VARCHAR(20) | CHECK (alert_type IN ('low_stock', 'out_of_stock')) | Type of alert |
| threshold | INT | DEFAULT 5 | Stock threshold for alert |
| is_read | BOOLEAN | DEFAULT FALSE | Alert read status |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Alert creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`

---

### 12. payment_webhooks

**Purpose:** Stores incoming payment webhook events from payment providers.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique webhook identifier |
| provider | VARCHAR(50) | NOT NULL | Payment provider name |
| event_type | VARCHAR(100) | NOT NULL | Type of webhook event |
| reference | VARCHAR(100) | | Payment reference |
| payload | JSONB | NOT NULL | Full webhook payload |
| status | VARCHAR(20) | DEFAULT 'pending' | Processing status |
| error_message | TEXT | | Error message if failed |
| processed_at | TIMESTAMP | | Processing timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Webhook received timestamp |

**Indexes:**
- PRIMARY KEY on `id`

---

### 13. buyers

**Purpose:** Stores buyer/customer account information.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique buyer identifier |
| name | VARCHAR(255) | NOT NULL | Buyer's full name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Buyer's email address |
| password | VARCHAR(255) | NOT NULL | Hashed password |
| phone | VARCHAR(50) | | Buyer's phone number |
| default_address | TEXT | | Default delivery address |
| city | VARCHAR(100) | | City |
| state | VARCHAR(100) | | State/region |
| zip_code | VARCHAR(20) | | ZIP/postal code |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| reset_token | VARCHAR(255) | | Password reset token |
| reset_token_expiry | TIMESTAMP | | Reset token expiration |
| last_login | TIMESTAMP | | Last login timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `email`
- INDEX on `email` (idx_buyers_email)

---

### 14. delivery_users

**Purpose:** Stores delivery personnel account information.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique delivery user identifier |
| name | VARCHAR(255) | NOT NULL | Delivery person's name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| password | VARCHAR(255) | NOT NULL | Hashed password |
| phone | VARCHAR(50) | | Phone number |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| last_login | TIMESTAMP | | Last login timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `email`
- INDEX on `email` (idx_delivery_users_email)

---

### 15. reviews

**Purpose:** Stores product and seller reviews from buyers.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique review identifier |
| product_id | INTEGER | REFERENCES products(id) ON DELETE CASCADE | Reviewed product |
| seller_id | INTEGER | REFERENCES sellers(id) ON DELETE CASCADE | Reviewed seller |
| buyer_name | VARCHAR(255) | NOT NULL | Name of reviewer |
| rating | INTEGER | NOT NULL, CHECK (rating >= 1 AND rating <= 5) | Rating value (1-5 stars) |
| comment | TEXT | | Review comment/text |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Review creation timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- INDEX on `product_id` (idx_reviews_product_id)
- INDEX on `seller_id` (idx_reviews_seller_id)

---

### 16. follows

**Purpose:** Tracks buyer-seller following relationships.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique follow identifier |
| buyer_email | VARCHAR(255) | NOT NULL | Following buyer's email |
| seller_id | INTEGER | REFERENCES sellers(id) ON DELETE CASCADE | Followed seller |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Follow timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `(buyer_email, seller_id)` (follows_buyer_email_seller_id_unique)
- INDEX on `buyer_email` (idx_follows_buyer_email)
- INDEX on `seller_id` (idx_follows_seller_id)

---

### 17. seller_applications

**Purpose:** Stores seller application submissions for approval.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Unique application identifier |
| application_id | VARCHAR(100) | UNIQUE, NOT NULL | Human-readable application ID |
| first_name | VARCHAR(100) | NOT NULL | Applicant's first name |
| last_name | VARCHAR(100) | NOT NULL | Applicant's last name |
| email | VARCHAR(255) | NOT NULL | Applicant's email |
| phone | VARCHAR(50) | NOT NULL | Applicant's phone number |
| business_name | VARCHAR(255) | NOT NULL | Business/company name |
| business_type | VARCHAR(100) | NOT NULL | Type of business |
| business_address | TEXT | NOT NULL | Business address |
| city | VARCHAR(100) | NOT NULL | City |
| state | VARCHAR(100) | NOT NULL | State/region |
| zip_code | VARCHAR(20) | NOT NULL | ZIP/postal code |
| country | VARCHAR(100) | NOT NULL | Country |
| tax_id | VARCHAR(100) | | Tax identification number |
| store_name | VARCHAR(255) | NOT NULL | Desired store name |
| store_description | TEXT | NOT NULL | Store description |
| product_categories | TEXT | | Product categories to sell |
| estimated_monthly_volume | VARCHAR(50) | | Estimated sales volume |
| instagram_handle | VARCHAR(255) | | Instagram handle |
| facebook_page | VARCHAR(255) | | Facebook page URL |
| twitter_handle | VARCHAR(255) | | Twitter handle |
| tiktok_handle | VARCHAR(255) | | TikTok handle |
| website_url | TEXT | | Business website URL |
| bank_name | VARCHAR(255) | NOT NULL | Bank name |
| account_holder_name | VARCHAR(255) | NOT NULL | Bank account holder name |
| account_number_last4 | VARCHAR(4) | NOT NULL | Last 4 digits of account |
| routing_number | VARCHAR(50) | NOT NULL | Bank routing number |
| id_type | VARCHAR(50) | NOT NULL | Government ID type |
| id_number | VARCHAR(100) | NOT NULL | Government ID number |
| status | VARCHAR(50) | DEFAULT 'pending' | Application status |
| admin_notes | TEXT | | Admin review notes |
| reviewed_by | VARCHAR(255) | | Admin who reviewed |
| reviewed_at | TIMESTAMP | | Review timestamp |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Application submission timestamp |
| updated_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE constraint on `application_id`
- INDEX on `email` (idx_seller_applications_email)
- INDEX on `status` (idx_seller_applications_status)
- INDEX on `application_id` (idx_seller_applications_application_id)

---

## Entity Relationships

### Primary Relationships

1. **users → sellers**: One-to-one (user_id in sellers)
2. **sellers → products**: One-to-many (seller_id in products)
3. **categories → products**: One-to-many (category_id in products)
4. **users → carts**: One-to-one (user_id in carts)
5. **carts → cart_items**: One-to-many (cart_id in cart_items)
6. **products → cart_items**: One-to-many (product_id in cart_items)
7. **coupons → orders**: One-to-many (coupon_id in orders)
8. **buyers → orders**: One-to-many (buyer_id in orders)
9. **sellers → orders**: One-to-many (seller_id in orders)
10. **orders → order_items**: One-to-many (order_id in order_items)
11. **products → order_items**: One-to-many (product_id in order_items)
12. **coupons → coupon_usage**: One-to-many (coupon_id in coupon_usage)
13. **users → coupon_usage**: One-to-many (user_id in coupon_usage)
14. **products → inventory_alerts**: One-to-many (product_id in inventory_alerts)
15. **sellers → inventory_alerts**: One-to-many (seller_id in inventory_alerts)
16. **products → reviews**: One-to-many (product_id in reviews)
17. **sellers → reviews**: One-to-many (seller_id in reviews)
18. **sellers → follows**: One-to-many (seller_id in follows)

---

## Migration Files

The database schema is created and maintained through the following migration files:

1. **init_schema_postgres.sql**: Initial schema creation with core tables
2. **add_missing_columns.sql**: Adds additional columns to existing tables and creates new tables (buyers, delivery_users, reviews, follows, seller_applications)
3. **fix_seller_applications.sql**: Fixes and adds missing columns to seller_applications and related tables
4. **migrateSellerBankIdColumns.sql**: Adds banking and identification columns to sellers table

---

## Notes

- All timestamps use PostgreSQL's `TIMESTAMP` type with `DEFAULT CURRENT_TIMESTAMP`
- All ID fields use `SERIAL` (auto-incrementing integer)
- Foreign key constraints use appropriate `ON DELETE` actions (CASCADE or SET NULL)
- Currency values use `NUMERIC(10,2)` for precision
- JSON data is stored using `JSONB` type for efficient querying
- Email fields are case-sensitive and should be normalized in application code
- The database supports both legacy `users` table and newer separate `buyers`, `sellers`, and `delivery_users` tables

---

## Database Connection

Connection is managed through `server/models/database.js` using the `pg` Pool:

- **Production**: Uses `DATABASE_URL` environment variable with SSL
- **Development**: Uses individual connection parameters (DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT)

Default development credentials:
- Host: localhost
- Port: 5432
- Database: kudimall_dev
- User: postgres
