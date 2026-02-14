/**
 * Order & Escrow Critical Path Tests
 * Tests order creation, escrow holding, and payment release
 * MOST CRITICAL: These flows involve money and must be bulletproof
 */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const ordersRoutes = require('../routes/orders');

jest.mock('../models/database', () => ({
  query: jest.fn()
}));

const db = require('../models/database');

const app = express();
app.use(bodyParser.json());
app.use('/api/orders', ordersRoutes);

const generateTestToken = (userId, type = 'buyer') => {
  return jwt.sign(
    { userId, type },
    process.env.JWT_SECRET || 'test-secret-key',
    { expiresIn: '1h' }
  );
};

describe('Order & Escrow Critical Path', () => {
  
  let buyerToken;
  let sellerToken;
  
  beforeEach(() => {
    jest.clearAllMocks();
    buyerToken = generateTestToken(1, 'buyer');
    sellerToken = generateTestToken(1, 'seller');
  });

  describe('Order Creation', () => {
    
    test('POST /api/orders - Should create order with escrow', async () => {
      const mockOrder = {
        id: 1,
        buyer_id: 1,
        total_amount: 5000,
        payment_status: 'escrow',
        delivery_status: 'pending',
        created_at: new Date()
      };

      const mockOrderItems = [
        { product_id: 1, quantity: 2, price: 1000 },
        { product_id: 2, quantity: 1, price: 3000 }
      ];

      db.query
        .mockResolvedValueOnce({ rows: mockOrderItems }) // Get cart items
        .mockResolvedValueOnce({ rows: [{ stock: 10 }] }) // Check stock for product 1
        .mockResolvedValueOnce({ rows: [{ stock: 5 }] })  // Check stock for product 2
        .mockResolvedValueOnce({ rows: [mockOrder] })     // Create order
        .mockResolvedValueOnce({ rows: [] })              // Insert order items
        .mockResolvedValueOnce({ rows: [] })              // Clear cart
        .mockResolvedValueOnce({ rows: [] });             // Update stock

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          shipping_address: '123 Test St, Lagos',
          phone: '+234801234567'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('payment_status', 'escrow');
      expect(response.body).toHaveProperty('total_amount', 5000);
    });

    test('POST /api/orders - Should reject order with insufficient stock', async () => {
      const mockOrderItems = [
        { product_id: 1, quantity: 5, price: 1000 }
      ];

      db.query
        .mockResolvedValueOnce({ rows: mockOrderItems })
        .mockResolvedValueOnce({ rows: [{ stock: 2 }] }); // Only 2 in stock, need 5

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          shipping_address: '123 Test St, Lagos',
          phone: '+234801234567'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/stock|available/i);
    });

    test('POST /api/orders - Should reject order from empty cart', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // Empty cart

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          shipping_address: '123 Test St, Lagos',
          phone: '+234801234567'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/cart.*empty/i);
    });

    test('POST /api/orders - Should require shipping address', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          phone: '+234801234567'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Order Retrieval', () => {
    
    test('GET /api/orders - Buyer should see their orders', async () => {
      const mockOrders = [
        {
          id: 1,
          buyer_id: 1,
          total_amount: 5000,
          payment_status: 'escrow',
          delivery_status: 'pending'
        },
        {
          id: 2,
          buyer_id: 1,
          total_amount: 3000,
          payment_status: 'completed',
          delivery_status: 'delivered'
        }
      ];

      db.query.mockResolvedValueOnce({ rows: mockOrders });

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('payment_status');
      expect(response.body[0]).toHaveProperty('delivery_status');
    });

    test('GET /api/orders/:id - Should return order details', async () => {
      const mockOrder = {
        id: 1,
        buyer_id: 1,
        total_amount: 5000,
        payment_status: 'escrow',
        delivery_status: 'pending',
        shipping_address: '123 Test St'
      };

      const mockOrderItems = [
        { product_id: 1, product_name: 'Product A', quantity: 2, price: 1000 },
        { product_id: 2, product_name: 'Product B', quantity: 1, price: 3000 }
      ];

      db.query
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: mockOrderItems });

      const response = await request(app)
        .get('/api/orders/1')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('items');
      expect(response.body.items).toHaveLength(2);
    });

    test('GET /api/orders/:id - Should prevent accessing others orders', async () => {
      const mockOrder = {
        id: 1,
        buyer_id: 999, // Different buyer
        total_amount: 5000
      };

      db.query.mockResolvedValueOnce({ rows: [mockOrder] });

      const response = await request(app)
        .get('/api/orders/1')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Escrow Payment Flow', () => {
    
    test('Payment should start in escrow status', async () => {
      const mockOrder = {
        id: 1,
        payment_status: 'escrow',
        total_amount: 5000
      };

      db.query.mockResolvedValueOnce({ rows: [mockOrder] });

      const response = await request(app)
        .get('/api/orders/1')
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.body.payment_status).toBe('escrow');
    });

    test('PUT /api/orders/:id/confirm-delivery - Buyer confirms receipt', async () => {
      const mockOrder = {
        id: 1,
        buyer_id: 1,
        payment_status: 'escrow',
        delivery_status: 'delivered'
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ 
          rows: [{ ...mockOrder, delivery_status: 'confirmed', payment_status: 'completed' }] 
        });

      const response = await request(app)
        .put('/api/orders/1/confirm-delivery')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.delivery_status).toBe('confirmed');
      expect(response.body.payment_status).toBe('completed');
    });

    test('PUT /api/orders/:id/confirm-delivery - Should release escrow to seller', async () => {
      const mockOrder = {
        id: 1,
        buyer_id: 1,
        seller_id: 10,
        total_amount: 5000,
        payment_status: 'escrow',
        delivery_status: 'delivered'
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: [{ ...mockOrder, payment_status: 'completed' }] })
        .mockResolvedValueOnce({ rows: [] }); // Release payment to seller

      const response = await request(app)
        .put('/api/orders/1/confirm-delivery')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.payment_status).toBe('completed');
      
      // Verify payment release was called
      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE.*seller/i),
        expect.any(Array)
      );
    });

    test('Should NOT release escrow until delivery confirmed', async () => {
      const mockOrder = {
        id: 1,
        buyer_id: 1,
        payment_status: 'escrow',
        delivery_status: 'pending' // Not delivered yet
      };

      db.query.mockResolvedValueOnce({ rows: [mockOrder] });

      const response = await request(app)
        .put('/api/orders/1/confirm-delivery')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/not.*delivered/i);
    });
  });

  describe('Seller Order Management', () => {
    
    test('GET /api/orders/seller - Seller should see their orders', async () => {
      const mockOrders = [
        {
          id: 1,
          seller_id: 1,
          buyer_name: 'Test Buyer',
          total_amount: 5000,
          payment_status: 'escrow',
          delivery_status: 'pending'
        }
      ];

      db.query.mockResolvedValueOnce({ rows: mockOrders });

      const response = await request(app)
        .get('/api/orders/seller')
        .set('Authorization', `Bearer ${sellerToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('buyer_name');
    });

    test('PUT /api/orders/:id/ship - Seller marks order as shipped', async () => {
      const mockOrder = {
        id: 1,
        seller_id: 1,
        delivery_status: 'pending'
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: [{ ...mockOrder, delivery_status: 'shipped' }] });

      const response = await request(app)
        .put('/api/orders/1/ship')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          tracking_number: 'TRK123456789'
        })
        .expect(200);

      expect(response.body.delivery_status).toBe('shipped');
      expect(response.body).toHaveProperty('tracking_number', 'TRK123456789');
    });

    test('PUT /api/orders/:id/ship - Should prevent shipping other sellers orders', async () => {
      const mockOrder = {
        id: 1,
        seller_id: 999, // Different seller
        delivery_status: 'pending'
      };

      db.query.mockResolvedValueOnce({ rows: [mockOrder] });

      const response = await request(app)
        .put('/api/orders/1/ship')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          tracking_number: 'TRK123456789'
        })
        .expect(403);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Order Cancellation', () => {
    
    test('DELETE /api/orders/:id - Buyer can cancel before shipping', async () => {
      const mockOrder = {
        id: 1,
        buyer_id: 1,
        payment_status: 'escrow',
        delivery_status: 'pending'
      };

      db.query
        .mockResolvedValueOnce({ rows: [mockOrder] })
        .mockResolvedValueOnce({ rows: [{ ...mockOrder, payment_status: 'refunded' }] });

      const response = await request(app)
        .delete('/api/orders/1')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body.payment_status).toBe('refunded');
    });

    test('DELETE /api/orders/:id - Cannot cancel after shipping', async () => {
      const mockOrder = {
        id: 1,
        buyer_id: 1,
        payment_status: 'escrow',
        delivery_status: 'shipped'
      };

      db.query.mockResolvedValueOnce({ rows: [mockOrder] });

      const response = await request(app)
        .delete('/api/orders/1')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toMatch(/shipped|cancel/i);
    });
  });

  describe('Critical Security Tests', () => {
    
    test('Should require authentication for all order operations', async () => {
      await request(app).get('/api/orders').expect(401);
      await request(app).post('/api/orders').expect(401);
      await request(app).get('/api/orders/1').expect(401);
      await request(app).put('/api/orders/1/confirm-delivery').expect(401);
    });

    test('Should validate order amounts cannot be tampered', async () => {
      const mockOrderItems = [
        { product_id: 1, quantity: 1, price: 1000 }
      ];

      db.query.mockResolvedValueOnce({ rows: mockOrderItems });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          shipping_address: '123 Test St',
          phone: '+234801234567',
          total_amount: 100 // Trying to manipulate total
        })
        .expect(201);

      // Server should calculate total, not trust client
      expect(response.body.total_amount).toBe(1000);
      expect(response.body.total_amount).not.toBe(100);
    });

    test('Should prevent SQL injection in order queries', async () => {
      const maliciousInput = "1' OR '1'='1";
      
      await request(app)
        .get(`/api/orders/${maliciousInput}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(400); // Should reject invalid input

      // Verify parameterized queries were used
      if (db.query.mock.calls.length > 0) {
        const queryCall = db.query.mock.calls[0];
        expect(queryCall[1]).toBeDefined(); // Parameters should be passed separately
      }
    });
  });

  describe('Escrow Edge Cases', () => {
    
    test('Should handle concurrent order confirmations', async () => {
      const mockOrder = {
        id: 1,
        buyer_id: 1,
        payment_status: 'escrow',
        delivery_status: 'delivered'
      };

      db.query
        .mockResolvedValue({ rows: [mockOrder] })
        .mockResolvedValue({ rows: [{ ...mockOrder, payment_status: 'completed' }] });

      // Simulate concurrent requests
      const requests = [
        request(app).put('/api/orders/1/confirm-delivery').set('Authorization', `Bearer ${buyerToken}`),
        request(app).put('/api/orders/1/confirm-delivery').set('Authorization', `Bearer ${buyerToken}`)
      ];

      const responses = await Promise.all(requests);

      // One should succeed, one should detect already completed
      const successCount = responses.filter(r => r.status === 200).length;
      expect(successCount).toBeGreaterThanOrEqual(1);
    });

    test('Should prevent double payment release', async () => {
      const mockOrder = {
        id: 1,
        buyer_id: 1,
        payment_status: 'completed', // Already completed
        delivery_status: 'confirmed'
      };

      db.query.mockResolvedValueOnce({ rows: [mockOrder] });

      const response = await request(app)
        .put('/api/orders/1/confirm-delivery')
        .set('Authorization', `Bearer ${buyerToken}`)
        .expect(400);

      expect(response.body.error).toMatch(/already.*completed/i);
    });
  });
});
