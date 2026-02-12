# KudiMall Setup and Testing Guide

## Quick Start

### 1. Install All Dependencies
```bash
npm run install:all
```

This command will install:
- Root dependencies (concurrently, nodemon)
- Server dependencies (Express, PostgreSQL, CORS, etc.)
- Client dependencies (React, React Router, Axios, etc.)

### 2. Set Up PostgreSQL Database
Ensure you have PostgreSQL installed and running on your system.

Create a database for KudiMall:
```bash
psql -U postgres
CREATE DATABASE kudimall_dev;
\q
```

Create a `.env` file in the `server` directory with your database credentials:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kudimall_dev
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. Initialize Database
```bash
cd server
npm run init-db
```

This creates the PostgreSQL database schema with all required tables and seeds sample data:
- users
- categories
- sellers
- products
- orders
- reviews
- follows
- coupons
- carts

And populates the database with:
- 3 product categories
- 2 test users (buyer and seller)
- 1 verified seller
- 3 sample products
- 3 coupons

### 4. Start Development Servers
```bash
# From root directory
npm run dev
```

This starts both:
- Backend API on http://localhost:5000
- Frontend React app on http://localhost:3000

OR start them individually:

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## Testing the Application

### Backend API Testing

The backend runs on `http://localhost:5000`. Test endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Get all categories
curl http://localhost:5000/api/categories

# Get all sellers
curl http://localhost:5000/api/sellers

# Get featured products
curl http://localhost:5000/api/products?featured=true

# Search for products
curl http://localhost:5000/api/search?q=phone

# Get specific product
curl http://localhost:5000/api/products/iphone-15-pro-max

# Get seller store
curl http://localhost:5000/api/sellers/techhub-nigeria

# Get seller's products
curl http://localhost:5000/api/sellers/techhub-nigeria/products
```

### Frontend Testing

Visit `http://localhost:3000` and test:

1. **Homepage**
   - Hero section with value proposition
   - Categories grid (8 categories)
   - Featured sellers (4 verified sellers)
   - Featured products grid
   - Trust section explaining benefits

2. **Search**
   - Use search bar in header
   - Try searching for: "phone", "dress", "beauty", "TechHub"
   - Results show products, sellers, and categories

3. **Category Browsing**
   - Click any category from homepage
   - View all products in that category
   - Filter by trust level, price, availability

4. **Seller Storefront**
   - Click on any seller card
   - View seller profile with banner
   - Browse seller's products
   - Read customer reviews
   - Follow/unfollow functionality

5. **Product Detail Page**
   - Click on any product
   - View full product details
   - See seller information and trust level
   - Check escrow protection badge
   - Read product reviews
   - Click "Buy Now" for checkout

6. **Secure Checkout**
   - From product page, click "Buy Now"
   - Fill in buyer information
   - See order summary with escrow notice
   - Complete checkout

## Key Features Demonstrated

### Dual Entry Model
✅ **Social Commerce**: Product pages can be accessed directly via URL (shareable on social media)
✅ **Direct Marketplace**: Users can browse, search, and discover products organically

### Trust & Security
✅ **Escrow Protection**: Displayed on every product and checkout page
✅ **Seller Verification**: Verified badges for trusted sellers
✅ **Trust Levels**: 5-star trust rating system
✅ **Reviews & Ratings**: Customer feedback system

### Discovery Features
✅ **Category Browsing**: 8 product categories
✅ **Search**: Find products, sellers, and categories
✅ **Filters**: Price, trust level, availability
✅ **Featured Items**: Highlighted products and sellers

### Seller Features
✅ **Branded Storefronts**: Professional store pages
✅ **Product Management**: Multiple products per seller
✅ **Trust Building**: Verification and ratings
✅ **Follow System**: Buyers can follow stores

## Sample Data

### Sellers
1. **TechHub Nigeria** (Trust Level 5, Verified)
   - Electronics
   - Lagos, Nigeria

2. **Fashion Forward** (Trust Level 4, Verified)
   - Fashion & Clothing
   - Abuja, Nigeria

3. **Beauty Essentials** (Trust Level 5, Verified)
   - Beauty & Health
   - Port Harcourt, Nigeria

4. **Home Comfort Store** (Trust Level 3, Verified)
   - Home & Living
   - Ibadan, Nigeria

### Sample Products
- iPhone 15 Pro Max (₦1,250,000)
- Samsung Galaxy S24 Ultra (₦1,150,000)
- MacBook Pro 14" M3 (₦2,500,000)
- African Print Dress (₦15,000)
- Denim Jeans (₦12,000)
- Sneakers (₦35,000)
- Shea Butter Body Cream (₦8,000)
- And more...

## Architecture

### Backend (Node.js + Express)
- RESTful API design
- PostgreSQL database (properly configured)
- Modular route structure
- Database abstraction layer

### Frontend (React)
- Component-based architecture
- React Router for navigation
- Axios for API calls
- Responsive CSS design

## Environment Configuration

### Server Environment Variables
Create `server/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_PATH=./kudimall.db
```

### Client Environment Variables (Optional)
Create `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Production Deployment

### Backend
```bash
cd server
npm install --production
npm start
```

### Frontend
```bash
cd client
npm run build
# Serve the build folder with any static server
```

## Troubleshooting

### Database Issues
```bash
# Reset database
cd server
rm kudimall.db
npm run init-db
npm run seed-db
```

### Port Conflicts
If port 5000 or 3000 is busy:
```bash
# Change server port
PORT=5001 npm run dev

# Client will use a different port automatically
```

### Dependencies Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Add Authentication**: User login and registration
2. **Payment Integration**: Connect Paystack or Flutterwave
3. **Image Uploads**: Allow sellers to upload product images
4. **Real-time Notifications**: Order updates and messages
5. **Mobile Apps**: React Native versions
6. **Admin Dashboard**: Platform management tools

## Support

For issues or questions:
- Check the README.md
- Review API documentation in code comments
- Check server logs for errors
- Verify database has been initialized and seeded
