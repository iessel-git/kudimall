import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDeliveryProfile,
  getDeliveryOrders,
  getAvailableDeliveryOrders,
  claimDeliveryOrder,
  uploadDeliveryProofPhotoByDelivery
} from '../services/api';
import '../styles/SellerDashboard.css';

const DeliveryDashboardPage = () => {
  const navigate = useNavigate();
  const [deliveryUser, setDeliveryUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimNumber, setClaimNumber] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [uploadingOrder, setUploadingOrder] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState({});
  const [claimingOrderId, setClaimingOrderId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const [profileRes, ordersRes, availableRes] = await Promise.all([
        getDeliveryProfile(),
        getDeliveryOrders(),
        getAvailableDeliveryOrders()
      ]);
      setDeliveryUser(profileRes.data.deliveryUser);
      setOrders(ordersRes.data.orders || []);
      setAvailableOrders(availableRes.data.orders || []);
    } catch (error) {
      console.error('Error loading delivery dashboard:', error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem('delivery_token');
        localStorage.removeItem('delivery_info');
        navigate('/delivery/login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('delivery_token');
    if (!token) {
      navigate('/delivery/login');
      return;
    }
    fetchOrders();
  }, [navigate, fetchOrders]);

  const handleLogout = () => {
    localStorage.removeItem('delivery_token');
    localStorage.removeItem('delivery_info');
    navigate('/delivery/login');
  };

  const handleClaimOrder = async (e) => {
    e.preventDefault();
    if (!claimNumber.trim()) {
      alert('Please enter an order number');
      return;
    }

    try {
      setClaiming(true);
      const response = await claimDeliveryOrder(claimNumber.trim());
      alert(`✅ Order ${claimNumber.trim()} claimed successfully!`);
      setClaimNumber('');
      await fetchOrders();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to claim order';
      alert(`❌ ${errorMsg}`);
      console.error('Claim error:', error.response?.data);
    } finally {
      setClaiming(false);
    }
  };

  const handleQuickClaim = async (orderNumber) => {
    if (claimingOrderId) return;

    try {
      setClaimingOrderId(orderNumber);
      await claimDeliveryOrder(orderNumber);
      alert(`✅ Order ${orderNumber} claimed successfully!`);
      await fetchOrders();
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to claim order';
      alert(`❌ ${errorMsg}`);
      console.error('Claim error:', error.response?.data);
    } finally {
      setClaimingOrderId(null);
    }
  };

  const handleFileChange = (orderNumber, file) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [orderNumber]: file
    }));
  };

  const handleUploadProof = async (orderNumber) => {
    const file = selectedFiles[orderNumber];
    if (!file) {
      alert('Please select a delivery photo first.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setUploadingOrder(orderNumber);
      await uploadDeliveryProofPhotoByDelivery(orderNumber, formData);
      await fetchOrders();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to upload delivery proof');
    } finally {
      setUploadingOrder(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading delivery dashboard...</div>;
  }

  return (
    <div className="seller-dashboard">
      <div className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div>
              <h1>Delivery Dashboard</h1>
              <p className="seller-email">{deliveryUser?.name}</p>
            </div>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="delivery-claim-card">
          <h2>Claim an Order</h2>
          <form onSubmit={handleClaimOrder} className="delivery-claim-form">
            <input
              type="text"
              value={claimNumber}
              onChange={(e) => setClaimNumber(e.target.value)}
              placeholder="Enter order number (e.g. KM-1234ABCD)"
            />
            <button type="submit" className="btn-primary" disabled={claiming}>
              {claiming ? 'Claiming...' : 'Claim Order'}
            </button>
          </form>
        </div>

        {availableOrders.length > 0 && (
          <div className="delivery-orders">
            <h2>📦 Available Orders ({availableOrders.length})</h2>
            <p className="available-orders-subtitle">These orders are ready for pickup and delivery</p>
            <div className="delivery-orders-grid">
              {availableOrders.map((order) => (
                <div key={order.id} className="delivery-order-card available">
                  <div className="delivery-order-header">
                    <h3>Order #{order.order_number}</h3>
                    <span className="status-badge status-shipped">
                      {order.status}
                    </span>
                  </div>
                  <p><strong>Buyer:</strong> {order.buyer_name}</p>
                  <p><strong>Phone:</strong> {order.buyer_phone}</p>
                  <p><strong>Address:</strong> {order.delivery_address}</p>
                  {order.tracking_number && (
                    <p><strong>Tracking:</strong> {order.tracking_number}</p>
                  )}
                  {order.product_name && (
                    <p><strong>Item:</strong> {order.product_name}</p>
                  )}
                  <p><strong>Seller:</strong> {order.seller_name} {order.seller_phone && `(${order.seller_phone})`}</p>
                  
                  <button
                    onClick={() => handleQuickClaim(order.order_number)}
                    className="btn-primary btn-claim-order"
                    disabled={claimingOrderId === order.order_number}
                  >
                    {claimingOrderId === order.order_number ? '⏳ Claiming...' : '✅ Claim This Order'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="delivery-orders">
          <h2>My Deliveries</h2>
          {orders.length === 0 ? (
            <div className="empty-state">
              <p>No assigned orders yet.</p>
            </div>
          ) : (
            <div className="delivery-orders-grid">
              {orders.map((order) => (
                <div key={order.id} className="delivery-order-card">
                  <div className="delivery-order-header">
                    <h3>Order #{order.order_number}</h3>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>
                  </div>
                  <p><strong>Buyer:</strong> {order.buyer_name}</p>
                  <p><strong>Phone:</strong> {order.buyer_phone}</p>
                  <p><strong>Address:</strong> {order.delivery_address}</p>
                  {order.tracking_number && (
                    <p><strong>Tracking:</strong> {order.tracking_number}</p>
                  )}
                  {order.product_name && (
                    <p><strong>Item:</strong> {order.product_name}</p>
                  )}

                  <div className="delivery-proof-section">
                    <label className="delivery-proof-label">Delivery Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(order.order_number, e.target.files[0])}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleUploadProof(order.order_number)}
                      disabled={uploadingOrder === order.order_number}
                    >
                      {uploadingOrder === order.order_number ? 'Uploading...' : 'Upload Proof'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryDashboardPage;
