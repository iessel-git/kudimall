/**
 * Authentication Critical Path Tests
 * Tests buyer and seller authentication flows
 */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const buyerAuthRoutes = require('../routes/buyerAuth');
const sellerAuthRoutes = require('../routes/auth');

// Mock database
jest.mock('../models/database', () => ({
  query: jest.fn()
}));

const db = require('../models/database');

// Setup test app
const app = express();
app.use(bodyParser.json());
app.use('/api/buyer-auth', buyerAuthRoutes);
app.use('/api/auth', sellerAuthRoutes);

describe('Authentication Critical Path', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Buyer Authentication', () => {
    
    test('POST /api/buyer-auth/signup - Should create new buyer account', async () => {
      // Mock successful signup
      db.query
        .mockResolvedValueOnce({ rows: [] }) // Check email doesn't exist
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            email: 'buyer@test.com', 
            name: 'Test Buyer' 
          }] 
        }); // Insert new buyer

      const response = await request(app)
        .post('/api/buyer-auth/signup')
        .send({
          email: 'buyer@test.com',
          password: 'SecurePass123!',
          name: 'Test Buyer',
          phone: '+234801234567'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('buyer');
      expect(response.body.buyer.email).toBe('buyer@test.com');
    });

    test('POST /api/buyer-auth/signup - Should reject duplicate email', async () => {
      // Mock email already exists
      db.query.mockResolvedValueOnce({ 
        rows: [{ id: 1, email: 'existing@test.com' }] 
      });

      const response = await request(app)
        .post('/api/buyer-auth/signup')
        .send({
          email: 'existing@test.com',
          password: 'SecurePass123!',
          name: 'Test Buyer'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/buyer-auth/login - Should authenticate valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('SecurePass123!', 10);
      
      // Mock successful login
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'buyer@test.com',
          password: hashedPassword,
          name: 'Test Buyer'
        }]
      });

      const response = await request(app)
        .post('/api/buyer-auth/login')
        .send({
          email: 'buyer@test.com',
          password: 'SecurePass123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('buyer');
    });

    test('POST /api/buyer-auth/login - Should reject invalid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('SecurePass123!', 10);
      
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'buyer@test.com',
          password: hashedPassword
        }]
      });

      const response = await request(app)
        .post('/api/buyer-auth/login')
        .send({
          email: 'buyer@test.com',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/buyer-auth/login - Should reject non-existent user', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .post('/api/buyer-auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'AnyPassword123!'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Seller Authentication', () => {
    
    test('POST /api/auth/signup - Should create new seller account', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [] }) // Check email doesn't exist
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            email: 'seller@test.com',
            shop_name: 'Test Shop',
            status: 'pending'
          }] 
        });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'seller@test.com',
          password: 'SellerPass123!',
          shop_name: 'Test Shop',
          phone: '+234801234567'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.seller).toHaveProperty('shop_name');
    });

    test('POST /api/auth/login - Should authenticate approved seller', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('SellerPass123!', 10);
      
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'seller@test.com',
          password: hashedPassword,
          shop_name: 'Test Shop',
          status: 'approved'
        }]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'seller@test.com',
          password: 'SellerPass123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
    });

    test('POST /api/auth/login - Should reject pending seller', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('SellerPass123!', 10);
      
      db.query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          email: 'seller@test.com',
          password: hashedPassword,
          status: 'pending'
        }]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'seller@test.com',
          password: 'SellerPass123!'
        });

      expect(response.status).toBe(403);
    });
  });

  describe('Rate Limiting', () => {
    test('Should enforce rate limits on login attempts', async () => {
      db.query.mockResolvedValue({ rows: [] });

      // Make 6 failed login attempts
      const attempts = Array(6).fill(null).map(() => 
        request(app)
          .post('/api/buyer-auth/login')
          .send({ email: 'test@test.com', password: 'wrong' })
      );

      const responses = await Promise.all(attempts);
      
      // Last attempt should be rate limited (429)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
