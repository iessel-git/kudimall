import axios from 'axios';

const devHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? '/api'
    : `http://${devHost}:5000/api`);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send/receive HttpOnly cookies
});

// Request interceptor: auto-attach JWT token from localStorage
api.interceptors.request.use((config) => {
  // Skip if Authorization header is already set
  if (config.headers.Authorization) return config;

  const url = config.url || '';
  let token = null;

  if (url.includes('/delivery')) {
    token = localStorage.getItem('delivery_token');
  } else if (url.includes('/auth/seller') || url.startsWith('/seller')) {
    token = localStorage.getItem('seller_token');
  } else {
    token = localStorage.getItem('buyer_token');
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || '';
      
      // Don't redirect on login/signup attempts (401 = wrong credentials)
      const isAuthAttempt = url.includes('/login') || url.includes('/signup') || 
                            url.includes('/verify-code');
      
      if (!isAuthAttempt) {
        // Determine which token expired based on URL
        if (url.includes('/delivery')) {
          localStorage.removeItem('delivery_token');
          if (window.location.pathname.includes('/delivery')) {
            window.location.href = '/delivery/login';
          }
        } else if (url.includes('/auth/seller') || url.includes('/seller')) {
          localStorage.removeItem('seller_token');
          if (window.location.pathname.includes('/seller')) {
            window.location.href = '/seller/login';
          }
        } else {
          localStorage.removeItem('buyer_token');
          // Only redirect if on a protected buyer page
          const protectedPaths = ['/buyer/', '/cart', '/wishlist', '/checkout'];
          if (protectedPaths.some(p => window.location.pathname.startsWith(p))) {
            window.location.href = '/buyer/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

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

// Orders (interceptor auto-attaches buyer_token)
export const createOrder = (data) => api.post('/orders', data);
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
export const sellerVerifyCode = (data) => api.post('/auth/seller/verify-code', data);
export const sellerResendVerification = (data) => api.post('/auth/seller/resend-verification', data);
export const sellerLogout = () => api.post('/auth/seller/logout');
export const getSellerProfile = () => api.get('/auth/seller/me');
export const updateSellerProfile = (data) => api.put('/auth/seller/profile', data);

// Seller Product Management (interceptor auto-attaches seller_token)
export const getMyProducts = () => api.get('/seller/products');
export const getMyProduct = (id) => api.get(`/seller/products/${id}`);
export const createProduct = (data) => api.post('/seller/products', data);
export const updateProduct = (id, data) => api.put(`/seller/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/seller/products/${id}`);

// Seller Statistics
export const getSellerStats = () => api.get('/seller/stats');

// Seller Orders
export const getSellerOrders = (params) => api.get('/seller/orders', { params });
export const updateOrderStatus = (orderNumber, data) => api.patch(`/seller/orders/${orderNumber}/status`, data);
export const uploadDeliveryProofPhoto = (orderNumber, formData) =>
  api.post(`/seller/orders/${orderNumber}/delivery-proof/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

// Seller Flash Deals Management
export const getMyDeals = () => api.get('/seller/deals');
export const createDeal = (data) => api.post('/seller/deals', data);
export const updateDeal = (id, data) => api.put(`/seller/deals/${id}`, data);
export const deleteDeal = (id) => api.delete(`/seller/deals/${id}`);

// Buyer Authentication
export const buyerSignup = (data) => api.post('/buyer-auth/signup', data);
export const buyerLogin = (data) => api.post('/buyer-auth/login', data);
export const buyerVerifyCode = (data) => api.post('/buyer-auth/verify-code', data);
export const buyerResendVerification = (data) => api.post('/buyer-auth/resend-verification', data);
export const buyerForgotPassword = (data) => api.post('/buyer-auth/forgot-password', data);
export const buyerResetPassword = (data) => api.post('/buyer-auth/reset-password', data);
export const buyerLogout = () => api.post('/buyer-auth/logout');
export const getBuyerProfile = () => api.get('/buyer-auth/profile');
export const updateBuyerProfile = (data) => api.put('/buyer-auth/profile', data);
export const changeBuyerPassword = (data) => api.post('/buyer-auth/change-password', data);

// Buyer Order Management
export const getBuyerOrders = () => api.get('/buyer/orders');
export const getBuyerOrder = (orderNumber) => api.get(`/buyer/orders/${orderNumber}`);
export const confirmOrderReceived = (orderNumber, data) => api.post(`/buyer/orders/${orderNumber}/confirm-received`, data);
export const reportOrderIssue = (orderNumber, data) => api.post(`/buyer/orders/${orderNumber}/report-issue`, data);
export const getBuyerStats = () => api.get('/buyer/statistics');

// Delivery Authentication
export const deliverySignup = (data) => api.post('/delivery-auth/signup', data);
export const deliveryLogin = (data) => api.post('/delivery-auth/login', data);
export const deliveryLogout = () => api.post('/delivery-auth/logout');
export const getDeliveryProfile = () => api.get('/delivery-auth/profile');

// Delivery Orders
export const getDeliveryOrders = (params) => api.get('/delivery/orders', { params });
export const getAvailableDeliveryOrders = () => api.get('/delivery/available-orders');
export const claimDeliveryOrder = (orderNumber) => api.post(`/delivery/orders/${orderNumber}/claim`);
export const uploadDeliveryProofPhotoByDelivery = (orderNumber, formData) =>
  api.post(`/delivery/orders/${orderNumber}/delivery-proof/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });

// ============================================================================
// WISHLIST (interceptor auto-attaches buyer_token)
// ============================================================================
export const getWishlist = () => api.get('/wishlist');
export const addToWishlist = (productId) => api.post('/wishlist/add', { product_id: productId });
export const removeFromWishlist = (productId) => api.delete(`/wishlist/remove/${productId}`);
export const checkWishlist = (productId) => api.get(`/wishlist/check/${productId}`);
export const moveWishlistToCart = (productId) => api.post(`/wishlist/move-to-cart/${productId}`);

// ============================================================================
// SHOPPING CART (interceptor auto-attaches buyer_token)
// ============================================================================
export const getCart = () => api.get('/cart');

export const addToCart = async (productId, quantity = 1) => {
  const response = await api.post('/cart/add', { product_id: productId, quantity });
  window.dispatchEvent(new CustomEvent('cartUpdated'));
  return response;
};

export const updateCartItem = async (itemId, quantity) => {
  const response = await api.put(`/cart/${itemId}`, { quantity });
  window.dispatchEvent(new CustomEvent('cartUpdated'));
  return response;
};

export const removeFromCart = async (itemId) => {
  const response = await api.delete(`/cart/${itemId}`);
  window.dispatchEvent(new CustomEvent('cartUpdated'));
  return response;
};

export const saveCartItemForLater = async (itemId) => {
  const response = await api.post(`/cart/save-for-later/${itemId}`);
  window.dispatchEvent(new CustomEvent('cartUpdated'));
  return response;
};

export const moveCartItemToCart = async (itemId) => {
  const response = await api.post(`/cart/move-to-cart/${itemId}`);
  window.dispatchEvent(new CustomEvent('cartUpdated'));
  return response;
};

export const getCartCount = () => api.get('/cart/count');

export const clearCart = async () => {
  const response = await api.delete('/cart/clear');
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
export const chatWithAma = (message, context = {}) =>
  api.post('/ama/chat', { message, context });

export const getAmaInfo = () => api.get('/ama/info');
export const getEndingSoonDeals = () => api.get('/deals/ending-soon');
export const getUpcomingDeals = () => api.get('/deals/upcoming');
export const getProductDeal = (productId) => api.get(`/deals/product/${productId}`);

// ============================================================================
// PAYSTACK PAYMENT (interceptor auto-attaches buyer_token)
// ============================================================================
export const initializePayment = (data) => api.post('/payment/initialize', data);
export const verifyPayment = (reference) => api.get(`/payment/verify/${reference}`);
export const getPaymentStatus = (orderNumber) => api.get(`/payment/status/${orderNumber}`);

export default api;
