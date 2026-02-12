# 📋 KudiMall API Quick Reference

**Total APIs:** 75+ endpoints across 12 modules

## 🔗 Quick Links
- **Full Documentation:** [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Base URL:** `http://localhost:5000` or your production URL

---

## 📊 API Modules Overview

### 1️⃣ System APIs (3 endpoints)
- `GET /` - API information
- `GET /api/health` - Health check
- `POST /api/seed-database` - Seed database

### 2️⃣ Seller Authentication `/api/auth` (6 endpoints)
- `POST /seller/signup` - Register seller
- `POST /seller/login` - Login seller
- `GET /seller/me` - Get seller info
- `PUT /seller/profile` - Update profile
- `GET /seller/verify-email` - Verify email
- `POST /seller/resend-verification` - Resend verification

### 3️⃣ Seller Management `/api/seller` (9 endpoints)
- `GET /products` - List seller's products
- `POST /products` - Create product
- `GET /products/:id` - Get product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `GET /stats` - Seller statistics
- `GET /orders` - Seller's orders
- `PATCH /orders/:orderNumber/status` - Update order status
- `POST /orders/:orderNumber/delivery-proof/photo` - Upload delivery proof

### 4️⃣ Buyer Authentication `/api/buyer-auth` (7 endpoints)
- `POST /signup` - Register buyer
- `POST /login` - Login buyer
- `GET /profile` - Get profile
- `PUT /profile` - Update profile
- `POST /change-password` - Change password
- `POST /forgot-password` - Request password reset
- `POST /reset-password` - Reset password

### 5️⃣ Buyer Management `/api/buyer` (4 endpoints)
- `GET /orders` - List buyer's orders
- `GET /orders/:orderNumber` - Get order details
- `POST /orders/:orderNumber/confirm-received` - Confirm delivery
- `POST /orders/:orderNumber/report-issue` - Report issue
- `GET /statistics` - Buyer statistics

### 6️⃣ Delivery Authentication `/api/delivery-auth` (3 endpoints)
- `POST /signup` - Register delivery account
- `POST /login` - Login delivery
- `GET /profile` - Get profile

### 7️⃣ Delivery Management `/api/delivery` (3 endpoints)
- `GET /orders` - Assigned orders
- `POST /orders/:orderNumber/claim` - Claim order
- `POST /orders/:orderNumber/delivery-proof/photo` - Upload proof

### 8️⃣ Public Products `/api/products` (3 endpoints)
- `GET /` - List products (with filters)
- `GET /:slug` - Product details
- `GET /:slug/reviews` - Product reviews

### 9️⃣ Public Sellers `/api/sellers` (6 endpoints)
- `GET /` - List sellers
- `GET /:slug` - Seller details
- `GET /:slug/products` - Seller's products
- `GET /:slug/reviews` - Seller reviews
- `POST /:slug/follow` - Follow seller
- `DELETE /:slug/follow` - Unfollow seller

### 🔟 Categories `/api/categories` (3 endpoints)
- `GET /` - List categories
- `GET /:slug` - Category details
- `GET /:slug/products` - Products in category

### 1️⃣1️⃣ Orders `/api/orders` (2 endpoints)
- `POST /` - Create order (checkout)
- `GET /:order_number` - Get order details

### 1️⃣2️⃣ Search `/api/search` (1 endpoint)
- `GET /` - Global search (products, sellers, categories)

### 1️⃣3️⃣ Reviews `/api/reviews` (1 endpoint)
- `POST /` - Create review

### 1️⃣4️⃣ Seller Applications `/api/seller-applications` (4 endpoints)
- `POST /` - Submit application
- `GET /` - List applications (admin)
- `GET /:id` - Get application
- `PATCH /:id` - Update application status

---

## 🔐 Authentication Types

| User Type | Base Path | Token Expiry |
|-----------|-----------|--------------|
| **Seller** | `/api/auth` | 7 days |
| **Buyer** | `/api/buyer-auth` | 30 days |
| **Delivery** | `/api/delivery-auth` | 30 days |

---

## 🎯 Key Features

✅ **JWT Authentication** - Secure token-based auth  
✅ **Escrow System** - Payment protection for buyers  
✅ **Email Verification** - Seller email verification required  
✅ **Delivery Proof** - Photo + signature support  
✅ **Global Search** - Search products, sellers, categories  
✅ **Reviews & Ratings** - Product and seller reviews  
✅ **Trust Levels** - 1-5 seller trust rating  
✅ **File Uploads** - Max 5MB for delivery proofs  
✅ **Pagination** - Page/limit support on list endpoints  

---

## 📝 Common Query Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `limit` | number | Results per page | 20 |
| `status` | string | Filter by status | - |
| `featured` | boolean | Featured items only | false |
| `min_price` | number | Minimum price | - |
| `max_price` | number | Maximum price | - |
| `trust_level` | number | Min seller trust | - |

---

## 🚀 Quick Start Examples

### Create Order (Guest Checkout)
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "buyer_name": "John Doe",
    "buyer_email": "john@example.com",
    "buyer_phone": "+233123456789",
    "seller_id": 1,
    "product_id": 5,
    "quantity": 2,
    "delivery_address": "123 Main St, Accra"
  }'
```

### Search Products
```bash
curl "http://localhost:5000/api/search?q=headphones&type=products"
```

### Seller Login
```bash
curl -X POST http://localhost:5000/api/auth/seller/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seller@example.com",
    "password": "password123"
  }'
```

### Get Products (with filters)
```bash
curl "http://localhost:5000/api/products?featured=true&min_price=50&max_price=500&page=1&limit=20"
```

---

## 📚 Documentation Files

1. **API_DOCUMENTATION.md** - Complete API reference with all endpoints
2. **API_SUMMARY.md** - This quick reference guide
3. **ARCHITECTURE.md** - System architecture overview
4. **README.md** - Project overview and setup

---

## 🔄 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

---

## 📊 HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Success |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Auth required |
| 403 | Forbidden - Access denied |
| 404 | Not Found |
| 409 | Conflict - Already exists |
| 410 | Gone - Expired |
| 500 | Server Error |

---

**For detailed endpoint documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

**Last Updated:** February 12, 2026
