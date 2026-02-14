import axios from 'axios';

const devHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://kudimall.onrender.com/api' 
    : `http://${devHost}:5000/api`);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('🔗 API Base URL:', API_BASE_URL);

export { API_BASE_URL };

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
export const createOrder = (data) => {
  const token = localStorage.getItem('buyer_token');
  return api.post('/orders', data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
};
export const getOrder = (orderNumber) => api.get(`/orders/${orderNumber}`);

// Reviews
export const createReview = (data) => api.post('/reviews', data);

// Seller Applications
export const submitSellerApplication = (data) => api.post('/seller-applications', data);
export const getSellerApplications = (params) => api.get('/seller-applications', { params });
export const getSellerApplication = (id) => api.get(`/seller-applications/${id}`);
export const updateSellerApplication = (id, data) => api.patch(`/seller-applications/${id}`, data);

// Seller Authentication
export const sellerSignup = (data) => api.post('/auth/seller/signup', data);
export const sellerLogin = (data) => api.post('/auth/seller/login', data);
export const getSellerProfile = () => {
  const token = localStorage.getItem('seller_token');
  return api.get('/auth/seller/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const updateSellerProfile = (data) => {
  const token = localStorage.getItem('seller_token');
  return api.put('/auth/seller/profile', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Seller Product Management
export const getMyProducts = () => {
  const token = localStorage.getItem('seller_token');
  return api.get('/seller/products', {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const getMyProduct = (id) => {
  const token = localStorage.getItem('seller_token');
  return api.get(`/seller/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const createProduct = (data) => {
  const token = localStorage.getItem('seller_token');
  return api.post('/seller/products', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const updateProduct = (id, data) => {
  const token = localStorage.getItem('seller_token');
  return api.put(`/seller/products/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const deleteProduct = (id) => {
  const token = localStorage.getItem('seller_token');
  return api.delete(`/seller/products/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Seller Statistics
export const getSellerStats = () => {
  const token = localStorage.getItem('seller_token');
  return api.get('/seller/stats', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Seller Orders
export const getSellerOrders = (params) => {
  const token = localStorage.getItem('seller_token');
  return api.get('/seller/orders', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const updateOrderStatus = (orderNumber, data) => {
  const token = localStorage.getItem('seller_token');
  return api.patch(`/seller/orders/${orderNumber}/status`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const uploadDeliveryProofPhoto = (orderNumber, formData) => {
  const token = localStorage.getItem('seller_token');
  return api.post(`/seller/orders/${orderNumber}/delivery-proof/photo`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Seller Flash Deals Management
export const getMyDeals = () => {
  const token = localStorage.getItem('seller_token');
  return api.get('/seller/deals', {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const createDeal = (data) => {
  const token = localStorage.getItem('seller_token');
  return api.post('/seller/deals', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const updateDeal = (id, data) => {
  const token = localStorage.getItem('seller_token');
  return api.put(`/seller/deals/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const deleteDeal = (id) => {
  const token = localStorage.getItem('seller_token');
  return api.delete(`/seller/deals/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Buyer Authentication
export const buyerSignup = (data) => api.post('/buyer-auth/signup', data);
export const buyerLogin = (data) => api.post('/buyer-auth/login', data);
export const buyerForgotPassword = (data) => api.post('/buyer-auth/forgot-password', data);
export const buyerResetPassword = (data) => api.post('/buyer-auth/reset-password', data);
export const getBuyerProfile = () => {
  const token = localStorage.getItem('buyer_token');
  return api.get('/buyer-auth/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const updateBuyerProfile = (data) => {
  const token = localStorage.getItem('buyer_token');
  return api.put('/buyer-auth/profile', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const changeBuyerPassword = (data) => {
  const token = localStorage.getItem('buyer_token');
  return api.post('/buyer-auth/change-password', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Buyer Order Management
export const getBuyerOrders = () => {
  const token = localStorage.getItem('buyer_token');
  return api.get('/buyer/orders', {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const getBuyerOrder = (orderNumber) => {
  const token = localStorage.getItem('buyer_token');
  return api.get(`/buyer/orders/${orderNumber}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const confirmOrderReceived = (orderNumber, data) => {
  const token = localStorage.getItem('buyer_token');
  return api.post(`/buyer/orders/${orderNumber}/confirm-received`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const reportOrderIssue = (orderNumber, data) => {
  const token = localStorage.getItem('buyer_token');
  return api.post(`/buyer/orders/${orderNumber}/report-issue`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const getBuyerStats = () => {
  const token = localStorage.getItem('buyer_token');
  return api.get('/buyer/statistics', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Delivery Authentication
export const deliverySignup = (data) => api.post('/delivery-auth/signup', data);
export const deliveryLogin = (data) => api.post('/delivery-auth/login', data);
export const getDeliveryProfile = () => {
  const token = localStorage.getItem('delivery_token');
  return api.get('/delivery-auth/profile', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// Delivery Orders
export const getDeliveryOrders = (params) => {
  const token = localStorage.getItem('delivery_token');
  return api.get('/delivery/orders', {
    params,
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const getAvailableDeliveryOrders = () => {
  const token = localStorage.getItem('delivery_token');
  return api.get('/delivery/available-orders', {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const claimDeliveryOrder = (orderNumber) => {
  const token = localStorage.getItem('delivery_token');
  return api.post(`/delivery/orders/${orderNumber}/claim`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};
export const uploadDeliveryProofPhotoByDelivery = (orderNumber, formData) => {
  const token = localStorage.getItem('delivery_token');
  return api.post(`/delivery/orders/${orderNumber}/delivery-proof/photo`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data'
    }
  });
};

// ============================================================================
// WISHLIST
// ============================================================================
export const getWishlist = () => {
  const token = localStorage.getItem('buyer_token');
  return api.get('/wishlist', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const addToWishlist = (productId) => {
  const token = localStorage.getItem('buyer_token');
  return api.post('/wishlist/add', { product_id: productId }, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const removeFromWishlist = (productId) => {
  const token = localStorage.getItem('buyer_token');
  return api.delete(`/wishlist/remove/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const checkWishlist = (productId) => {
  const token = localStorage.getItem('buyer_token');
  return api.get(`/wishlist/check/${productId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const moveWishlistToCart = (productId) => {
  const token = localStorage.getItem('buyer_token');
  return api.post(`/wishlist/move-to-cart/${productId}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

// ============================================================================
// SHOPPING CART
// ============================================================================
export const getCart = () => {
  const token = localStorage.getItem('buyer_token');
  return api.get('/cart', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const addToCart = async (productId, quantity = 1) => {
  const token = localStorage.getItem('buyer_token');
  const response = await api.post('/cart/add', { product_id: productId, quantity }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  window.dispatchEvent(new CustomEvent('cartUpdated'));
  return response;
};

export const updateCartItem = async (itemId, quantity) => {
  const token = localStorage.getItem('buyer_token');
  const response = await api.put(`/cart/${itemId}`, { quantity }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  window.dispatchEvent(new CustomEvent('cartUpdated'));
  return response;
};

export const removeFromCart = async (itemId) => {
  const token = localStorage.getItem('buyer_token');
  const response = await api.delete(`/cart/${itemId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  window.dispatchEvent(new CustomEvent('cartUpdated'));
  return response;
};

export const saveCartItemForLater = async (itemId) => {
  const token = localStorage.getItem('buyer_token');
  const response = await api.post(`/cart/save-for-later/${itemId}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  window.dispatchEvent(new CustomEvent('cartUpdated'));
  return response;
};

export const moveCartItemToCart = async (itemId) => {
  const token = localStorage.getItem('buyer_token');
  const response = await api.post(`/cart/move-to-cart/${itemId}`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  window.dispatchEvent(new CustomEvent('cartUpdated'));
  return response;
};

export const getCartCount = () => {
  const token = localStorage.getItem('buyer_token');
  return api.get('/cart/count', {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const clearCart = async () => {
  const token = localStorage.getItem('buyer_token');
  const response = await api.delete('/cart/clear', {
    headers: { Authorization: `Bearer ${token}` }
  });
  window.dispatchEvent(new CustomEvent('cartUpdated'));
  return response;
};

// ============================================================================
// FLASH DEALS
// ============================================================================
export const getFlashDeals = (params) => api.get('/deals', { params });
export const getTopDeals = (limit) => api.get('/deals/top', { params: { limit } });

// ============================================================================
// AMA CHATBOT
// ============================================================================
export const chatWithAma = (message, context = {}) => {
  const token = localStorage.getItem('buyer_token');
  return api.post('/ama/chat', 
    { message, context },
    token ? { headers: { Authorization: `Bearer ${token}` } } : {}
  );
};

export const getAmaInfo = () => {
  return api.get('/ama/info');
};
export const getEndingSoonDeals = () => api.get('/deals/ending-soon');
export const getUpcomingDeals = () => api.get('/deals/upcoming');
export const getProductDeal = (productId) => api.get(`/deals/product/${productId}`);

// ============================================================================
// PAYSTACK PAYMENT
// ============================================================================
export const initializePayment = (data) => {
  const token = localStorage.getItem('buyer_token');
  return api.post('/payment/initialize', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const verifyPayment = (reference) => {
  const token = localStorage.getItem('buyer_token');
  return api.get(`/payment/verify/${reference}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getPaymentStatus = (orderNumber) => {
  const token = localStorage.getItem('buyer_token');
  return api.get(`/payment/status/${orderNumber}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export default api;
