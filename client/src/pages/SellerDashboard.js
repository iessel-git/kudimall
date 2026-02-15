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
  getCategories,
  updateSellerProfile,
  getMyDeals,
  createDeal,
  updateDeal,
  deleteDeal,
  sellerLogout
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
  const [editMode, setEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    location: '',
    description: '',
    logo_url: '',
    banner_url: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  
  // Flash Deals state
  const [deals, setDeals] = useState([]);
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [dealForm, setDealForm] = useState({
    product_id: '',
    original_price: '',
    deal_price: '',
    discount_percentage: '',
    quantity_available: '',
    starts_at: '',
    ends_at: ''
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
      
      // Fetch categories first independently (they're public and don't need seller auth)
      try {
        const categoriesRes = await getCategories();
        const categoriesData = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
        console.log('📦 Categories fetched:', categoriesData);
        setCategories(categoriesData);
      } catch (catError) {
        console.error('Error fetching categories:', catError);
        setCategories([]); // Set empty array on error
      }
      
      const [profileRes, productsRes, statsRes, ordersRes] = await Promise.all([
        getSellerProfile(),
        getMyProducts(),
        getSellerStats(),
        getSellerOrders()
      ]);

      const sellerData = profileRes.data.seller;
      setSeller(sellerData);
      setProfileForm({
        name: sellerData.name || '',
        phone: sellerData.phone || '',
        location: sellerData.location || '',
        description: sellerData.description || '',
        logo_url: sellerData.logo_url || '',
        banner_url: sellerData.banner_url || ''
      });
      setProducts(productsRes.data.products);
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

  const handleLogout = async () => {
    try { await sellerLogout(); } catch (e) { /* ignore */ }
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

  // Flash Deals Handlers
  const fetchDeals = async () => {
    try {
      const response = await getMyDeals();
      setDeals(response.data.deals || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
    }
  };

  const openDealModal = (deal = null) => {
    if (deal) {
      setEditingDeal(deal);
      // Format dates for datetime-local input
      const formatDate = (date) => {
        const d = new Date(date);
        return d.toISOString().slice(0, 16);
      };
      setDealForm({
        product_id: deal.product_id,
        original_price: deal.original_price,
        deal_price: deal.deal_price,
        discount_percentage: deal.discount_percentage,
        quantity_available: deal.quantity_available,
        starts_at: formatDate(deal.starts_at),
        ends_at: formatDate(deal.ends_at)
      });
    } else {
      setEditingDeal(null);
      setDealForm({
        product_id: '',
        original_price: '',
        deal_price: '',
        discount_percentage: '',
        quantity_available: '',
        starts_at: '',
        ends_at: ''
      });
    }
    setShowDealModal(true);
  };

  const closeDealModal = () => {
    setShowDealModal(false);
    setEditingDeal(null);
  };

  const handleDealFormChange = (e) => {
    const { name, value } = e.target;
    let updates = { [name]: value };

    // Auto-calculate discount percentage
    if (name === 'original_price' || name === 'deal_price') {
      const original = name === 'original_price' ? parseFloat(value) : parseFloat(dealForm.original_price);
      const deal = name === 'deal_price' ? parseFloat(value) : parseFloat(dealForm.deal_price);
      
      if (original && deal && original > deal) {
        const discount = Math.round(((original - deal) / original) * 100);
        updates.discount_percentage = discount;
      }
    }

    // Auto-fill original price from selected product
    if (name === 'product_id') {
      const product = products.find(p => p.id === parseInt(value));
      if (product) {
        updates.original_price = product.price;
      }
    }

    setDealForm({
      ...dealForm,
      ...updates
    });
  };

  const handleDealSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDeal) {
        await updateDeal(editingDeal.id, dealForm);
        alert('✅ Flash deal updated successfully!');
      } else {
        await createDeal(dealForm);
        alert('✅ Flash deal created successfully!');
      }
      closeDealModal();
      fetchDeals();
    } catch (error) {
      console.error('Error saving deal:', error);
      const message = error.response?.data?.message || 'Failed to save deal';
      alert(`❌ ${message}`);
    }
  };

  const handleDeleteDeal = async (dealId) => {
    if (window.confirm('Are you sure you want to delete this flash deal?')) {
      try {
        await deleteDeal(dealId);
        alert('✅ Flash deal deleted successfully!');
        fetchDeals();
      } catch (error) {
        console.error('Error deleting deal:', error);
        alert('❌ Failed to delete deal. Please try again.');
      }
    }
  };

  const formatTimeRemaining = (secondsRemaining) => {
    if (!secondsRemaining || secondsRemaining <= 0) return 'Ended';
    
    const days = Math.floor(secondsRemaining / 86400);
    const hours = Math.floor((secondsRemaining % 86400) / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  useEffect(() => {
    if (activeTab === 'deals') {
      fetchDeals();
    }
  }, [activeTab]);

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
            className={activeTab === 'deals' ? 'active' : ''}
            onClick={() => setActiveTab('deals')}
          >
            🔥 Flash Deals
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

        {/* Flash Deals Tab */}
        {activeTab === 'deals' && (
          <div className="products-section">
            <div className="section-header">
              <h2>Your Flash Deals</h2>
              <button 
                className="btn-add-product"
                onClick={() => openDealModal()}
              >
                + Create Flash Deal
              </button>
            </div>

            {deals.length === 0 ? (
              <div className="no-products">
                <p>You haven't created any flash deals yet.</p>
                <p className="help-text">
                  Flash deals help you boost sales with time-limited discounts on your products.
                </p>
                <button 
                  className="btn-primary"
                  onClick={() => openDealModal()}
                >
                  Create Your First Flash Deal
                </button>
              </div>
            ) : (
              <div className="products-grid">
                {deals.map(deal => (
                  <div key={deal.id} className="product-card">
                    <div className="product-image">
                      {deal.image_url ? (
                        <img src={deal.image_url} alt={deal.product_name} />
                      ) : (
                        <div className="placeholder-image">📷</div>
                      )}
                      <div className="deal-discount-badge">-{deal.discount_percentage}%</div>
                      <span className={`product-status ${deal.is_active && deal.seconds_remaining > 0 ? 'available' : 'unavailable'}`}>
                        {deal.is_active && deal.seconds_remaining > 0 ? 'Active' : 'Ended'}
                      </span>
                    </div>
                    <div className="product-info">
                      <h3>{deal.product_name}</h3>
                      <div className="deal-prices">
                        <span className="original-price">₵{parseFloat(deal.original_price).toLocaleString()}</span>
                        <span className="deal-price">₵{parseFloat(deal.deal_price).toLocaleString()}</span>
                      </div>
                      <p className="product-stock">
                        Sold: {deal.quantity_sold} / {deal.quantity_available}
                      </p>
                      <p className="deal-timer">
                        ⏰ {formatTimeRemaining(deal.seconds_remaining)}
                      </p>
                      <div className="product-actions">
                        <button 
                          className="btn-edit"
                          onClick={() => openDealModal(deal)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteDeal(deal.id)}
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
            <div className="section-header">
              <h2>Seller Profile</h2>
              {!editMode ? (
                <button className="btn-add-product" onClick={() => setEditMode(true)}>
                  ✏️ Edit Profile
                </button>
              ) : (
                <button className="btn-secondary" onClick={() => {
                  setEditMode(false);
                  setProfileForm({
                    name: seller.name || '',
                    phone: seller.phone || '',
                    location: seller.location || '',
                    description: seller.description || '',
                    logo_url: seller.logo_url || '',
                    banner_url: seller.banner_url || ''
                  });
                }}>
                  ✕ Cancel
                </button>
              )}
            </div>

            {!editMode ? (
              <div className="profile-info">
                <div className="profile-images">
                  {profileForm.banner_url && (
                    <div className="profile-banner-preview">
                      <img src={profileForm.banner_url} alt="Store banner" />
                    </div>
                  )}
                  {profileForm.logo_url && (
                    <div className="profile-logo-preview">
                      <img src={profileForm.logo_url} alt="Store logo" />
                    </div>
                  )}
                </div>
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
                  <span className="trust-badge">⭐ {seller.trust_level}/5</span>
                </div>
                <div className="info-row">
                  <strong>Verified:</strong>
                  <span className={seller.is_verified ? 'verified-badge' : 'unverified-badge'}>
                    {seller.is_verified ? '✓ Verified' : '⏳ Pending Verification'}
                  </span>
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
            ) : (
              <form className="profile-edit-form" onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setProfileSaving(true);
                  await updateSellerProfile(profileForm);
                  alert('✅ Profile updated successfully!');
                  await fetchData();
                  setEditMode(false);
                } catch (error) {
                  console.error('Error updating profile:', error);
                  alert('❌ Failed to update profile. Please try again.');
                } finally {
                  setProfileSaving(false);
                }
              }}>
                <div className="form-section">
                  <h3>🎨 Store Branding</h3>
                  <div className="form-group">
                    <label>Store Logo URL</label>
                    <input
                      type="url"
                      value={profileForm.logo_url}
                      onChange={(e) => setProfileForm({ ...profileForm, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.jpg"
                    />
                    {profileForm.logo_url && (
                      <div className="image-preview">
                        <img src={profileForm.logo_url} alt="Logo preview" />
                      </div>
                    )}
                    <small>Recommended: Square image, 200x200px minimum</small>
                  </div>
                  <div className="form-group">
                    <label>Store Banner URL</label>
                    <input
                      type="url"
                      value={profileForm.banner_url}
                      onChange={(e) => setProfileForm({ ...profileForm, banner_url: e.target.value })}
                      placeholder="https://example.com/banner.jpg"
                    />
                    {profileForm.banner_url && (
                      <div className="image-preview banner">
                        <img src={profileForm.banner_url} alt="Banner preview" />
                      </div>
                    )}
                    <small>Recommended: Wide image, 1200x300px</small>
                  </div>
                </div>

                <div className="form-section">
                  <h3>📝 Store Information</h3>
                  <div className="form-group">
                    <label>Store Name *</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+233 XX XXX XXXX"
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      placeholder="City, Region"
                    />
                  </div>
                  <div className="form-group">
                    <label>Store Description</label>
                    <textarea
                      value={profileForm.description}
                      onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                      rows="4"
                      placeholder="Tell customers about your store..."
                    />
                  </div>
                </div>

                <div className="form-section readonly-section">
                  <h3>🔒 Platform-Managed Information</h3>
                  <p className="info-note">These fields are managed by KudiMall administrators and cannot be edited directly.</p>
                  <div className="readonly-grid">
                    <div className="readonly-item">
                      <strong>Email:</strong>
                      <span>{seller.email}</span>
                    </div>
                    <div className="readonly-item">
                      <strong>Trust Level:</strong>
                      <span className="trust-badge">⭐ {seller.trust_level}/5</span>
                    </div>
                    <div className="readonly-item">
                      <strong>Verification Status:</strong>
                      <span className={seller.is_verified ? 'verified-badge' : 'unverified-badge'}>
                        {seller.is_verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    </div>
                    <div className="readonly-item">
                      <strong>Store URL:</strong>
                      <span>/seller/{seller.slug}</span>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="submit" className="btn-primary" disabled={profileSaving}>
                    {profileSaving ? '💾 Saving...' : '💾 Save Changes'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setEditMode(false);
                      setProfileForm({
                        name: seller.name || '',
                        phone: seller.phone || '',
                        location: seller.location || '',
                        description: seller.description || '',
                        logo_url: seller.logo_url || '',
                        banner_url: seller.banner_url || ''
                      });
                    }}
                    disabled={profileSaving}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
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
                  {categories.length > 0 ? (
                    categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))
                  ) : (
                    <option value="" disabled>No categories available</option>
                  )}
                </select>
                {categories.length === 0 && (
                  <small style={{color: '#888', marginTop: '5px', display: 'block'}}>
                    Categories are loading... If this persists, refresh the page.
                  </small>
                )}
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

      {/* Flash Deal Modal */}
      {showDealModal && (
        <div className="modal-overlay" onClick={closeDealModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDeal ? 'Edit Flash Deal' : 'Create Flash Deal'}</h2>
              <button className="close-btn" onClick={closeDealModal}>×</button>
            </div>
            <form onSubmit={handleDealSubmit}>
              <div className="form-group">
                <label htmlFor="product_id">Product *</label>
                <select
                  id="product_id"
                  name="product_id"
                  value={dealForm.product_id}
                  onChange={handleDealFormChange}
                  required
                  disabled={!!editingDeal}
                >
                  <option value="">Select a product</option>
                  {products.filter(p => p.is_available).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} (₵{product.price}, Stock: {product.stock})
                    </option>
                  ))}
                </select>
                {editingDeal && <small className="help-text">Product cannot be changed after creation</small>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="original_price">Original Price (₵) *</label>
                  <input
                    type="number"
                    id="original_price"
                    name="original_price"
                    value={dealForm.original_price}
                    onChange={handleDealFormChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="deal_price">Deal Price (₵) *</label>
                  <input
                    type="number"
                    id="deal_price"
                    name="deal_price"
                    value={dealForm.deal_price}
                    onChange={handleDealFormChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="discount_percentage">Discount % *</label>
                <input
                  type="number"
                  id="discount_percentage"
                  name="discount_percentage"
                  value={dealForm.discount_percentage}
                  onChange={handleDealFormChange}
                  min="1"
                  max="99"
                  required
                  readOnly
                />
                <small className="help-text">Auto-calculated based on prices</small>
              </div>

              <div className="form-group">
                <label htmlFor="quantity_available">Quantity Available *</label>
                <input
                  type="number"
                  id="quantity_available"
                  name="quantity_available"
                  value={dealForm.quantity_available}
                  onChange={handleDealFormChange}
                  min="1"
                  required
                />
                <small className="help-text">Cannot exceed product stock</small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="starts_at">Start Date & Time *</label>
                  <input
                    type="datetime-local"
                    id="starts_at"
                    name="starts_at"
                    value={dealForm.starts_at}
                    onChange={handleDealFormChange}
                    required
                    disabled={!!editingDeal}
                  />
                  {editingDeal && <small className="help-text">Start time cannot be changed</small>}
                </div>

                <div className="form-group">
                  <label htmlFor="ends_at">End Date & Time *</label>
                  <input
                    type="datetime-local"
                    id="ends_at"
                    name="ends_at"
                    value={dealForm.ends_at}
                    onChange={handleDealFormChange}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="submit" className="btn-primary">
                  {editingDeal ? 'Update Deal' : 'Create Deal'}
                </button>
                <button type="button" className="btn-secondary" onClick={closeDealModal}>
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
