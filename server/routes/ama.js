const express = require('express');
const router = express.Router();
const db = require('../models/database');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Validate JWT_SECRET is set (critical security requirement)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  logger.error('FATAL: JWT_SECRET environment variable is not set. This is required for security.');
  logger.error('Please set JWT_SECRET in your .env file to a strong random string (minimum 32 characters).');
  process.exit(1);
}

// Optional buyer authentication middleware
const optionalBuyerAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, buyer) => {
      if (!err) {
        req.buyer = buyer;
      }
    });
  }
  next();
};

// Calculate delivery fee based on location
const calculateDeliveryFee = (city) => {
  if (!city) return { fee: 0, message: 'Please provide a city for delivery fee calculation' };
  
  const cityLower = city.toLowerCase().trim();
  
  // Major cities - Free delivery
  const majorCities = ['accra', 'kumasi', 'tema', 'takoradi', 'cape coast', 'tamale'];
  if (majorCities.some(c => cityLower.includes(c))) {
    return { fee: 0, city: city, message: `Free delivery to ${city}! 🎉` };
  }
  
  // Regional capitals - ₵10 delivery
  const regionalCapitals = [
    'sunyani', 'koforidua', 'ho', 'wa', 'bolgatanga', 
    'sekondi', 'obuasi', 'tarkwa', 'techiman'
  ];
  if (regionalCapitals.some(c => cityLower.includes(c))) {
    return { fee: 10, city: city, message: `Delivery to ${city} costs ₵10` };
  }
  
  // Remote areas - ₵20 delivery
  return { fee: 20, city: city, message: `Delivery to ${city} costs ₵20` };
};

