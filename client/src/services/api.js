import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Categories
export const getCategories = () => api.get('/categories');
export const getCategory = (slug) => api.get(`/categories/${slug}`);
export const getCategoryProducts = (slug, params) => 
  api.get(`/categories/${slug}/products`, { params });

// Sellers
export const getSellers = (params) => api.get('/sellers', { params });
export const getSeller = (slug) => api.get(`/sellers/${slug}`);
export const getSellerProducts = (slug, params) => 
  api.get(`/sellers/${slug}/products`, { params });
export const getSellerReviews = (slug) => api.get(`/sellers/${slug}/reviews`);
export const followSeller = (slug, data) => api.post(`/sellers/${slug}/follow`, data);
export const unfollowSeller = (slug, data) => api.delete(`/sellers/${slug}/follow`, { data });

// Products
export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (slug) => api.get(`/products/${slug}`);
export const getProductReviews = (slug) => api.get(`/products/${slug}/reviews`);

// Search
export const search = (params) => api.get('/search', { params });

// Orders
export const createOrder = (data) => api.post('/orders', data);
export const getOrder = (orderNumber) => api.get(`/orders/${orderNumber}`);

// Reviews
export const createReview = (data) => api.post('/reviews', data);

export default api;
