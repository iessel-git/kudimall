# Database Migration Summary

## Migration Completed Successfully ✅

This migration adds all missing columns required by the KudiMall API routes to the PostgreSQL database.

## Files Created

1. `/home/runner/work/kudimall/kudimall/server/migrations/add_missing_columns.sql` - Main migration file
2. `/home/runner/work/kudimall/kudimall/server/migrations/fix_seller_applications.sql` - Supplementary migration for existing tables

## Tables Modified/Created

### 1. **sellers** table (19 new columns)
Added columns:
- `name` - Seller's full name
- `slug` - Unique URL-friendly identifier
- `email` - Email address (unique)
- `phone` - Phone number
- `location` - Business location
- `description` - Seller bio/description
- `logo_url` - Logo image URL
- `banner_url` - Banner image URL
- `trust_level` - Trust score (0-5)
- `password` - Hashed password
- `email_verified` - Email verification status
- `email_verification_token` - Verification token
- `email_verification_expires` - Token expiry timestamp
- `last_login` - Last login timestamp
- `total_sales` - Total number of sales
- `rating` - Average rating
- `review_count` - Number of reviews
- `updated_at` - Last update timestamp
- `is_active` - Account active status

### 2. **products** table (6 new columns)
Added columns:
- `slug` - Unique URL-friendly product identifier
- `views` - Number of product views
- `sales` - Number of sales
- `images` - JSONB array of image URLs
- `is_featured` - Featured product flag
- `updated_at` - Last update timestamp

### 3. **orders** table (21 new columns)
Added columns:
- `order_number` - Unique order identifier (e.g., KM-12345678)
- `buyer_id` - Reference to buyers table
- `buyer_name` - Guest buyer name
- `buyer_email` - Buyer email address
- `buyer_phone` - Buyer phone number
- `product_id` - Reference to products table
- `quantity` - Order quantity
- `total_amount` - Order total
- `delivery_address` - Delivery address
- `tracking_number` - Shipment tracking number
- `shipped_at` - Shipment timestamp
- `delivered_at` - Delivery timestamp
- `buyer_confirmed_at` - Buyer confirmation timestamp
- `delivery_signature_name` - Signature name
- `delivery_signature_data` - Signature image data
- `delivery_proof_type` - Type of delivery proof (photo/signature/both)
- `delivery_proof_url` - Delivery photo URL
- `delivery_photo_uploaded_by` - Who uploaded photo (seller/delivery)
- `delivery_signature_uploaded_by` - Who uploaded signature (buyer/seller/delivery)
- `delivery_person_id` - Reference to delivery_users table
- `updated_at` - Last update timestamp

### 4. **buyers** table (CREATED - 14 columns)
New table with columns:
- `id` - Primary key
- `name` - Buyer's full name
- `email` - Email address (unique)
- `password` - Hashed password
- `phone` - Phone number
- `default_address` - Default delivery address
- `city` - City
- `state` - State/Region
- `zip_code` - Postal code
- `is_active` - Account active status
- `reset_token` - Password reset token
- `reset_token_expiry` - Reset token expiry
- `last_login` - Last login timestamp
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### 5. **delivery_users** table (CREATED - 8 columns)
New table with columns:
- `id` - Primary key
- `name` - Delivery person's name
- `email` - Email address (unique)
- `password` - Hashed password
- `phone` - Phone number
- `is_active` - Account active status
- `last_login` - Last login timestamp
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp

### 6. **reviews** table (CREATED - 6 columns)
New table with columns:
- `id` - Primary key
- `product_id` - Reference to products table
- `seller_id` - Reference to sellers table
- `buyer_name` - Reviewer name
- `rating` - Rating (1-5)
- `comment` - Review text
- `created_at` - Review timestamp

### 7. **follows** table (CREATED - 3 columns)
New table with columns:
- `id` - Primary key
- `buyer_email` - Follower email
- `seller_id` - Reference to sellers table
- `created_at` - Follow timestamp

