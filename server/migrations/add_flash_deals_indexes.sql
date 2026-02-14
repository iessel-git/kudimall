-- Flash Deals Performance Indexes
-- Run this migration to improve flash deals query performance
-- Estimated execution time: < 1 second

-- Index for active deals lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_flash_deals_active_times 
ON flash_deals(is_active, starts_at, ends_at)
WHERE is_active = true;

-- Index for product-based deal lookup
CREATE INDEX IF NOT EXISTS idx_flash_deals_product_id 
ON flash_deals(product_id);

-- Index for seller's deals management
CREATE INDEX IF NOT EXISTS idx_flash_deals_seller_id 
ON flash_deals(seller_id);

-- Composite index for cart/order deal lookup (hot path)
CREATE INDEX IF NOT EXISTS idx_flash_deals_product_active 
ON flash_deals(product_id, is_active)
WHERE is_active = true;

-- Index for deal expiry cleanup jobs
CREATE INDEX IF NOT EXISTS idx_flash_deals_ends_at 
ON flash_deals(ends_at)
WHERE is_active = true;

-- Verify indexes created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'flash_deals'
ORDER BY indexname;

-- Performance stats (optional - comment out if monitoring is disabled)
-- SELECT * FROM pg_stat_user_indexes WHERE relname = 'flash_deals';
