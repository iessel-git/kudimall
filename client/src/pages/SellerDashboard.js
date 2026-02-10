import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getSellerProfile, 
  getMyProducts, 
  getSellerStats,
  getSellerOrders,
  createProduct,
  updateProduct,
  deleteProduct,
  updateOrderStatus,
  getCategories 
} from '../services/api';
import '../styles/SellerDashboard.css';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderUpdates, setOrderUpdates] = useState({});
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    stock: '',
    image_url: '',
    is_available: true
  });

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('seller_token');
    if (!token) {
      navigate('/seller/login');
    }
  }, [navigate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [profileRes, productsRes, categoriesRes, statsRes, ordersRes] = await Promise.all([
        getSellerProfile(),
        getMyProducts(),
        getCategories(),
        getSellerStats(),
        getSellerOrders()
      ]);

      setSeller(profileRes.data.seller);
      setProducts(productsRes.data.products);
      setCategories(categoriesRes.data);
      setStats(statsRes.data.stats);
      setOrders(ordersRes.data.orders || []);
      const updates = {};
      (ordersRes.data.orders || []).forEach((order) => {
        updates[order.order_number] = {
          status: order.status,
          tracking_number: order.tracking_number || ''
        };
      });
      setOrderUpdates(updates);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('seller_token');
        localStorage.removeItem('seller_info');
        navigate('/seller/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, [checkAuth, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('seller_token');
    localStorage.removeItem('seller_info');
    navigate('/seller/login');
  };

  const openProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category_id: product.category_id,
        stock: product.stock,
        image_url: product.image_url || '',
        is_available: product.is_available
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '',
        description: '',
        price: '',
        category_id: '',
        stock: '',
        image_url: '',
        is_available: true
      });
    }
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleProductFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm({
      ...productForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productForm);
        alert('✅ Product updated successfully!');
      } else {
        await createProduct(productForm);
        alert('✅ Product created successfully!');
      }
      closeProductModal();
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('❌ Failed to save product. Please try again.');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        alert('✅ Product deleted successfully!');
        fetchData();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('❌ Failed to delete product. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const handleOrderChange = (orderNumber, field, value) => {
    setOrderUpdates((prev) => ({
      ...prev,
      [orderNumber]: {
        ...prev[orderNumber],
        [field]: value
      }
    }));
  };

  const handleUpdateOrder = async (orderNumber) => {
    const update = orderUpdates[orderNumber];
    if (!update) {
      return;
    }
    try {
      setOrdersLoading(true);
      await updateOrderStatus(orderNumber, {
        status: update.status,
        tracking_number: update.tracking_number
      });
      const refreshed = await getSellerOrders();
      setOrders(refreshed.data.orders || []);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update order');
    } finally {
      setOrdersLoading(false);
    }
  };

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div>
              <h1>Welcome, {seller?.name}!</h1>
              <p className="seller-email">{seller?.email}</p>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Stats Section */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-info">
                <h3>{stats.total_products || 0}</h3>
                <p>Total Products</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-info">
                <h3>{stats.active_products || 0}</h3>
                <p>Active Products</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>{stats.total_stock || 0}</h3>
                <p>Total Stock</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🛒</div>
              <div className="stat-info">
                <h3>{stats.total_sales || 0}</h3>
                <p>Total Sales</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="dashboard-tabs">
          <button 
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
          <button 
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
          <button 
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="products-section">
            <div className="section-header">
              <h2>Your Products</h2>
              <button 
                className="btn-add-product"
                onClick={() => openProductModal()}
              >
                + Add Product
              </button>
            </div>

            {products.length === 0 ? (
              <div className="no-products">
                <p>You haven't added any products yet.</p>
                <button 
                  className="btn-primary"
                  onClick={() => openProductModal()}
                >
                  Add Your First Product
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {products.map(product => (
                  <div key={product.id} className="product-card">
                    <div className="product-image">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} />
                      ) : (
                        <div className="placeholder-image">📷</div>
                      )}
                      <span className={`product-status ${product.is_available ? 'available' : 'unavailable'}`}>
                        {product.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="product-category">{product.category_name}</p>
                      <p className="product-price">₵{product.price.toLocaleString()}</p>
                      <p className="product-stock">Stock: {product.stock}</p>
                      <div className="product-actions">
                        <button 
                          className="btn-edit"
                          onClick={() => openProductModal(product)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="products-section">
            <div className="section-header">
              <h2>Orders</h2>
            </div>
            {orders.length === 0 ? (
              <div className="no-products">
                <p>No orders yet.</p>
              </div>
            ) : (
              <div className="seller-orders">
                {orders.map((order) => (
                  <div key={order.id} className="seller-order-card">
                    <div className="seller-order-header">
                      <h3>Order #{order.order_number}</h3>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                    <p><strong>Buyer:</strong> {order.buyer_name}</p>
                    <p><strong>Address:</strong> {order.delivery_address}</p>
                    <p><strong>Quantity:</strong> {order.quantity}</p>
                    <p><strong>Total:</strong> ₵{order.total_amount.toLocaleString()}</p>
                    <p>
                      <strong>Escrow:</strong>{' '}
                      <span className={`escrow-badge escrow-${order.escrow_status}`}>
                        {order.escrow_status === 'released' ? '✓ Payment Released' : '⏳ Payment Held'}
                      </span>
                    </p>

                    {/* Waiting for buyer confirmation */}
                    {(order.status === 'shipped' || order.status === 'delivered') && !order.buyer_confirmed_at && (
                      <div className="delivery-pending-section">
                        <h4>📦 Delivery Status</h4>
                        <p className="pending-message">
                          {order.status === 'shipped' 
                            ? '⏳ Item is in transit. Waiting for buyer to confirm receipt.' 
                            : '⏳ Item marked as delivered. Waiting for buyer to confirm receipt with signature.'}
                        </p>
                        {order.tracking_number && (
                          <p className="tracking-info">
                            <strong>Tracking:</strong> {order.tracking_number}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Buyer confirmed delivery */}
                    {order.status === 'completed' && order.buyer_confirmed_at && (
                      <div className="delivery-confirmation-section">
                        <h4>✓ Delivery Confirmed by Buyer</h4>
                        <p className="confirmation-date">
                          {new Date(order.buyer_confirmed_at).toLocaleString()}
                        </p>
                        
                        {order.delivery_signature_data && (
                          <div className="delivery-proof-item">
                            <h5>Buyer Signature:</h5>
                            <img 
                              src={order.delivery_signature_data} 
                              alt="Buyer signature" 
                              className="delivery-proof-image signature"
                            />
                            {order.delivery_signature_name && (
                              <p className="signature-name">Signed by: {order.delivery_signature_name}</p>
                            )}
                          </div>
                        )}
                        
                        {order.delivery_proof_url && (
                          <div className="delivery-proof-item">
                            <h5>Delivery Photo:</h5>
                            <img 
                              src={order.delivery_proof_url} 
                              alt="Delivery proof" 
                              className="delivery-proof-image"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="seller-order-actions">
                      <div className="form-group">
                        <label>Status</label>
                        <select
                          value={orderUpdates[order.order_number]?.status || order.status}
                          onChange={(e) => handleOrderChange(order.order_number, 'status', e.target.value)}
                          disabled={order.status === 'completed'}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                          {order.status === 'completed' && (
                            <option value="completed">✓ Completed (Buyer Confirmed)</option>
                          )}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Tracking Number</label>
                        <input
                          type="text"
                          value={orderUpdates[order.order_number]?.tracking_number || ''}
                          onChange={(e) => handleOrderChange(order.order_number, 'tracking_number', e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                      <button
                        className="btn-primary"
                        type="button"
                        onClick={() => handleUpdateOrder(order.order_number)}
                        disabled={ordersLoading || order.status === 'completed'}
                      >
                        {ordersLoading ? 'Updating...' : order.status === 'completed' ? 'Order Completed' : 'Update Order'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && seller && (
          <div className="profile-section">
            <h2>Seller Profile</h2>
            <div className="profile-info">
              <div className="info-row">
                <strong>Store Name:</strong>
                <span>{seller.name}</span>
              </div>
              <div className="info-row">
                <strong>Email:</strong>
                <span>{seller.email}</span>
              </div>
              {seller.phone && (
                <div className="info-row">
                  <strong>Phone:</strong>
                  <span>{seller.phone}</span>
                </div>
              )}
              {seller.location && (
                <div className="info-row">
                  <strong>Location:</strong>
                  <span>{seller.location}</span>
                </div>
              )}
              {seller.description && (
                <div className="info-row">
                  <strong>Description:</strong>
                  <span>{seller.description}</span>
                </div>
              )}
              <div className="info-row">
                <strong>Trust Level:</strong>
                <span>{seller.trust_level}/5</span>
              </div>
              <div className="info-row">
                <strong>Verified:</strong>
                <span>{seller.is_verified ? '✓ Yes' : '✗ No'}</span>
              </div>
              <div className="info-row">
                <strong>Store URL:</strong>
                <span>
                  <a href={`/seller/${seller.slug}`} target="_blank" rel="noopener noreferrer">
                    /seller/{seller.slug}
                  </a>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={closeProductModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="close-btn" onClick={closeProductModal}>&times;</button>
            </div>

            <form className="product-form" onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductFormChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₵) *</label>
                  <input
                    type="number"
                    name="price"
                    value={productForm.price}
                    onChange={handleProductFormChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={productForm.stock}
                    onChange={handleProductFormChange}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category_id"
                  value={productForm.category_id}
                  onChange={handleProductFormChange}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={handleProductFormChange}
                  rows="4"
                />
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  name="image_url"
                  value={productForm.image_url}
                  onChange={handleProductFormChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_available"
                    checked={productForm.is_available}
                    onChange={handleProductFormChange}
                  />
                  Product is available for sale
                </label>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
                <button type="button" className="btn-secondary" onClick={closeProductModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