### 8. **seller_applications** table (CREATED - 34 columns)
New table with columns:
- `id` - Primary key
- `application_id` - Unique application identifier
- Personal Information: `first_name`, `last_name`, `email`, `phone`
- Business Information: `business_name`, `business_type`, `business_address`, `city`, `state`, `zip_code`, `country`, `tax_id`
- Store Information: `store_name`, `store_description`, `product_categories`, `estimated_monthly_volume`
- Social Media: `instagram_handle`, `facebook_page`, `twitter_handle`, `tiktok_handle`, `website_url`
- Banking: `bank_name`, `account_holder_name`, `account_number_last4`, `routing_number`
- Verification: `id_type`, `id_number`
- Admin fields: `status`, `admin_notes`, `reviewed_by`, `reviewed_at`
- Timestamps: `created_at`, `updated_at`

### 9. **categories** table (1 new column)
Added columns:
- `slug` - Unique URL-friendly identifier

## Indexes Created

### Performance indexes added:
- `sellers`: email, slug, email_verified
- `products`: slug, seller_id, category_id, is_available, is_featured
- `orders`: order_number, buyer_id, buyer_email, seller_id, status, delivery_person_id
- `buyers`: email
- `delivery_users`: email
- `reviews`: product_id, seller_id
- `follows`: buyer_email, seller_id
- `seller_applications`: email, status, application_id
- `categories`: slug

## Unique Constraints Added

- `sellers.email` - Unique email addresses
- `sellers.slug` - Unique seller slugs
- `products(seller_id, slug)` - Unique product slugs per seller
- `orders.order_number` - Unique order numbers
- `buyers.email` - Unique buyer emails
- `delivery_users.email` - Unique delivery user emails
- `follows(buyer_email, seller_id)` - Unique follower-seller combinations
- `seller_applications.application_id` - Unique application IDs
- `categories.slug` - Unique category slugs

## Foreign Key Constraints

- `orders.buyer_id` → `buyers.id`
- `orders.product_id` → `products.id`
- `reviews.product_id` → `products.id`
- `reviews.seller_id` → `sellers.id`
- `follows.seller_id` → `sellers.id`

## Data Updates

- Generated slugs for existing categories
- Generated order numbers for existing orders (format: KM-XXXXXXXX)
- Set default total_amount for orders based on existing subtotal

## Verification

All required columns have been verified to exist:
- ✅ sellers: 19 columns
- ✅ products: 6 columns
- ✅ orders: 21 columns
- ✅ buyers: 14 columns (new table)
- ✅ delivery_users: 8 columns (new table)
- ✅ reviews: 6 columns (new table)
- ✅ follows: 3 columns (new table)
- ✅ seller_applications: 34 columns (new table)
- ✅ categories: 3 columns

## API Routes Supported

The migration ensures all columns required by these API routes are present:
- `/api/auth/*` - Seller authentication and registration
- `/api/sellers/*` - Seller profiles and products
- `/api/products/*` - Product listings and details
- `/api/buyer/*` - Buyer authentication and management
- `/api/orders/*` - Order creation and tracking
- `/api/reviews/*` - Product and seller reviews
- `/api/delivery/*` - Delivery user management
- `/api/seller-applications/*` - Seller application processing
- `/api/categories/*` - Product categories

## Migration Execution

Both migration files have been successfully executed against the `kudimall_dev` database:

```bash
PGPASSWORD='@Memba3nyinaa2$' psql -U postgres -d kudimall_dev -f /home/runner/work/kudimall/kudimall/server/migrations/add_missing_columns.sql
PGPASSWORD='@Memba3nyinaa2$' psql -U postgres -d kudimall_dev -f /home/runner/work/kudimall/kudimall/server/migrations/fix_seller_applications.sql
```

## Notes

- All new columns use `IF NOT EXISTS` to prevent errors on re-run
- Existing data is preserved
- Default values are set where appropriate
- Foreign key constraints maintain referential integrity
- Indexes optimize query performance for common lookups
- The migration is idempotent and can be safely re-run
