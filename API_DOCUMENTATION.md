# 🚀 KudiMall API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000` (Development) or your production URL  
**Last Updated:** February 12, 2026

---

## 📑 Table of Contents

1. [Authentication](#authentication)
2. [System Endpoints](#system-endpoints)
3. [Seller APIs](#seller-apis)
4. [Buyer APIs](#buyer-apis)
5. [Delivery APIs](#delivery-apis)
6. [Public Product APIs](#public-product-apis)
7. [Public Seller/Store APIs](#public-sellerstore-apis)
8. [Category APIs](#category-apis)
9. [Order APIs](#order-apis)
10. [Search APIs](#search-apis)
11. [Review APIs](#review-apis)
12. [Seller Application APIs](#seller-application-apis)

---

## 🔐 Authentication

KudiMall uses **JWT (JSON Web Token)** based authentication. Three separate authentication systems exist for:
- **Sellers** - Store/business owners
- **Buyers** - Customers/purchasers
- **Delivery Personnel** - Delivery agents

### Token Usage
Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Token Expiry
- **Seller tokens:** 7 days
- **Buyer tokens:** 30 days
- **Delivery tokens:** 30 days

---

## 🔧 System Endpoints

### 1. Root API Info
**GET** `/`

Returns API information and available endpoints.

**Response:**
```json
{
  "name": "KudiMall API",
  "version": "1.0.0",
  "status": "running",
  "message": "Welcome to KudiMall API",
  "endpoints": {
    "health": "/api/health",
    "categories": "/api/categories",
    "sellers": "/api/sellers",
    "products": "/api/products",
    "search": "/api/search",
    "reviews": "/api/reviews",
    "orders": "/api/orders"
  }
}
```

---

### 2. Health Check
**GET** `/api/health`

Check if the API is running.

**Response:**
```json
{
  "status": "ok",
  "message": "KudiMall API is running"
}
```

---

### 3. Seed Database
**POST** `/api/seed-database`

Manually seed the database with initial data.

**Response:**
```json
{
  "status": "success",
  "message": "Database seeded successfully"
}
```

---

## 🏪 Seller APIs

### Authentication - `/api/auth`

#### 1. Seller Signup
**POST** `/api/auth/seller/signup`

Register a new seller account.

**Request Body:**
```json
{
  "name": "John's Store",
  "email": "john@example.com",
  "password": "securepassword",
  "phone": "+233123456789",
  "location": "Accra, Ghana",
  "description": "Quality products at great prices"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Seller account created successfully! Please check your email to verify your account.",
  "emailVerificationRequired": true,
  "seller": {
    "id": 1,
    "name": "John's Store",
    "email": "john@example.com",
    "slug": "johns-store",
    "phone": "+233123456789",
    "location": "Accra, Ghana",
    "description": "Quality products at great prices",
    "email_verified": false
  }
}
```

---

#### 2. Seller Login
**POST** `/api/auth/seller/login`

Login to seller account.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "seller": {
    "id": 1,
    "name": "John's Store",
    "email": "john@example.com",
    "slug": "johns-store",
    "phone": "+233123456789",
    "location": "Accra, Ghana",
    "description": "Quality products at great prices",
    "logo_url": null,
    "banner_url": null,
    "is_verified": false,
    "trust_level": 1,
    "total_sales": 0,
    "rating": 0
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `403` - Email not verified or account disabled

---

#### 3. Get Current Seller Info
**GET** `/api/auth/seller/me`

Get authenticated seller's information.

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Response (200):**
```json
{
  "success": true,
  "seller": {
    "id": 1,
    "name": "John's Store",
    "slug": "johns-store",
    "email": "john@example.com",
    "phone": "+233123456789",
    "location": "Accra, Ghana",
    "description": "Quality products at great prices",
    "logo_url": null,
    "banner_url": null,
    "is_verified": false,
    "trust_level": 1,
    "total_sales": 0,
    "rating": 0,
    "review_count": 0,
    "created_at": "2026-01-15T10:30:00Z"
  }
}
```

---

#### 4. Update Seller Profile
**PUT** `/api/auth/seller/profile`

Update seller profile information.

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Request Body:**
```json
{
  "name": "John's Premium Store",
  "phone": "+233987654321",
  "location": "Kumasi, Ghana",
  "description": "Premium quality products",
  "logo_url": "https://example.com/logo.png",
  "banner_url": "https://example.com/banner.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "seller": {
    "id": 1,
    "name": "John's Premium Store",
    "slug": "johns-store",
    "email": "john@example.com",
    "phone": "+233987654321",
    "location": "Kumasi, Ghana",
    "description": "Premium quality products",
    "logo_url": "https://example.com/logo.png",
    "banner_url": "https://example.com/banner.jpg",
    "is_verified": false,
    "trust_level": 1
  }
}
```

---

#### 5. Verify Email
**GET** `/api/auth/seller/verify-email?token=<verification-token>`

Verify seller email address.

**Query Parameters:**
- `token` (required) - Email verification token from email

**Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now log in to your seller account.",
  "seller": {
    "name": "John's Store",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400` - Token missing
- `404` - Invalid token
- `410` - Token expired

---

#### 6. Resend Verification Email
**POST** `/api/auth/seller/resend-verification`

Resend email verification link.

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Verification email sent! Please check your inbox."
}
```

---

### Seller Management - `/api/seller`

#### 1. Get Seller's Products
**GET** `/api/seller/products`

Get all products for authenticated seller.

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Response (200):**
```json
{
  "success": true,
  "products": [
    {
      "id": 1,
      "seller_id": 1,
      "category_id": 2,
      "name": "Wireless Headphones",
      "slug": "wireless-headphones",
      "description": "High quality wireless headphones",
      "price": 150.00,
      "stock": 25,
      "image_url": "https://example.com/headphones.jpg",
      "images": null,
      "is_available": true,
      "is_featured": false,
      "views": 120,
      "sales": 15,
      "created_at": "2026-01-20T14:30:00Z",
      "updated_at": "2026-01-20T14:30:00Z",
      "category_name": "Electronics",
      "category_slug": "electronics"
    }
  ]
}
```

---

#### 2. Create Product
**POST** `/api/seller/products`

Create a new product.

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Request Body:**
```json
{
  "name": "Leather Wallet",
  "description": "Genuine leather wallet",
  "price": 45.00,
  "category_id": 3,
  "stock": 50,
  "image_url": "https://example.com/wallet.jpg",
  "images": ["https://example.com/wallet1.jpg", "https://example.com/wallet2.jpg"],
  "is_available": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "id": 2,
    "seller_id": 1,
    "category_id": 3,
    "name": "Leather Wallet",
    "slug": "leather-wallet",
    "description": "Genuine leather wallet",
    "price": 45.00,
    "stock": 50,
    "image_url": "https://example.com/wallet.jpg",
    "images": "[\"https://example.com/wallet1.jpg\",\"https://example.com/wallet2.jpg\"]",
    "is_available": true,
    "is_featured": false,
    "views": 0,
    "sales": 0,
    "created_at": "2026-02-12T10:00:00Z",
    "updated_at": "2026-02-12T10:00:00Z"
  }
}
```

---

#### 3. Get Single Product
**GET** `/api/seller/products/:id`

Get a specific product owned by seller.

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Response (200):**
```json
{
  "success": true,
  "product": {
    "id": 2,
    "seller_id": 1,
    "category_id": 3,
    "name": "Leather Wallet",
    "slug": "leather-wallet",
    "description": "Genuine leather wallet",
    "price": 45.00,
    "stock": 50,
    "category_name": "Fashion",
    "category_slug": "fashion"
  }
}
```

---

#### 4. Update Product
**PUT** `/api/seller/products/:id`

Update product details.

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Request Body:**
```json
{
  "name": "Premium Leather Wallet",
  "price": 55.00,
  "stock": 40,
  "is_available": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "product": {
    "id": 2,
    "name": "Premium Leather Wallet",
    "price": 55.00,
    "stock": 40,
    "is_available": true
  }
}
```

---

#### 5. Delete Product
**DELETE** `/api/seller/products/:id`

Delete a product.

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

---

#### 6. Get Seller Statistics
**GET** `/api/seller/stats`

Get seller's statistics.

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "total_products": 15,
    "active_products": 12,
    "total_stock": 450,
    "total_views": 5240,
    "total_sales": 89,
    "orders_by_status": [
      { "count": 5, "status": "pending" },
      { "count": 20, "status": "completed" },
      { "count": 3, "status": "shipped" }
    ]
  }
}
```

---

#### 7. Get Seller Orders
**GET** `/api/seller/orders?status=pending&limit=50`

Get orders for seller with optional status filter.

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Query Parameters:**
- `status` (optional) - Filter by order status: `pending`, `processing`, `shipped`, `delivered`, `cancelled`
- `limit` (optional) - Max results (default: 50)

**Response (200):**
```json
{
  "success": true,
  "orders": [
    {
      "id": 10,
      "order_number": "KM-ABC12345",
      "buyer_name": "Jane Doe",
      "buyer_email": "jane@example.com",
      "buyer_phone": "+233555555555",
      "seller_id": 1,
      "product_id": 2,
      "product_name": "Leather Wallet",
      "product_image": "https://example.com/wallet.jpg",
      "quantity": 2,
      "total_amount": 110.00,
      "status": "pending",
      "escrow_status": "held",
      "delivery_address": "123 Main St, Accra",
      "tracking_number": null,
      "created_at": "2026-02-11T09:30:00Z"
    }
  ]
}
```

---

#### 8. Update Order Status
**PATCH** `/api/seller/orders/:orderNumber/status`

Update order status and tracking information.

**Headers:**
```
Authorization: Bearer <seller-token>
```

**Request Body:**
```json
{
  "status": "shipped",
  "tracking_number": "TRK123456789"
}
```

**Valid Status Values:**
- `pending`
- `processing`
- `shipped`
- `delivered`
- `cancelled`

**Response (200):**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "order": {
    "id": 10,
    "order_number": "KM-ABC12345",
    "status": "shipped",
    "tracking_number": "TRK123456789",
    "shipped_at": "2026-02-12T11:00:00Z"
  }
}
```

---

#### 9. Upload Delivery Proof Photo
**POST** `/api/seller/orders/:orderNumber/delivery-proof/photo`

Upload delivery proof photo (seller-initiated).

**Headers:**
```
Authorization: Bearer <seller-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `photo` (required) - Image file (max 5MB)
- `delivered_by` (optional) - Who delivered: "seller" or "delivery"

**Response (200):**
```json
{
  "success": true,
  "message": "Delivery proof uploaded successfully",
  "order": {
    "id": 10,
    "order_number": "KM-ABC12345",
    "status": "delivered",
    "delivery_proof_type": "photo",
    "delivery_proof_url": "/uploads/delivery-proofs/KM-ABC12345-1707735600000.jpg",
    "delivered_at": "2026-02-12T12:00:00Z"
  }
}
```

---

## 🛒 Buyer APIs

### Buyer Authentication - `/api/buyer-auth`

#### 1. Buyer Signup
**POST** `/api/buyer-auth/signup`

Register a new buyer account.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword",
  "phone": "+233555555555",
  "address": "123 Main Street, Accra"
}
```

**Response (201):**
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "buyer": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+233555555555",
    "default_address": "123 Main Street, Accra"
  }
}
```

---

#### 2. Buyer Login
**POST** `/api/buyer-auth/login`

Login to buyer account.

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "buyer": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+233555555555",
    "default_address": "123 Main Street, Accra"
  }
}
```

---

#### 3. Get Buyer Profile
**GET** `/api/buyer-auth/profile`

Get buyer profile with statistics.

**Headers:**
```
Authorization: Bearer <buyer-token>
```

**Response (200):**
```json
{
  "buyer": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+233555555555",
    "default_address": "123 Main Street, Accra",
    "city": null,
    "state": null,
    "zip_code": null,
    "created_at": "2026-01-10T08:00:00Z"
  },
  "stats": {
    "total_orders": 15,
    "total_spent": 2350.00,
    "completed_orders": 12,
    "pending_orders": 3
  }
}
```

---

#### 4. Update Buyer Profile
**PUT** `/api/buyer-auth/profile`

Update buyer profile information.

**Headers:**
```
Authorization: Bearer <buyer-token>
```

**Request Body:**
```json
{
  "name": "Jane M. Doe",
  "phone": "+233666666666",
  "default_address": "456 New Street, Kumasi",
  "city": "Kumasi",
  "state": "Ashanti",
  "zip_code": "00233"
}
```

**Response (200):**
```json
{
  "message": "Profile updated successfully"
}
```

---

#### 5. Change Password
**POST** `/api/buyer-auth/change-password`

Change buyer password.

**Headers:**
```
Authorization: Bearer <buyer-token>
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

---

#### 6. Forgot Password
**POST** `/api/buyer-auth/forgot-password`

Request password reset email.

**Request Body:**
```json
{
  "email": "jane@example.com"
}
```

**Response (200):**
```json
{
  "message": "If an account exists with this email, you will receive a password reset link shortly."
}
```

---

#### 7. Reset Password
**POST** `/api/buyer-auth/reset-password`

Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "mynewpassword"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

---

### Buyer Management - `/api/buyer`

#### 1. Get Buyer Orders
**GET** `/api/buyer/orders`

Get all orders for logged-in buyer.

**Headers:**
```
Authorization: Bearer <buyer-token>
```

**Response (200):**
```json
{
  "orders": [
    {
      "id": 10,
      "order_number": "KM-ABC12345",
      "buyer_name": "Jane Doe",
      "buyer_email": "jane@example.com",
      "buyer_phone": "+233555555555",
      "product_id": 2,
      "product_name": "Leather Wallet",
      "product_slug": "leather-wallet",
      "product_image": "https://example.com/wallet.jpg",
      "product_price": 55.00,
      "seller_id": 1,
      "seller_name": "John's Store",
      "seller_slug": "johns-store",
      "seller_email": "john@example.com",
      "seller_phone": "+233123456789",
      "seller_verified": false,
      "quantity": 2,
      "total_amount": 110.00,
      "status": "shipped",
      "escrow_status": "held",
      "delivery_address": "123 Main Street, Accra",
      "tracking_number": "TRK123456789",
      "shipped_at": "2026-02-12T11:00:00Z",
      "delivered_at": null,
      "buyer_confirmed_at": null,
      "delivery_proof_type": null,
      "delivery_proof_url": null,
      "created_at": "2026-02-11T09:30:00Z",
      "updated_at": "2026-02-12T11:00:00Z"
    }
  ]
}
```

---

#### 2. Get Single Order
**GET** `/api/buyer/orders/:orderNumber`

Get detailed information about a specific order.

**Headers:**
```
Authorization: Bearer <buyer-token>
```

**Response (200):**
```json
{
  "order": {
    "id": 10,
    "order_number": "KM-ABC12345",
    "buyer_name": "Jane Doe",
    "buyer_email": "jane@example.com",
    "product_name": "Leather Wallet",
    "product_description": "Genuine leather wallet",
    "seller_name": "John's Store",
    "quantity": 2,
    "total_amount": 110.00,
    "status": "shipped",
    "escrow_status": "held",
    "tracking_number": "TRK123456789",
    "delivery_proof_url": null
  }
}
```

---

#### 3. Confirm Order Received
**POST** `/api/buyer/orders/:orderNumber/confirm-received`

Confirm delivery received and release escrow payment to seller.

**Headers:**
```
Authorization: Bearer <buyer-token>
```

**Request Body:**
```json
{
  "signature_name": "Jane Doe",
  "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}
```

**Response (200):**
```json
{
  "message": "Order confirmed and payment released to seller"
}
```

---

#### 4. Report Issue
**POST** `/api/buyer/orders/:orderNumber/report-issue`

Report a problem with an order.

**Headers:**
```
Authorization: Bearer <buyer-token>
```

**Request Body:**
```json
{
  "issue_description": "Product arrived damaged"
}
```

**Response (200):**
```json
{
  "message": "Issue reported. Our team will review and contact you."
}
```

---

#### 5. Get Buyer Statistics
**GET** `/api/buyer/statistics`

Get order statistics for buyer.

**Headers:**
```
Authorization: Bearer <buyer-token>
```

**Response (200):**
```json
{
  "stats": {
    "total_orders": 15,
    "total_spent": 2350.00,
    "completed_orders": 12,
    "pending_orders": 2,
    "shipped_orders": 1,
    "disputed_orders": 0
  }
}
```

---

## 🚚 Delivery APIs

### Delivery Authentication - `/api/delivery-auth`

#### 1. Delivery Signup
**POST** `/api/delivery-auth/signup`

Register a new delivery account.

**Request Body:**
```json
{
  "name": "Mike Delivery",
  "email": "mike@delivery.com",
  "password": "securepassword",
  "phone": "+233777777777"
}
```

**Response (201):**
```json
{
  "message": "Delivery account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "deliveryUser": {
    "id": 1,
    "name": "Mike Delivery",
    "email": "mike@delivery.com",
    "phone": "+233777777777"
  }
}
```

---

#### 2. Delivery Login
**POST** `/api/delivery-auth/login`

Login to delivery account.

**Request Body:**
```json
{
  "email": "mike@delivery.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "deliveryUser": {
    "id": 1,
    "name": "Mike Delivery",
    "email": "mike@delivery.com",
    "phone": "+233777777777"
  }
}
```

---

#### 3. Get Delivery Profile
**GET** `/api/delivery-auth/profile`

Get delivery person profile.

**Headers:**
```
Authorization: Bearer <delivery-token>
```

**Response (200):**
```json
{
  "deliveryUser": {
    "id": 1,
    "name": "Mike Delivery",
    "email": "mike@delivery.com",
    "phone": "+233777777777",
    "created_at": "2026-01-15T10:00:00Z"
  }
}
```

---

### Delivery Management - `/api/delivery`

#### 1. Get Delivery Orders
**GET** `/api/delivery/orders?status=shipped`

Get assigned delivery orders.

**Headers:**
```
Authorization: Bearer <delivery-token>
```

**Query Parameters:**
- `status` (optional) - Filter by status

**Response (200):**
```json
{
  "success": true,
  "orders": [
    {
      "id": 10,
      "order_number": "KM-ABC12345",
      "buyer_name": "Jane Doe",
      "buyer_phone": "+233555555555",
      "delivery_address": "123 Main Street, Accra",
      "product_name": "Leather Wallet",
      "product_image": "https://example.com/wallet.jpg",
      "seller_name": "John's Store",
      "seller_phone": "+233123456789",
      "quantity": 2,
      "total_amount": 110.00,
      "status": "shipped",
      "tracking_number": "TRK123456789",
      "created_at": "2026-02-11T09:30:00Z"
    }
  ]
}
```

---

#### 2. Claim Order for Delivery
**POST** `/api/delivery/orders/:orderNumber/claim`

Claim an order for delivery.

**Headers:**
```
Authorization: Bearer <delivery-token>
```

**Response (200):**
```json
{
  "success": true,
  "order": {
    "id": 10,
    "order_number": "KM-ABC12345",
    "delivery_person_id": 1,
    "status": "shipped"
  }
}
```

---

#### 3. Upload Delivery Proof Photo
**POST** `/api/delivery/orders/:orderNumber/delivery-proof/photo`

Upload delivery proof photo.

**Headers:**
```
Authorization: Bearer <delivery-token>
Content-Type: multipart/form-data
```

**Form Data:**
- `photo` (required) - Image file (max 5MB)

**Response (200):**
```json
{
  "success": true,
  "message": "Delivery proof uploaded successfully",
  "order": {
    "id": 10,
    "order_number": "KM-ABC12345",
    "status": "delivered",
    "delivery_proof_url": "/uploads/delivery-proofs/KM-ABC12345-1707735600000.jpg",
    "delivered_at": "2026-02-12T15:00:00Z"
  }
}
```

---

## 📦 Public Product APIs

### Products - `/api/products`

#### 1. Get All Products
**GET** `/api/products?page=1&limit=20&featured=true&min_price=50&max_price=500&trust_level=4`

Get products with optional filters.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 20)
- `featured` (optional) - Filter featured products (`true`/`false`)
- `min_price` (optional) - Minimum price
- `max_price` (optional) - Maximum price
- `trust_level` (optional) - Minimum seller trust level (1-5)
- `available` (optional) - Only available products (default: `true`)

**Response (200):**
```json
[
  {
    "id": 1,
    "seller_id": 1,
    "seller_name": "John's Store",
    "trust_level": 4,
    "is_verified": true,
    "category_id": 2,
    "category_name": "Electronics",
    "name": "Wireless Headphones",
    "slug": "wireless-headphones",
    "description": "High quality wireless headphones",
    "price": 150.00,
    "stock": 25,
    "image_url": "https://example.com/headphones.jpg",
    "images": null,
    "is_available": true,
    "is_featured": true,
    "views": 120,
    "sales": 15,
    "created_at": "2026-01-20T14:30:00Z",
    "updated_at": "2026-01-20T14:30:00Z"
  }
]
```

---

#### 2. Get Single Product
**GET** `/api/products/:slug`

Get detailed product information by slug.

**Response (200):**
```json
{
  "id": 1,
  "seller_id": 1,
  "seller_name": "John's Store",
  "seller_slug": "johns-store",
  "seller_location": "Accra, Ghana",
  "trust_level": 4,
  "is_verified": true,
  "category_id": 2,
  "category_name": "Electronics",
  "category_slug": "electronics",
  "name": "Wireless Headphones",
  "slug": "wireless-headphones",
  "description": "High quality wireless headphones with noise cancellation",
  "price": 150.00,
  "stock": 25,
  "image_url": "https://example.com/headphones.jpg",
  "images": null,
  "is_available": true,
  "is_featured": true,
  "views": 121,
  "sales": 15,
  "created_at": "2026-01-20T14:30:00Z",
  "updated_at": "2026-02-12T16:00:00Z"
}
```

**Note:** Views are automatically incremented when viewing a product.

---

#### 3. Get Product Reviews
**GET** `/api/products/:slug/reviews`

Get reviews for a specific product.

**Response (200):**
```json
[
  {
    "id": 1,
    "product_id": 1,
    "seller_id": 1,
    "buyer_name": "Jane Doe",
    "rating": 5,
    "comment": "Excellent quality! Highly recommended.",
    "created_at": "2026-02-10T14:00:00Z"
  }
]
```

---

## 🏪 Public Seller/Store APIs

### Sellers - `/api/sellers`

#### 1. Get All Sellers
**GET** `/api/sellers?page=1&limit=20&featured=true`

Get list of sellers/stores.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 20)
- `featured` (optional) - Only verified sellers with trust level >= 4

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "John's Store",
    "slug": "johns-store",
    "email": "john@example.com",
    "phone": "+233123456789",
    "location": "Accra, Ghana",
    "description": "Quality products at great prices",
    "logo_url": null,
    "banner_url": null,
    "is_verified": true,
    "is_active": true,
    "trust_level": 4,
    "total_sales": 150,
    "rating": 4.5,
    "review_count": 30,
    "created_at": "2026-01-15T10:00:00Z"
  }
]
```

---

#### 2. Get Single Seller/Store
**GET** `/api/sellers/:slug`

Get detailed seller/store information.

**Response (200):**
```json
{
  "id": 1,
  "name": "John's Store",
  "slug": "johns-store",
  "email": "john@example.com",
  "phone": "+233123456789",
  "location": "Accra, Ghana",
  "description": "Quality products at great prices. We offer the best selection of electronics and fashion items.",
  "logo_url": "https://example.com/logo.png",
  "banner_url": "https://example.com/banner.jpg",
  "is_verified": true,
  "is_active": true,
  "trust_level": 4,
  "total_sales": 150,
  "rating": 4.5,
  "review_count": 30,
  "created_at": "2026-01-15T10:00:00Z",
  "updated_at": "2026-02-10T09:00:00Z"
}
```

---

#### 3. Get Seller's Products
**GET** `/api/sellers/:slug/products?page=1&limit=20`

Get all products from a specific seller.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 20)

**Response (200):**
```json
[
  {
    "id": 1,
    "seller_id": 1,
    "category_id": 2,
    "category_name": "Electronics",
    "name": "Wireless Headphones",
    "slug": "wireless-headphones",
    "description": "High quality wireless headphones",
    "price": 150.00,
    "stock": 25,
    "image_url": "https://example.com/headphones.jpg",
    "is_available": true,
    "is_featured": true,
    "views": 121,
    "sales": 15,
    "created_at": "2026-01-20T14:30:00Z"
  }
]
```

---

#### 4. Get Seller Reviews
**GET** `/api/sellers/:slug/reviews`

Get reviews for a seller.

**Response (200):**
```json
[
  {
    "id": 1,
    "product_id": 1,
    "product_name": "Wireless Headphones",
    "seller_id": 1,
    "buyer_name": "Jane Doe",
    "rating": 5,
    "comment": "Great seller! Fast shipping and excellent product quality.",
    "created_at": "2026-02-10T14:00:00Z"
  }
]
```

---

#### 5. Follow Seller
**POST** `/api/sellers/:slug/follow`

Follow a seller to get updates.

**Request Body:**
```json
{
  "buyer_email": "jane@example.com"
}
```

**Response (200):**
```json
{
  "message": "Successfully followed seller"
}
```

---

#### 6. Unfollow Seller
**DELETE** `/api/sellers/:slug/follow`

Unfollow a seller.

**Request Body:**
```json
{
  "buyer_email": "jane@example.com"
}
```

**Response (200):**
```json
{
  "message": "Successfully unfollowed seller"
}
```

---

## 📂 Category APIs

### Categories - `/api/categories`

#### 1. Get All Categories
**GET** `/api/categories`

Get list of all categories.

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Electronics",
    "slug": "electronics",
    "description": "Electronic devices and accessories",
    "image_url": "https://example.com/electronics.jpg",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z"
  },
  {
    "id": 2,
    "name": "Fashion",
    "slug": "fashion",
    "description": "Clothing and accessories",
    "image_url": "https://example.com/fashion.jpg",
    "is_active": true,
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

---

#### 2. Get Single Category
**GET** `/api/categories/:slug`

Get category details.

**Response (200):**
```json
{
  "id": 1,
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices and accessories including phones, laptops, and more",
  "image_url": "https://example.com/electronics.jpg",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

#### 3. Get Products in Category
**GET** `/api/categories/:slug/products?page=1&limit=20`

Get products in a specific category.

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 20)

**Response (200):**
```json
[
  {
    "id": 1,
    "seller_id": 1,
    "seller_name": "John's Store",
    "trust_level": 4,
    "is_verified": true,
    "category_id": 1,
    "category_name": "Electronics",
    "name": "Wireless Headphones",
    "slug": "wireless-headphones",
    "description": "High quality wireless headphones",
    "price": 150.00,
    "stock": 25,
    "image_url": "https://example.com/headphones.jpg",
    "is_available": true,
    "is_featured": true,
    "views": 121,
    "sales": 15,
    "created_at": "2026-01-20T14:30:00Z"
  }
]
```

---

## 🛍️ Order APIs

### Orders - `/api/orders`

#### 1. Create Order (Checkout)
**POST** `/api/orders`

Create a new order. Optionally authenticated for linking to buyer account.

**Headers (Optional):**
```
Authorization: Bearer <buyer-token>
```

**Request Body:**
```json
{
  "buyer_name": "Jane Doe",
  "buyer_email": "jane@example.com",
  "buyer_phone": "+233555555555",
  "seller_id": 1,
  "product_id": 2,
  "quantity": 2,
  "delivery_address": "123 Main Street, Accra, Ghana"
}
```

**Response (201):**
```json
{
  "message": "Order created successfully",
  "order_number": "KM-ABC12345",
  "total_amount": 110.00,
  "escrow_status": "held"
}
```

**Note:** Payment is held in escrow until buyer confirms delivery.

---

#### 2. Get Order by Number
**GET** `/api/orders/:order_number`

Get order details by order number.

**Response (200):**
```json
{
  "id": 10,
  "order_number": "KM-ABC12345",
  "buyer_id": 1,
  "buyer_name": "Jane Doe",
  "buyer_email": "jane@example.com",
  "buyer_phone": "+233555555555",
  "seller_id": 1,
  "seller_name": "John's Store",
  "seller_slug": "johns-store",
  "product_id": 2,
  "product_name": "Leather Wallet",
  "product_image": "https://example.com/wallet.jpg",
  "quantity": 2,
  "total_amount": 110.00,
  "status": "shipped",
  "escrow_status": "held",
  "delivery_address": "123 Main Street, Accra",
  "tracking_number": "TRK123456789",
  "shipped_at": "2026-02-12T11:00:00Z",
  "delivered_at": null,
  "created_at": "2026-02-11T09:30:00Z",
  "updated_at": "2026-02-12T11:00:00Z"
}
```

---

## 🔍 Search APIs

### Search - `/api/search`

#### Global Search
**GET** `/api/search?q=headphones&type=all&page=1&limit=20`

Search across products, sellers, and categories.

**Query Parameters:**
- `q` (required) - Search query
- `type` (optional) - Search type: `all`, `products`, `sellers`, `categories` (default: `all`)
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 20)

**Response (200):**
```json
{
  "products": [
    {
      "id": 1,
      "name": "Wireless Headphones",
      "slug": "wireless-headphones",
      "description": "High quality wireless headphones",
      "price": 150.00,
      "seller_name": "John's Store",
      "trust_level": 4,
      "is_verified": true,
      "category_name": "Electronics",
      "image_url": "https://example.com/headphones.jpg",
      "is_featured": true,
      "views": 121
    }
  ],
  "sellers": [
    {
      "id": 1,
      "name": "John's Store",
      "slug": "johns-store",
      "description": "Quality electronics and accessories",
      "location": "Accra, Ghana",
      "is_verified": true,
      "trust_level": 4,
      "rating": 4.5
    }
  ],
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "slug": "electronics",
      "description": "Electronic devices and accessories"
    }
  ]
}
```

---

## ⭐ Review APIs

### Reviews - `/api/reviews`

#### Create Review
**POST** `/api/reviews`

Create a product review.

**Request Body:**
```json
{
  "product_id": 1,
  "seller_id": 1,
  "buyer_name": "Jane Doe",
  "rating": 5,
  "comment": "Excellent product! Highly recommended."
}
```

**Validation:**
- `rating` must be between 1 and 5
- `product_id`, `seller_id`, `buyer_name`, and `rating` are required

**Response (201):**
```json
{
  "message": "Review created successfully",
  "id": 1
}
```

---

## 📝 Seller Application APIs

### Seller Applications - `/api/seller-applications`

#### 1. Submit Seller Application
**POST** `/api/seller-applications`

Submit a new seller application.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "+233123456789",
  "businessName": "John's Business Ltd",
  "businessType": "LLC",
  "businessAddress": "123 Business Street",
  "city": "Accra",
  "state": "Greater Accra",
  "zipCode": "00233",
  "country": "Ghana",
  "taxId": "TAX123456",
  "storeName": "John's Store",
  "storeDescription": "We sell quality products",
  "productCategories": ["Electronics", "Fashion"],
  "estimatedMonthlyVolume": "10000-50000",
  "instagramHandle": "@johnsstore",
  "facebookPage": "facebook.com/johnsstore",
  "twitterHandle": "@johnsstore",
  "tiktokHandle": "@johnsstore",
  "websiteUrl": "https://johnsstore.com",
  "bankName": "Bank of Ghana",
  "accountHolderName": "John Doe",
  "accountNumber": "1234567890",
  "routingNumber": "987654",
  "idType": "National ID",
  "idNumber": "GHA-123456789",
  "agreeToTerms": true,
  "agreeToCommission": true,
  "agreeToStandards": true
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Application submitted successfully! We will review your application within 24-48 hours.",
  "applicationId": "APP-1707735600000-XYZ123ABC"
}
```

---

#### 2. Get All Applications (Admin)
**GET** `/api/seller-applications?status=pending&limit=20&offset=0`

Get list of seller applications.

**Query Parameters:**
- `status` (optional) - Filter by status: `pending`, `reviewing`, `approved`, `rejected`
- `limit` (optional) - Max results
- `offset` (optional) - Skip results for pagination

**Response (200):**
```json
{
  "applications": [
    {
      "id": 1,
      "application_id": "APP-1707735600000-XYZ123ABC",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+233123456789",
      "business_name": "John's Business Ltd",
      "store_name": "John's Store",
      "status": "pending",
      "created_at": "2026-02-12T10:00:00Z",
      "reviewed_at": null
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

---

#### 3. Get Single Application
**GET** `/api/seller-applications/:id`

Get application details by ID or application_id.

**Response (200):**
```json
{
  "id": 1,
  "application_id": "APP-1707735600000-XYZ123ABC",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+233123456789",
  "business_name": "John's Business Ltd",
  "business_type": "LLC",
  "business_address": "123 Business Street",
  "city": "Accra",
  "state": "Greater Accra",
  "zip_code": "00233",
  "country": "Ghana",
  "tax_id": "TAX123456",
  "store_name": "John's Store",
  "store_description": "We sell quality products",
  "product_categories": "Electronics,Fashion",
  "status": "pending",
  "admin_notes": null,
  "reviewed_by": null,
  "created_at": "2026-02-12T10:00:00Z",
  "reviewed_at": null
}
```

---

#### 4. Update Application Status (Admin)
**PATCH** `/api/seller-applications/:id`

Update application status and notes.

**Request Body:**
```json
{
  "status": "approved",
  "admin_notes": "Application approved. Excellent credentials.",
  "reviewed_by": "Admin Name"
}
```

**Valid Status Values:**
- `pending`
- `reviewing`
- `approved`
- `rejected`

**Response (200):**
```json
{
  "success": true,
  "message": "Application updated successfully",
  "application": {
    "id": 1,
    "application_id": "APP-1707735600000-XYZ123ABC",
    "status": "approved",
    "admin_notes": "Application approved. Excellent credentials.",
    "reviewed_by": "Admin Name",
    "reviewed_at": "2026-02-12T16:00:00Z"
  }
}
```

---

## 🔒 Authentication & Security

### JWT Tokens
All authenticated endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Token Storage
- Store tokens securely (e.g., httpOnly cookies, secure storage)
- Never expose tokens in URLs or logs
- Implement token refresh mechanism for production

### Password Requirements
- Minimum 6 characters (increase in production)
- Hash using bcrypt with salt rounds of 10

### Escrow System
- Payments are held in escrow when orders are created
- Released only when buyer confirms delivery
- Protects both buyers and sellers

---

## 📊 Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Access denied |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 410 | Gone - Resource expired |
| 500 | Internal Server Error |

---

## 🎯 Common Error Response Format

```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

---

## 📝 Notes

1. **Pagination**: Most list endpoints support `page` and `limit` query parameters
2. **Slugs**: Used instead of IDs for SEO-friendly URLs
3. **Escrow**: Orders use escrow system for secure transactions
4. **Email Verification**: Sellers must verify email before login
5. **Trust Levels**: Seller trust levels range from 1-5 based on performance
6. **File Uploads**: Maximum 5MB for delivery proof photos
7. **CORS**: Configured via `FRONTEND_URL` environment variable

---

## 🔄 API Versioning

Current version: **v1.0.0**  
No versioning in URL path yet. Will be added as `/api/v2/...` when breaking changes are introduced.

---

## 📞 Support

For API support or questions:
- Email: csetechnologies6@gmail.com
- Documentation: See `/ARCHITECTURE.md` for system architecture

---

**Last Updated:** February 12, 2026  
**API Status:** Production Ready ✅