// POST /api/ama/chat - Main chatbot endpoint
router.post('/chat', optionalBuyerAuth, async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const query = message.toLowerCase().trim();
    const response = { message: '', data: null, actions: [] };

    // Site information queries
    if (query.includes('what is kudimall') || query.includes('about kudimall') || query.includes('tell me about')) {
      response.message = `Hi! I'm Ama, your KudiMall shopping assistant! 🛍️\n\nKudiMall is Ghana's trusted online marketplace where buyers and sellers connect securely. Here's what makes us special:\n\n✅ **Secure Escrow System** - Your money is held safely until you confirm delivery\n🏪 **Verified Sellers** - Shop from trusted local businesses\n🚚 **Multiple Delivery Options** - From major cities to remote areas\n💳 **Buyer Protection** - Full refund if items don't match description\n📱 **Easy Shopping** - Browse products, add to cart, checkout safely\n\nHow can I help you shop today?`;
      return res.json(response);
    }

    // Delivery fee calculation
    if (query.includes('delivery') && (query.includes('fee') || query.includes('cost') || query.includes('price') || query.includes('how much'))) {
      const cityMatch = query.match(/to\s+(\w+)/i) || query.match(/in\s+(\w+)/i) || query.match(/(\w+)\s+delivery/i);
      
      if (cityMatch) {
        const deliveryInfo = calculateDeliveryFee(cityMatch[1]);
        response.message = `🚚 ${deliveryInfo.message}\n\nOur delivery rates:\n• Major cities (Accra, Kumasi, Tema, etc.): **FREE** 🎉\n• Regional capitals: **₵10**\n• Remote areas: **₵20**\n\nWant to search for products or add items to your cart?`;
        response.data = { deliveryFee: deliveryInfo.fee, city: deliveryInfo.city };
      } else {
        response.message = `🚚 Our delivery rates are:\n\n• **Major Cities** (Accra, Kumasi, Tema, Takoradi, Cape Coast, Tamale): **FREE** 🎉\n• **Regional Capitals**: **₵10**\n• **Remote Areas**: **₵20**\n\nWhich city would you like to know about?`;
      }
      return res.json(response);
    }

    // Product search
    if (query.includes('search') || query.includes('find') || query.includes('looking for') || query.includes('show me')) {
      const searchTerms = query
        .replace(/(search|find|looking for|show me|products?|items?)/gi, '')
        .trim();

      if (searchTerms.length > 2) {
        const products = await db.all(
          `SELECT p.*, s.name as seller_name, s.slug as seller_slug, c.name as category_name
           FROM products p
           LEFT JOIN sellers s ON p.seller_id = s.id
           LEFT JOIN categories c ON p.category_id = c.id
           WHERE p.name ILIKE $1 OR p.description ILIKE $1
           LIMIT 10`,
          [`%${searchTerms}%`]
        );

        if (products.length > 0) {
          const isLoggedIn = !!req.buyer;
          response.message = `I found ${products.length} product(s) matching "${searchTerms}"! 🔍\n\nHere's what I found:`;
          response.data = { products, isLoggedIn };
          response.actions = products.slice(0, 5).flatMap(p => [
            {
              type: 'view_product',
              label: `View ${p.name}`,
              productId: p.id,
              productSlug: p.slug
            },
            ...(isLoggedIn ? [{
              type: 'add_to_cart',
              label: `Add to Cart`,
              productId: p.id,
              productName: p.name
            }] : [])
          ]);
        } else {
          response.message = `I couldn't find any products matching "${searchTerms}". 😔\n\nTry searching for:\n• Electronics\n• Fashion\n• Home & Garden\n• Sports\n\nOr browse our categories!`;
        }
      } else {
        response.message = `What product are you looking for? Try:\n• "search for phones"\n• "find laptops"\n• "show me shoes"\n\nI'll help you find the best deals! 🔍`;
      }
      return res.json(response);
    }

    // Price inquiry
    if (query.includes('price') || query.includes('how much') || query.includes('cost')) {
      response.message = `I can help you find prices! 💰\n\nTell me what product you're interested in, like:\n• "What's the price of iPhone 13?"\n• "How much is a Samsung TV?"\n• "Show me laptop prices"\n\nOr I can search our entire catalog for you!`;
      return res.json(response);
    }

    // Cart functionality - Add to cart
    if (query.includes('add') && (query.includes('cart') || query.includes('to my cart'))) {
      // Extract product name from query
      const productName = query
        .replace(/(add|to|cart|my|the|a|an|please|can you)/gi, '')
        .trim();

      if (!req.buyer) {
        response.message = `I'd love to add items to your cart! 🛒\n\nPlease log in first so I can save your items. You can:\n• Create a buyer account (quick & free!)\n• Or log in if you already have one\n\nOnce you're logged in, just tell me what to add!`;
        response.actions = [
          { type: 'navigate', label: 'Login', path: '/buyer/login' },
          { type: 'navigate', label: 'Sign Up', path: '/buyer/signup' }
        ];
        return res.json(response);
      }

      if (productName.length > 2) {
        // Search for the product
        const products = await db.all(
          `SELECT p.*, s.name as seller_name, s.slug as seller_slug
           FROM products p
           LEFT JOIN sellers s ON p.seller_id = s.id
           WHERE p.name ILIKE $1
           LIMIT 5`,
          [`%${productName}%`]
        );

        if (products.length === 1) {
          // Exact match - add to cart automatically
          const product = products[0];
          response.message = `Perfect! I found "${product.name}" for ₵${product.price.toLocaleString()}.\n\nClick the button below to add it to your cart! 🛒`;
          response.data = { product };
          response.actions = [
            {
              type: 'add_to_cart',
              label: `Add "${product.name}" to Cart`,
              productId: product.id,
              productName: product.name
            },
            {
              type: 'view_product',
              label: 'View Details',
              productSlug: product.slug
            }
          ];
        } else if (products.length > 1) {
          // Multiple matches - let user choose
          response.message = `I found ${products.length} products matching "${productName}"!\n\nWhich one would you like to add to your cart?`;
          response.data = { products };
          response.actions = products.map(p => ({
            type: 'add_to_cart',
            label: `Add ${p.name} - ₵${p.price.toLocaleString()}`,
            productId: p.id,
            productName: p.name
          }));
        } else {
          response.message = `I couldn't find "${productName}" in our catalog. 😔\n\nTry:\n• Searching with different keywords\n• Browsing our categories\n• Or ask me to "search for [product]"`;
          response.actions = [
            { type: 'navigate', label: 'Browse Categories', path: '/' }
          ];
        }
      } else {
        response.message = `What would you like to add to your cart? 🛒\n\nTell me the product name, like:\n• "Add iPhone to cart"\n• "Add Samsung TV to cart"\n• "Add running shoes to cart"\n\nI'll find it and add it for you!`;
      }
      return res.json(response);
    }

    // Categories inquiry
    if (query.includes('categories') || query.includes('what can i buy') || query.includes('what do you sell')) {
      const categories = await db.all('SELECT * FROM categories ORDER BY name');
      
      response.message = `We have amazing products across ${categories.length} categories! 🏪\n\n${categories.map(c => `• ${c.name}`).join('\n')}\n\nWhich category interests you?`;
      response.data = { categories };
      response.actions = categories.map(c => ({
        type: 'view_category',
        label: c.name,
        categorySlug: c.slug
      }));
      return res.json(response);
    }

    // Deals inquiry
    if (query.includes('deal') || query.includes('discount') || query.includes('sale') || query.includes('offer')) {
      response.message = `🔥 Check out our Deals section for amazing discounts!\n\nWe have:\n• Flash deals\n• Daily specials\n• Seasonal offers\n• Bundle deals\n\nVisit the Deals page to see all current offers!`;
      response.actions = [
        { type: 'navigate', label: 'View Deals', path: '/deals' }
      ];
      return res.json(response);
    }

    // Checkout question
    if (query.includes('checkout') || query.includes('buy now') || query.includes('purchase')) {
      response.message = `I can help you add items to your cart, but you'll need to complete the checkout yourself! 🛒\n\nHere's the process:\n1. Browse products\n2. Add to cart (I can help!)\n3. Go to cart and checkout\n4. Enter delivery details\n5. Place order securely\n\nYour payment is held in escrow until delivery confirmation. Safe & secure! 🔒`;
      return res.json(response);
    }

    // Seller information
    if (query.includes('seller') || query.includes('shop') || query.includes('store')) {
      response.message = `Want to explore our sellers? 🏪\n\nKudiMall has verified sellers offering quality products. You can:\n• Browse all sellers\n• Visit individual seller stores\n• Check seller ratings & reviews\n• Contact sellers directly\n\nAll sellers are verified for your safety!`;
      response.actions = [
        { type: 'navigate', label: 'Browse Sellers', path: '/search?type=sellers' }
      ];
      return res.json(response);
    }

    // Help/Support
    if (query.includes('help') || query.includes('support') || query.includes('contact')) {
      response.message = `I'm here to help! 💁‍♀️\n\nI can assist with:\n✅ Finding products\n✅ Calculating delivery fees\n✅ Adding items to cart\n✅ Explaining how KudiMall works\n✅ Answering questions about categories, sellers, deals\n\nWhat would you like to know?`;
      return res.json(response);
    }

    // Greeting
    if (query.match(/^(hi|hello|hey|greetings|good morning|good afternoon|good evening)/)) {
      const greeting = req.buyer ? `Hi ${req.buyer.name}! 👋` : `Hi there! 👋`;
      response.message = `${greeting} I'm Ama, your KudiMall shopping assistant!\n\nHow can I help you today? I can:\n• Search for products 🔍\n• Calculate delivery fees 🚚\n• Add items to your cart 🛒\n• Tell you about deals & offers 🔥\n• Answer questions about KudiMall\n\nWhat are you looking for?`;
      return res.json(response);
    }

    // Default response
    response.message = `I'm Ama, your shopping assistant! 🛍️\n\nI can help you with:\n• Searching products\n• Checking prices\n• Calculating delivery fees\n• Adding items to cart\n• Browsing categories & deals\n• Learning about KudiMall\n\nWhat would you like to do? Just ask me anything!`;
    
    res.json(response);
  } catch (error) {
    console.error('Ama chat error:', error);
    res.status(500).json({ 
      error: 'Sorry, I encountered an error. Please try again!',
      message: "Oops! Something went wrong on my end. 😅 Please try asking again!"
    });
  }
});

