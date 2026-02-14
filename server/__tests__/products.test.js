/**
 * Product & Search Critical Path Tests
 * Tests product browsing, search, and category filtering
 */

const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const productsRoutes = require('../routes/products');
const categoriesRoutes = require('../routes/categories');
const searchRoutes = require('../routes/search');

jest.mock('../models/database', () => ({
  query: jest.fn()
}));

const db = require('../models/database');

const app = express();
app.use(bodyParser.json());
app.use('/api/products', productsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/search', searchRoutes);

describe('Product & Search Critical Path', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Product Listing', () => {
    
    test('GET /api/products - Should return product list', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Test Product 1',
          slug: 'test-product-1',
          price: 1000,
          seller_id: 1,
          category_id: 1
        },
        {
          id: 2,
          name: 'Test Product 2',
          slug: 'test-product-2',
          price: 2000,
          seller_id: 1,
          category_id: 1
        }
      ];

      db.query.mockResolvedValueOnce({ rows: mockProducts });

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('price');
    });

    test('GET /api/products/:slug - Should return single product details', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        price: 1000,
        description: 'Test description',
        seller_id: 1,
        seller_name: 'Test Shop'
      };

      db.query.mockResolvedValueOnce({ rows: [mockProduct] });

      const response = await request(app)
        .get('/api/products/test-product')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'Test Product');
      expect(response.body).toHaveProperty('price', 1000);
      expect(response.body).toHaveProperty('seller_name');
    });

    test('GET /api/products/:slug - Should return 404 for non-existent product', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/products/non-existent-product')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Categories', () => {
    
    test('GET /api/categories - Should return all categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Electronics', slug: 'electronics' },
        { id: 2, name: 'Fashion', slug: 'fashion' },
        { id: 3, name: 'Home & Garden', slug: 'home-garden' }
      ];

      db.query.mockResolvedValueOnce({ rows: mockCategories });

      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('slug');
    });

    test('GET /api/categories/:slug/products - Should return products by category', async () => {
      const mockProducts = [
        { id: 1, name: 'Phone', category_id: 1, price: 50000 },
        { id: 2, name: 'Laptop', category_id: 1, price: 150000 }
      ];

      db.query.mockResolvedValueOnce({ rows: mockProducts });

      const response = await request(app)
        .get('/api/categories/electronics/products')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('category_id', 1);
    });
  });

  describe('Search Functionality', () => {
    
    test('GET /api/search?q=phone - Should return search results', async () => {
      const mockResults = [
        { 
          id: 1, 
          name: 'iPhone 14 Pro',
          slug: 'iphone-14-pro',
          price: 450000,
          description: 'Latest iPhone model'
        },
        { 
          id: 2, 
          name: 'Samsung Phone',
          slug: 'samsung-phone',
          price: 280000,
          description: 'Android smartphone'
        }
      ];

      db.query.mockResolvedValueOnce({ rows: mockResults });

      const response = await request(app)
        .get('/api/search?q=phone')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toContain('Phone');
    });

    test('GET /api/search?q= - Should reject empty search query', async () => {
      const response = await request(app)
        .get('/api/search?q=')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('GET /api/search - Should require query parameter', async () => {
      const response = await request(app)
        .get('/api/search')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('GET /api/search?q=nonexistent - Should return empty array for no matches', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/search?q=nonexistentproductxyz123')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('Product Filtering', () => {
    
    test('GET /api/products?min_price=1000&max_price=5000 - Should filter by price range', async () => {
      const mockProducts = [
        { id: 1, name: 'Product A', price: 2000 },
        { id: 2, name: 'Product B', price: 3000 }
      ];

      db.query.mockResolvedValueOnce({ rows: mockProducts });

      const response = await request(app)
        .get('/api/products?min_price=1000&max_price=5000')
        .expect(200);

      expect(response.body).toHaveLength(2);
      response.body.forEach(product => {
        expect(product.price).toBeGreaterThanOrEqual(1000);
        expect(product.price).toBeLessThanOrEqual(5000);
      });
    });

    test('GET /api/products?seller_id=1 - Should filter by seller', async () => {
      const mockProducts = [
        { id: 1, name: 'Product A', seller_id: 1 },
        { id: 2, name: 'Product B', seller_id: 1 }
      ];

      db.query.mockResolvedValueOnce({ rows: mockProducts });

      const response = await request(app)
        .get('/api/products?seller_id=1')
        .expect(200);

      response.body.forEach(product => {
        expect(product.seller_id).toBe(1);
      });
    });
  });

  describe('Product Performance', () => {
    
    test('GET /api/products - Should return within acceptable time', async () => {
      const mockProducts = Array(50).fill(null).map((_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        price: 1000 * (i + 1)
      }));

      db.query.mockResolvedValueOnce({ rows: mockProducts });

      const startTime = Date.now();
      await request(app)
        .get('/api/products')
        .expect(200);
      const endTime = Date.now();

      const responseTime = endTime - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });
  });
});
