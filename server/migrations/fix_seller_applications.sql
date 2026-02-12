-- ============================================================================
-- Fix seller_applications table - Add missing columns
-- ============================================================================

ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS facebook_page VARCHAR(255);
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(255);
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS tiktok_handle VARCHAR(255);
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255);
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS account_holder_name VARCHAR(255);
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS account_number_last4 VARCHAR(4);
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS routing_number VARCHAR(50);
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS id_type VARCHAR(50);
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS id_number VARCHAR(100);
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(255);
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE seller_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update phone column to match expected size
ALTER TABLE seller_applications ALTER COLUMN phone TYPE VARCHAR(50);

-- Update business fields to match expected sizes
ALTER TABLE seller_applications ALTER COLUMN email TYPE VARCHAR(255);
ALTER TABLE seller_applications ALTER COLUMN business_name TYPE VARCHAR(255);
ALTER TABLE seller_applications ALTER COLUMN business_type TYPE VARCHAR(100);
ALTER TABLE seller_applications ALTER COLUMN city TYPE VARCHAR(100);
ALTER TABLE seller_applications ALTER COLUMN state TYPE VARCHAR(100);
ALTER TABLE seller_applications ALTER COLUMN zip_code TYPE VARCHAR(20);
ALTER TABLE seller_applications ALTER COLUMN country TYPE VARCHAR(100);
ALTER TABLE seller_applications ALTER COLUMN tax_id TYPE VARCHAR(100);
ALTER TABLE seller_applications ALTER COLUMN store_name TYPE VARCHAR(255);
ALTER TABLE seller_applications ALTER COLUMN estimated_monthly_volume TYPE VARCHAR(50);
ALTER TABLE seller_applications ALTER COLUMN instagram_handle TYPE VARCHAR(255);

-- Add NOT NULL constraints where missing
UPDATE seller_applications SET phone = '' WHERE phone IS NULL;
UPDATE seller_applications SET business_type = '' WHERE business_type IS NULL;
UPDATE seller_applications SET business_address = '' WHERE business_address IS NULL;
UPDATE seller_applications SET city = '' WHERE city IS NULL;
UPDATE seller_applications SET state = '' WHERE state IS NULL;
UPDATE seller_applications SET zip_code = '' WHERE zip_code IS NULL;
UPDATE seller_applications SET country = '' WHERE country IS NULL;
UPDATE seller_applications SET store_description = '' WHERE store_description IS NULL;

ALTER TABLE seller_applications ALTER COLUMN phone SET NOT NULL;
ALTER TABLE seller_applications ALTER COLUMN business_type SET NOT NULL;
ALTER TABLE seller_applications ALTER COLUMN business_address SET NOT NULL;
ALTER TABLE seller_applications ALTER COLUMN city SET NOT NULL;
ALTER TABLE seller_applications ALTER COLUMN state SET NOT NULL;
ALTER TABLE seller_applications ALTER COLUMN zip_code SET NOT NULL;
ALTER TABLE seller_applications ALTER COLUMN country SET NOT NULL;
ALTER TABLE seller_applications ALTER COLUMN store_description SET NOT NULL;

-- Recreate status index with correct condition
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON seller_applications(status);

-- Add missing buyers table columns
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;

-- Adjust buyers table column sizes
ALTER TABLE buyers ALTER COLUMN name TYPE VARCHAR(255);
ALTER TABLE buyers ALTER COLUMN email TYPE VARCHAR(255);
ALTER TABLE buyers ALTER COLUMN phone TYPE VARCHAR(50);

-- Fix reviews table constraints to match routes
ALTER TABLE reviews ALTER COLUMN seller_id DROP NOT NULL;
ALTER TABLE reviews ALTER COLUMN buyer_name TYPE VARCHAR(255);

-- Update follows table to match expected structure (buyer_email based, not buyer_id)
ALTER TABLE follows DROP CONSTRAINT IF EXISTS follows_buyer_email_seller_id_key;
ALTER TABLE follows DROP COLUMN IF EXISTS buyer_id CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS follows_buyer_email_seller_id_unique ON follows(buyer_email, seller_id);

-- Update delivery_users table column sizes
ALTER TABLE delivery_users ALTER COLUMN name TYPE VARCHAR(255);
ALTER TABLE delivery_users ALTER COLUMN email TYPE VARCHAR(255);
ALTER TABLE delivery_users ALTER COLUMN phone TYPE VARCHAR(50);

SELECT 'Seller applications table fixed successfully!' as status;
