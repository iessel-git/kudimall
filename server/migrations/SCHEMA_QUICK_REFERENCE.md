# KudiMall Database Schema - Quick Reference

## Overview
This document provides a quick reference for the complete KudiMall PostgreSQL database schema after migration.

## Tables Summary

| Table | Total Columns | Purpose |
|-------|--------------|---------|
| sellers | 25 | Seller accounts and profiles |
| products | 16 | Product listings |
| orders | 40 | Order management and tracking |
| buyers | 15 | Buyer accounts |
| delivery_users | 9 | Delivery personnel accounts |
| reviews | 7 | Product and seller reviews |
| follows | 4 | Seller followers |
| seller_applications | 35 | New seller applications |
| categories | 4 | Product categories |
| users | 6 | Legacy user table |
| carts | 4 | Shopping carts |
| cart_items | 7 | Cart line items |
| coupons | 11 | Discount coupons |
| coupon_usage | 6 | Coupon usage tracking |
| order_items | 5 | Order line items |
| inventory_alerts | 7 | Low stock alerts |
| payment_webhooks | 8 | Payment provider webhooks |

## Key Relationships

```
sellers (1) ──→ (many) products
sellers (1) ──→ (many) orders
sellers (1) ──→ (many) reviews
sellers (1) ──→ (many) follows

buyers (1) ──→ (many) orders
buyers (1) ──→ (many) follows

products (1) ──→ (many) orders
products (1) ──→ (many) reviews

delivery_users (1) ──→ (many) orders

categories (1) ──→ (many) products
```

## Critical Columns by Feature

### Authentication & User Management
- **Sellers**: `email`, `password`, `email_verified`, `email_verification_token`, `slug`
- **Buyers**: `email`, `password`, `reset_token`, `reset_token_expiry`
- **Delivery Users**: `email`, `password`, `is_active`

### E-Commerce Core
- **Products**: `slug`, `seller_id`, `price`, `stock`, `views`, `sales`, `images`
- **Orders**: `order_number`, `buyer_id`, `seller_id`, `product_id`, `quantity`, `total_amount`, `status`

### Delivery & Fulfillment
- **Orders**: `tracking_number`, `shipped_at`, `delivered_at`, `delivery_address`, `delivery_person_id`
- **Delivery Proof**: `delivery_proof_url`, `delivery_proof_type`, `delivery_signature_data`

### Reviews & Social
- **Reviews**: `product_id`, `seller_id`, `buyer_name`, `rating`, `comment`
- **Follows**: `buyer_email`, `seller_id`

### Seller Onboarding
- **Seller Applications**: `application_id`, `status`, `store_name`, `business_name`, `bank_name`

## Common Queries

### Get Seller Profile
```sql
SELECT id, name, slug, email, phone, location, description, 
       logo_url, banner_url, is_verified, trust_level, 
       total_sales, rating, review_count
FROM sellers 
WHERE slug = 'seller-slug';
```

### Get Product with Seller Info
```sql
SELECT p.*, s.name as seller_name, s.slug as seller_slug, 
       s.trust_level, s.is_verified
FROM products p
JOIN sellers s ON p.seller_id = s.id
WHERE p.slug = 'product-slug';
```

### Get Buyer Orders
```sql
SELECT o.*, p.name as product_name, s.name as seller_name
FROM orders o
JOIN products p ON o.product_id = p.id
JOIN sellers s ON o.seller_id = s.id
WHERE o.buyer_id = 123
ORDER BY o.created_at DESC;
```

### Get Delivery Assignments
```sql
SELECT o.*, p.name as product_name, s.phone as seller_phone
FROM orders o
JOIN products p ON o.product_id = p.id
JOIN sellers s ON o.seller_id = s.id
WHERE o.delivery_person_id = 456
  AND o.status IN ('shipped', 'delivered');
```

## Indexes for Performance

Key indexes have been created on:
- All email columns (for authentication)
- All slug columns (for URL lookups)
- Foreign key columns (for joins)
- Status columns (for filtering)
- Timestamp columns (for sorting)

## Migration Files

1. **add_missing_columns.sql** - Main migration adding all missing columns
2. **fix_seller_applications.sql** - Supplementary fixes for existing tables
3. **MIGRATION_SUMMARY.md** - Detailed migration documentation
4. **SCHEMA_QUICK_REFERENCE.md** - This file

## Usage

To apply migrations:
```bash
PGPASSWORD='your_password' psql -U postgres -d kudimall_dev -f add_missing_columns.sql
PGPASSWORD='your_password' psql -U postgres -d kudimall_dev -f fix_seller_applications.sql
```

To verify schema:
```bash
PGPASSWORD='your_password' psql -U postgres -d kudimall_dev -c "\d table_name"
```

## Status: ✅ Complete

All API routes are now fully supported by the database schema.