// GET /api/ama/info - Get site information
router.get('/info', async (req, res) => {
  try {
    const [productsCount, sellersCount, categoriesCount] = await Promise.all([
      db.get('SELECT COUNT(*) as count FROM products'),
      db.get('SELECT COUNT(*) as count FROM sellers WHERE is_verified = true'),
      db.get('SELECT COUNT(*) as count FROM categories')
    ]);

    res.json({
      site: 'KudiMall',
      description: "Ghana's trusted online marketplace",
      stats: {
        products: productsCount.count,
        sellers: sellersCount.count,
        categories: categoriesCount.count
      },
      features: [
        'Secure Escrow Payment System',
        'Verified Sellers',
        'Buyer Protection',
        'Multiple Delivery Options',
        'Easy Returns & Refunds'
      ],
      deliveryRates: {
        majorCities: { fee: 0, cities: ['Accra', 'Kumasi', 'Tema', 'Takoradi', 'Cape Coast', 'Tamale'] },
        regionalCapitals: { fee: 10, cities: ['Sunyani', 'Koforidua', 'Ho', 'Wa', 'Bolgatanga'] },
        remoteAreas: { fee: 20 }
      }
    });
  } catch (error) {
    console.error('Error fetching site info:', error);
    res.status(500).json({ error: 'Failed to fetch site information' });
  }
});

module.exports = router;
