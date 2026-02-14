/**
 * Cart & Checkout Critical Path Tests
 * Tests shopping cart operations and checkout flow
 */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const cartRoutes = require('../routes/cart');

jest.mock('../models/database', () => ({
  query: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  run: jest.fn()
}));

const db = require('../models/database');

const app = express();
app.use(bodyParser.json());
app.use('/api/cart', cartRoutes);

// Helper to generate test JWT token
const generateTestToken = (buyerId) => {
  return jwt.sign(
    { userId: buyerId, type: 'buyer' },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
};

describe('Cart & Checkout Critical Path', () => {
  
  let testToken;
  
  beforeEach(() => {
    jest.clearAllMocks();
    testToken = generateTestToken(1);
  });

  describe('Cart Operations', () => {
    
    test('POST /api/cart - Should add item to cart', async () => {
      const mockCart = { id: 1 };
      const mockProduct = { id: 1, stock: 10, price: 1000, seller_id: 1 };
      const mockCartItem = { id: 1 };

      db.get
        .mockResolvedValueOnce(mockCart) // Get or create cart
        .mockResolvedValueOnce(mockProduct) // Check product
        .mockResolvedValueOnce(null); // Check existing cart item
      
      db.run.mockResolvedValueOnce({ rows: [mockCartItem] }); // Insert cart item
      db.get.mockResolvedValueOnce({ count: 1 }); // Get cart count

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          product_id: 1,
          quantity: 2
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Added to cart');
    });

    test('POST /api/cart - Should reject out-of-stock items', async () => {
      const mockCart = { id: 1 };
      const mockProduct = { id: 1, stock: 0, price: 1000 };
      
      db.get
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockProduct);

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          product_id: 1,
          quantity: 1
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/cart - Should update quantity if item already in cart', async () => {
      const mockCart = { id: 1 };
      const mockProduct = { id: 1, stock: 10, price: 1000, seller_id: 1 };
      const existingItem = { id: 1, quantity: 2, price: 1000, cart_id: 1, product_id: 1 };
      
      db.get
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(existingItem);
      
      db.run.mockResolvedValueOnce({});
      db.get.mockResolvedValueOnce({ count: 1 });

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          product_id: 1,
          quantity: 2
        })
        .expect(201);

      expect(response.body).toHaveProperty('message');
    });

    test('GET /api/cart - Should retrieve cart items', async () => {
      const mockCart = { id: 1 };
      const mockCartItems = [
        {
          id: 1,
          product_id: 1,
          name: 'Product A',
          quantity: 2,
          unit_price: 1000,
          subtotal: 2000,
          image_url: 'image1.jpg',
          seller_name: 'Seller 1',
          seller_slug: 'seller-1',
          seller_id: 1,
          stock: 10,
          is_available: true
        },
        {
          id: 2,
          product_id: 2,
          name: 'Product B',
          quantity: 1,
          unit_price: 2000,
          subtotal: 2000,
          image_url: 'image2.jpg',
          seller_name: 'Seller 2',
          seller_slug: 'seller-2',
          seller_id: 2,
          stock: 5,
          is_available: true
        }
      ];

      db.get.mockResolvedValueOnce(mockCart);
      db.all
        .mockResolvedValueOnce(mockCartItems) // Cart items
        .mockResolvedValueOnce([]); // Saved items

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(2);
    });

    test('PUT /api/cart/:id - Should update cart item quantity', async () => {
      const mockItem = {
        id: 1,
        user_id: 1,
        stock: 10
      };

      db.get.mockResolvedValueOnce(mockItem);
      db.run.mockResolvedValueOnce({});

      const response = await request(app)
        .put('/api/cart/1')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ quantity: 5 })
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    test('PUT /api/cart/:id - Should reject quantity exceeding stock', async () => {
      const mockItem = { id: 1, user_id: 1, stock: 3 };
      db.get.mockResolvedValueOnce(mockItem);

      const response = await request(app)
        .put('/api/cart/1')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ quantity: 10 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('DELETE /api/cart/:id - Should remove item from cart', async () => {
      const mockItem = { id: 1, user_id: 1 };
      db.get.mockResolvedValueOnce(mockItem);
      db.run.mockResolvedValueOnce({});

      const response = await request(app)
        .delete('/api/cart/1')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    test('DELETE /api/cart - Should clear entire cart', async () => {
      const mockCart = { id: 1 };
      db.get.mockResolvedValueOnce(mockCart);
      db.run.mockResolvedValueOnce({});

      const response = await request(app)
        .delete('/api/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Cart Calculations', () => {
    
    test('GET /api/cart/total - Should calculate cart total correctly', async () => {
      const mockCart = { id: 1 };
      const mockTotal = { total: '9000', item_count: '6' };

      db.get
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(mockTotal);

      const response = await request(app)
        .get('/api/cart/total')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('total', 9000);
    });
  });

  describe('Authentication & Authorization', () => {
    
    test('Should reject requests without authentication', async () => {
      await request(app)
        .get('/api/cart')
        .expect(401);
    });

    test('Should reject requests with invalid token', async () => {
      await request(app)
        .get('/api/cart')
        .set('Authorization', 'Bearer invalid-token-123')
        .expect(401);
    });

    test('Should reject seller token for buyer cart operations', async () => {
      const sellerToken = jwt.sign(
        { userId: 1, type: 'seller' },
        process.env.JWT_SECRET || 'test-secret-key',
        { expiresIn: '1h' }
      );

      await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(403);
    });
  });

  describe('Edge Cases', () => {
    
    test('POST /api/cart - Should reject negative quantity', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          product_id: 1,
          quantity: -5
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/cart - Should reject zero quantity', async () => {
      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          product_id: 1,
          quantity: 0
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/cart - Should reject non-existent product', async () => {
      const mockCart = { id: 1 };
      db.get
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce(null); // Product not found

      const response = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          product_id: 99999,
          quantity: 1
        })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    test('GET /api/cart - Should return empty array for empty cart', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
