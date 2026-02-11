# KudiMall - Destination Marketplace & Social Commerce Platform for 

![KudiMall](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Overview

**KudiMall is both a destination marketplace and a social-commerce checkout platform.**

KudiMall provides two equal entry points for buyers:

🟢 **Entry Point A: Social Media → KudiMall**
- Buyers see products on TikTok, Instagram, WhatsApp, or Facebook
- Click seller's KudiMall link
- Complete secure checkout with escrow protection

🟢 **Entry Point B: Direct Visit → KudiMall**
- Buyers open KudiMall app or website
- Browse stores, sellers, categories, and products
- Buy directly with confidence

Both paths lead to the same trusted checkout experience with escrow protection.

## Key Features

### For Buyers
- **Browse Categories**: Discover products across multiple categories
- **Search & Filters**: Find products by name, category, seller, price, and trust level
- **Seller Storefronts**: Visit verified seller stores with brand banners and product listings
- **Escrow Protection**: Every purchase is protected - money held until delivery confirmed
- **Verified Sellers**: Shop from trusted sellers with proven track records
- **Reviews & Ratings**: Read customer reviews and seller ratings
- **Follow Stores**: Follow favorite sellers for updates

### For Sellers
- **Branded Storefronts**: Create professional store pages with banners and branding
- **Product Management**: List and manage products with categories
- **Trust Levels**: Build reputation through sales and positive reviews
- **Verification Badges**: Get verified to build buyer confidence
- **Organic Traffic**: Receive direct traffic from KudiMall marketplace
- **Social Commerce Ready**: Share product links on social media platforms

### Platform Features
- **Dual-Entry Model**: Social commerce links + direct marketplace browsing
- **Secure Escrow**: Built-in payment protection for all transactions
- **Trust System**: 5-level trust rating system for sellers
- **Mobile-First Design**: Responsive design for all devices
- **Real-time Search**: Fast product, seller, and category search

## Technology Stack

### Backend
- **Node.js** with Express
- **SQLite** database (easily upgradeable to PostgreSQL/MySQL)
- **RESTful API** architecture

### Frontend
- **React** with React Router
- **Modern CSS** with responsive design
- **Axios** for API communication

## Project Structure

```
kudimall/
├── server/                  # Backend API
│   ├── models/             # Database models
│   ├── routes/             # API route handlers
│   ├── scripts/            # Database initialization scripts
│   └── index.js            # Server entry point
├── client/                 # Frontend React app
│   ├── public/            # Static assets
│   └── src/
│       ├── components/    # Reusable components
│       ├── pages/        # Page components
│       ├── services/     # API service layer
│       ├── styles/       # CSS stylesheets
│       └── App.js        # Main app component
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/iessel-git/kudimall.git
cd kudimall
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Initialize the database**
```bash
cd server
npm run init-db
npm run seed-db
cd ..
```

4. **Start the development servers**
```bash
npm run dev
```

This will start:
- Backend API server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

### Individual Setup

**Backend Only:**
```bash
cd server
npm install
cp .env.example .env
npm run init-db
npm run seed-db
npm start
```

**Frontend Only:**
```bash
cd client
npm install
npm start
```

## API Endpoints

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:slug` - Get single category
- `GET /api/categories/:slug/products` - Get products in category

### Sellers
- `GET /api/sellers` - Get all sellers (with optional filters)
- `GET /api/sellers/:slug` - Get seller details
- `GET /api/sellers/:slug/products` - Get seller's products
- `GET /api/sellers/:slug/reviews` - Get seller reviews
- `POST /api/sellers/:slug/follow` - Follow a seller
- `DELETE /api/sellers/:slug/follow` - Unfollow a seller

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:slug` - Get product details
- `GET /api/products/:slug/reviews` - Get product reviews

### Search
- `GET /api/search?q=query&type=all` - Search products, sellers, categories

### Orders
- `POST /api/orders` - Create new order (checkout)
- `GET /api/orders/:order_number` - Get order details

### Reviews
- `POST /api/reviews` - Create a review

## Database Schema

### Tables
1. **categories** - Product categories
2. **sellers** - Seller/store information with trust levels
3. **products** - Product listings
4. **orders** - Orders with escrow status
5. **reviews** - Product and seller reviews
6. **follows** - Buyer-seller follow relationships

## Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=5000
NODE_ENV=development
DATABASE_PATH=./kudimall.db
```

## Messaging & Value Proposition

### Homepage Copy
> "Shop directly on KudiMall or buy from links shared on social media. Either way, every purchase is protected."

### Trust Statement
> "Whether you find us through social media or come directly to KudiMall, you'll always buy with confidence."

### One-Line Investor Explanation
> "KudiMall is both a destination marketplace and a social-commerce checkout platform."

## Core Benefits

### For Buyers
✅ Direct marketplace with categories, search, and discovery
✅ Trust-based seller verification system
✅ Escrow protection on every purchase
✅ Works seamlessly from social media links
✅ Transparent reviews and ratings

### For Sellers
✅ Don't depend solely on social media
✅ Get organic traffic from KudiMall marketplace
✅ Build a verified storefront with branding
✅ Grow without ads through trust and reputation
✅ Access to repeat buyers

## Future Enhancements

- [ ] User authentication and accounts
- [ ] Payment gateway integration (Paystack, Flutterwave)
- [ ] Real-time notifications
- [ ] Seller dashboard with analytics
- [ ] Advanced filtering (location, price ranges)
- [ ] Wishlist functionality
- [ ] Chat/messaging between buyers and sellers
- [ ] Mobile apps (iOS & Android)
- [ ] Admin panel for platform management

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Contact & Support

For questions, issues, or support:
- Create an issue on GitHub
- Email: support@kudimall.com (placeholder)

---

**Built with ❤️ for African commerce**
