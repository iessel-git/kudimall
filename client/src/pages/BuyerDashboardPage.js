import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getBuyerProfile, getBuyerOrders, confirmOrderReceived, reportOrderIssue } from '../services/api';
import '../styles/SellerDashboard.css';

const BuyerDashboardPage = () => {
  const navigate = useNavigate();
  const [buyer, setBuyer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureOrder, setSignatureOrder] = useState(null);
  const [signatureName, setSignatureName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageOrder, setMessageOrder] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const signatureCanvasRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, ordersRes] = await Promise.all([
        getBuyerProfile(),
        getBuyerOrders()
      ]);
      
      setBuyer(profileRes.data.buyer);
      setStats(profileRes.data.stats);
      setOrders(ordersRes.data.orders);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('buyer_token');
        localStorage.removeItem('buyer_info');
        navigate('/buyer/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('buyer_token');
    if (!token) {
      navigate('/buyer/login', { state: { from: { pathname: '/buyer/dashboard' } } });
      return;
    }
    fetchData();
  }, [navigate, fetchData]);

  const handleLogout = () => {
    localStorage.removeItem('buyer_token');
    localStorage.removeItem('buyer_info');
    navigate('/');
  };

  const getUploadsBaseUrl = () => {
    const apiUrl = process.env.REACT_APP_API_URL || '';
    if (apiUrl.endsWith('/api')) {
      return apiUrl.slice(0, -4);
    }
    return apiUrl;
  };

  const openSignatureModal = (order) => {
    setSignatureOrder(order);
    setSignatureName(buyer?.name || '');
    setHasSignature(false);
    setIsDrawing(false);
    setShowSignatureModal(true);

    setTimeout(() => {
      if (signatureCanvasRef.current) {
        const ctx = signatureCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, signatureCanvasRef.current.width, signatureCanvasRef.current.height);
      }
    }, 0);
  };

  const closeSignatureModal = () => {
    setShowSignatureModal(false);
    setSignatureOrder(null);
    setSignatureName('');
    setHasSignature(false);
    setIsDrawing(false);
  };

  const getPointerPosition = (event) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    const point = event.touches ? event.touches[0] : event;
    return {
      x: point.clientX - rect.left,
      y: point.clientY - rect.top
    };
  };

  const startDrawing = (event) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    const pos = getPointerPosition(event);
    if (!pos) {
      return;
    }
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#e6c980';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setHasSignature(true);
    event.preventDefault();
  };

  const draw = (event) => {
    if (!isDrawing) {
      return;
    }
    const canvas = signatureCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    const pos = getPointerPosition(event);
    if (!pos) {
      return;
    }
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    event.preventDefault();
  };

  const stopDrawing = () => {
    if (!isDrawing) {
      return;
    }
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
  };

  const handleConfirmReceived = async () => {
    if (!signatureOrder) {
      return;
    }
    if (!signatureName.trim()) {
      alert('Please enter your full name for the signature.');
      return;
    }
    if (!hasSignature) {
      alert('Please add your signature before confirming.');
      return;
    }

    try {
      setIsConfirming(true);
      const signatureData = signatureCanvasRef.current.toDataURL('image/png');
      await confirmOrderReceived(signatureOrder.order_number, {
        signature_name: signatureName.trim(),
        signature_data: signatureData
      });
      alert('Order confirmed! Payment released to seller.');
      closeSignatureModal();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to confirm order');
    } finally {
      setIsConfirming(false);
    }
  };

  const openMessageModal = (order) => {
    setMessageOrder(order);
    setMessageText('');
    setShowMessageModal(true);
  };

  const closeMessageModal = () => {
    setShowMessageModal(false);
    setMessageOrder(null);
    setMessageText('');
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      setMessageSending(true);
      // In a real implementation, this would call an API endpoint
      // For now, we'll simulate sending a message
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert(`Message sent to ${messageOrder.seller_name}!\n\nIn a production environment, this would be saved to a messages database and the seller would be notified.`);
      closeMessageModal();
    } catch (error) {
      alert('Failed to send message. Please try again.');
    } finally {
      setMessageSending(false);
    }
  };

  const handleReportIssue = async () => {
    if (!issueDescription.trim()) {
      alert('Please describe the issue');
      return;
    }

    try {
      await reportOrderIssue(selectedOrder.order_number, { issue_description: issueDescription });
      alert('Issue reported successfully. Our support team will contact you.');
      setShowIssueModal(false);
      setIssueDescription('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to report issue');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Pending', class: 'status-pending' },
      shipped: { text: 'Shipped', class: 'status-shipped' },
      delivered: { text: 'Delivered', class: 'status-delivered' },
      completed: { text: 'Completed', class: 'status-completed' },
      disputed: { text: 'Disputed', class: 'status-disputed' },
      cancelled: { text: 'Cancelled', class: 'status-cancelled' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return <div className="loading">Loading your dashboard...</div>;
  }

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>My Dashboard</h1>
            <p>Welcome back, {buyer?.name}!</p>
          </div>
          <button onClick={handleLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Statistics */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-info">
              <h3>{stats?.total_orders || 0}</h3>
              <p>Total Orders</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats?.completed_orders || 0}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚚</div>
            <div className="stat-info">
              <h3>{stats?.pending_orders || 0}</h3>
              <p>Pending</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">₵</div>
            <div className="stat-info">
              <h3>₵{(stats?.total_spent || 0).toLocaleString()}</h3>
              <p>Total Spent</p>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="products-section">
          <div className="section-header">
            <h2>My Orders</h2>
            <div className="filter-controls">
              <button 
                className={filter === 'all' ? 'active' : ''} 
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={filter === 'pending' ? 'active' : ''} 
                onClick={() => setFilter('pending')}
              >
                Pending
              </button>
              <button 
                className={filter === 'shipped' ? 'active' : ''} 
                onClick={() => setFilter('shipped')}
              >
                Shipped
              </button>
              <button 
                className={filter === 'completed' ? 'active' : ''} 
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="empty-state">
              <p>No orders found</p>
              <Link to="/" className="btn-primary">Start Shopping</Link>
            </div>
          ) : (
            <div className="orders-list">
              {filteredOrders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <h3>Order #{order.order_number}</h3>
                      <p className="order-date">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <span className={`status-badge ${getStatusBadge(order.status).class}`}>
                      {getStatusBadge(order.status).text}
                    </span>
                  </div>

                  <div className="order-body">
                    <div className="order-product">
                      <div className="product-image">
                        {order.product_image ? (
                          <img src={order.product_image} alt={order.product_name} />
                        ) : (
                          <div className="image-placeholder">📷</div>
                        )}
                      </div>
                      <div className="product-details">
                        <h4>
                          <Link to={`/product/${order.product_slug}`}>
                            {order.product_name}
                          </Link>
                        </h4>
                        <div className="seller-store-card">
                          <span className="store-icon">🏪</span>
                          <div className="store-info">
                            <Link to={`/seller/${order.seller_slug}`} className="store-name">
                              {order.seller_name}
                              {order.seller_verified && <span className="verified-badge">✓ Verified</span>}
                            </Link>
                            <span className="store-label">Seller Store</span>
                          </div>
                        </div>
                        <p className="order-quantity">Quantity: {order.quantity}</p>
                        <p className="order-price">₵{order.total_amount.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="order-info">
                      <p><strong>Delivery Address:</strong></p>
                      <p>{order.delivery_address}</p>
                      {order.tracking_number && (
                        <p><strong>Tracking:</strong> {order.tracking_number}</p>
                      )}
                      {order.shipped_at && (
                        <p><strong>Shipped:</strong> {new Date(order.shipped_at).toLocaleString()}</p>
                      )}
                      {order.delivered_at && (
                        <p><strong>Delivered:</strong> {new Date(order.delivered_at).toLocaleString()}</p>
                      )}
                      <p className="escrow-status">
                        🔒 Escrow: <strong>{order.escrow_status}</strong>
                      </p>
                      {order.delivery_proof_url && (
                        <div className="delivery-proof">
                          <p><strong>📸 Delivery Photo:</strong></p>
                          <p className="delivery-note">Uploaded by delivery driver - please review and confirm</p>
                          <img
                            src={`${getUploadsBaseUrl()}${order.delivery_proof_url}`}
                            alt="Delivery proof"
                            className="delivery-proof-image"
                          />
                        </div>
                      )}
                      {order.delivery_signature_data && (
                        <div className="delivery-proof">
                          <p><strong>Buyer Signature:</strong> {order.delivery_signature_name || 'On file'}</p>
                          <img
                            src={order.delivery_signature_data}
                            alt="Buyer signature"
                            className="delivery-proof-image signature-proof"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="order-actions">
                    {(order.status === 'shipped' || order.status === 'delivered') && !order.buyer_confirmed_at && (
                      <button 
                        onClick={() => openSignatureModal(order)}
                        className={`btn-primary ${order.delivery_proof_url ? 'highlight-action' : ''}`}
                        title={order.delivery_proof_url ? 'Delivery proof available - please confirm' : 'Confirm delivery when received'}
                      >
                        {order.delivery_proof_url ? '✅ Confirm Delivery (Proof Available)' : 'Confirm Delivery'}
                      </button>
                    )}
                    {(order.status === 'pending' || order.status === 'shipped') && (
                      <button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowIssueModal(true);
                        }}
                        className="btn-secondary"
                      >
                        Report Issue
                      </button>
                    )}
                    <button 
                      onClick={() => openMessageModal(order)}
                      className="btn-contact-seller"
                    >
                      💬 Contact Seller
                    </button>
                    <Link 
                      to={`/seller/${order.seller_slug}`}
                      className="btn-secondary"
                    >
                      🏪 Visit Store
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report Issue Modal */}
      {showIssueModal && (
        <div className="modal-overlay" onClick={() => setShowIssueModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Report Issue</h2>
            <p>Order #{selectedOrder?.order_number}</p>
            
            <div className="form-group">
              <label>Describe the issue:</label>
              <textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows="5"
                placeholder="Please describe the problem with your order..."
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleReportIssue} className="btn-primary">
                Submit Report
              </button>
              <button onClick={() => setShowIssueModal(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Seller Modal */}
      {showMessageModal && (
        <div className="modal-overlay" onClick={closeMessageModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>💬 Contact Seller</h2>
            <div className="message-seller-header">
              <div className="seller-store-card-modal">
                <span className="store-icon">🏪</span>
                <div className="store-info">
                  <Link to={`/seller/${messageOrder?.seller_slug}`} className="store-name-modal">
                    {messageOrder?.seller_name}
                    {messageOrder?.seller_verified && <span className="verified-badge">✓</span>}
                  </Link>
                  <span className="store-label">Click to visit store</span>
                </div>
              </div>
              <p className="order-reference">Regarding Order #{messageOrder?.order_number}</p>
            </div>

            <div className="form-group">
              <label>Your Message</label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows="6"
                placeholder={`Ask ${messageOrder?.seller_name} about your order, product details, shipping status, or any other questions...`}
              />
            </div>

            <div className="modal-actions">
              <button onClick={handleSendMessage} className="btn-primary" disabled={messageSending}>
                {messageSending ? 'Sending...' : '📤 Send Message'}
              </button>
              <button onClick={closeMessageModal} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignatureModal && (
        <div className="modal-overlay" onClick={closeSignatureModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Delivery</h2>
            <p>Order #{signatureOrder?.order_number}</p>

            <div className="form-group">
              <label>Your full name</label>
              <input
                type="text"
                value={signatureName}
                onChange={(e) => setSignatureName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label>Signature</label>
              <div className="signature-pad">
                <canvas
                  ref={signatureCanvasRef}
                  width="520"
                  height="160"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className="signature-actions">
                <button type="button" className="btn-secondary" onClick={clearSignature}>
                  Clear Signature
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={handleConfirmReceived} className="btn-primary" disabled={isConfirming}>
                {isConfirming ? 'Submitting...' : 'Confirm Delivery'}
              </button>
              <button onClick={closeSignatureModal} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerDashboardPage;
