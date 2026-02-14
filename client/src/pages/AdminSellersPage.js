import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/AdminSellersPage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminSellersPage = () => {
  const [sellers, setSellers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [verificationData, setVerificationData] = useState({
    is_verified: false,
    trust_level: 0,
    admin_notes: ''
  });
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    shop_name: '',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchStats();
    fetchSellers();
  }, [filter, searchTerm]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/stats`);
      console.log('Stats response:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      console.error('Stats error details:', error.response?.data || error.message);
    }
  };

  const fetchSellers = async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      
      if (filter === 'verified') {
        params.verified = 'true';
      } else if (filter === 'unverified') {
        params.verified = 'false';
      } else if (filter === 'high_trust') {
        params.verified = 'true';
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }

      console.log('Fetching sellers with params:', params);
      const response = await axios.get(`${API_BASE_URL}/admin/sellers`, { params });
      console.log('Sellers response:', response.data);
      
      let sellersList = response.data.sellers || [];
      console.log('Sellers list:', sellersList);
      
      // Additional client-side filtering for high trust
      if (filter === 'high_trust') {
        sellersList = sellersList.filter(s => s.trust_level >= 4);
      }
      
      setSellers(sellersList);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      console.error('Error details:', error.response?.data || error.message);
      setSellers([]);
    } finally {
      setLoading(false);
    }
  };

  const viewSellerDetails = async (sellerId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/sellers/${sellerId}`);
      const seller = response.data.seller || response.data;
      setSelectedSeller(seller);
      setVerificationData({
        is_verified: seller.is_verified || false,
        trust_level: seller.trust_level || 0,
        admin_notes: ''
      });
      setProfileData({
        name: seller.name || '',
        email: seller.email || '',
        phone: seller.phone || '',
        shop_name: seller.shop_name || '',
        location: seller.location || '',
        description: seller.description || ''
      });
      setEditing(false);
    } catch (error) {
      console.error('Error fetching seller details:', error);
      alert('Failed to load seller details');
    }
  };

  const handleVerificationUpdate = async () => {
    if (!selectedSeller) return;

    setUpdating(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/admin/sellers/${selectedSeller.id}/verification`,
        verificationData
      );
      
      alert('✅ Seller verification updated successfully!');
      setSelectedSeller(null);
      fetchSellers();
      fetchStats();
    } catch (error) {
      console.error('Error updating verification:', error);
      alert('❌ Failed to update seller verification');
    } finally {
      setUpdating(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!selectedSeller) return;

    setUpdating(true);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/admin/sellers/${selectedSeller.id}`,
        profileData
      );
      
      alert('✅ Seller profile updated successfully!');
      setSelectedSeller(response.data.seller);
      setEditing(false);
      fetchSellers();
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update seller profile';
      alert(`❌ ${errorMsg}`);
    } finally {
      setUpdating(false);
    }
  };

  const getVerificationBadge = (seller) => {
    if (seller.is_verified) {
      return <span className="badge badge-verified">✓ Verified</span>;
    }
    return <span className="badge badge-unverified">Unverified</span>;
  };

  const getTrustLevelBadge = (level) => {
    if (level >= 8) return <span className="trust-badge trust-excellent">🌟 {level}/10</span>;
    if (level >= 6) return <span className="trust-badge trust-good">⭐ {level}/10</span>;
    if (level >= 4) return <span className="trust-badge trust-fair">✓ {level}/10</span>;
    return <span className="trust-badge trust-low">{level}/10</span>;
  };

  return (
    <div className="admin-sellers-page">
      <div className="container">
        <div className="admin-header">
          <h1>🏪 Seller Verification Management</h1>
          <p>Manage seller verification status, trust levels, and platform badges</p>
        </div>

        {/* Statistics Dashboard */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.total_sellers || 0}</div>
              <div className="stat-label">Total Sellers</div>
            </div>
            <div className="stat-card verified">
              <div className="stat-value">{stats.verified_sellers || 0}</div>
              <div className="stat-label">✓ Verified</div>
            </div>
            <div className="stat-card unverified">
              <div className="stat-value">{stats.unverified_sellers || 0}</div>
              <div className="stat-label">Unverified</div>
            </div>
            <div className="stat-card featured">
              <div className="stat-value">{stats.featured_eligible || 0}</div>
              <div className="stat-label">⭐ Featured Eligible</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''} 
              onClick={() => setFilter('all')}
            >
              All Sellers
            </button>
            <button 
              className={filter === 'verified' ? 'active' : ''} 
              onClick={() => setFilter('verified')}
            >
              ✓ Verified
            </button>
            <button 
              className={filter === 'unverified' ? 'active' : ''} 
              onClick={() => setFilter('unverified')}
            >
              Unverified
            </button>
            <button 
              className={filter === 'high_trust' ? 'active' : ''} 
              onClick={() => setFilter('high_trust')}
            >
              ⭐ High Trust (4+)
            </button>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, email, or shop..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Sellers Table */}
        <div className="sellers-table-section">
          {!loading && sellers.length === 0 ? (
            <div className="no-results">
              <p>No sellers found</p>
            </div>
          ) : loading ? (
            <div className="loading">Loading sellers...</div>
          ) : (
            <table className="sellers-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Seller Info</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Trust Level</th>
                  <th>Products</th>
                  <th>Sales</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller.id}>
                    <td>{seller.id}</td>
                    <td className="seller-info">
                      <div className="seller-name">
                        {seller.name || 'No Name'}
                      </div>
                      <div className="shop-name">
                        🏪 {seller.shop_name}
                      </div>
                    </td>
                    <td>
                      <div>{seller.email}</div>
                      {seller.phone && <div className="phone">{seller.phone}</div>}
                    </td>
                    <td>
                      {getVerificationBadge(seller)}
                      <br />
                      {seller.email_verified ? (
                        <span className="badge badge-email-ok">✉️ Verified</span>
                      ) : (
                        <span className="badge badge-email-no">✉️ Not Verified</span>
                      )}
                    </td>
                    <td>{getTrustLevelBadge(seller.trust_level)}</td>
                    <td>
                      <div>{seller.active_products}/{seller.product_count}</div>
                      <small>active/total</small>
                    </td>
                    <td>{seller.total_sales || 0}</td>
                    <td>{new Date(seller.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-manage"
                        onClick={() => viewSellerDetails(seller.id)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {selectedSeller && (
        <div className="modal-overlay" onClick={() => setSelectedSeller(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Manage Seller Verification</h2>
              <button className="close-btn" onClick={() => setSelectedSeller(null)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              {/* Seller Info */}
              <div className="seller-details">
                <div className="section-header">
                  <h3>📋 Seller Information</h3>
                  {!editing ? (
                    <button
                      className="btn-edit"
                      onClick={() => setEditing(true)}
                      disabled={updating}
                    >
                      ✏️ Edit Profile
                    </button>
                  ) : (
                    <div className="edit-actions">
                      <button
                        className="btn-cancel-edit"
                        onClick={() => {
                          setEditing(false);
                          setProfileData({
                            name: selectedSeller.name || '',
                            email: selectedSeller.email || '',
                            phone: selectedSeller.phone || '',
                            shop_name: selectedSeller.shop_name || '',
                            location: selectedSeller.location || '',
                            description: selectedSeller.description || ''
                          });
                        }}
                        disabled={updating}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn-save-edit"
                        onClick={handleProfileUpdate}
                        disabled={updating}
                      >
                        {updating ? 'Saving...' : '💾 Save Profile'}
                      </button>
                    </div>
                  )}
                </div>

                {editing ? (
                  <div className="edit-form">
                    <div className="form-group">
                      <label>Name:</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Enter seller name"
                      />
                    </div>
                    <div className="form-group">
                      <label>Shop Name:</label>
                      <input
                        type="text"
                        value={profileData.shop_name}
                        onChange={(e) => setProfileData({ ...profileData, shop_name: e.target.value })}
                        placeholder="Enter shop name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email:</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone:</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="form-group">
                      <label>Location:</label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                        placeholder="Enter location"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description:</label>
                      <textarea
                        value={profileData.description}
                        onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                        placeholder="Enter shop description"
                        rows="3"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Name:</strong>
                      <span>{selectedSeller.name || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Shop Name:</strong>
                      <span>{selectedSeller.shop_name}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Email:</strong>
                      <span>{selectedSeller.email || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Phone:</strong>
                      <span>{selectedSeller.phone || 'Not provided'}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Location:</strong>
                      <span>{selectedSeller.location || 'Not provided'}</span>
                    </div>
                    {selectedSeller.description && (
                      <div className="detail-item full-width">
                        <strong>Description:</strong>
                        <span>{selectedSeller.description}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <strong>Current Status:</strong>
                      <span>
                        {getVerificationBadge(selectedSeller)}
                        {' '}
                        {getTrustLevelBadge(selectedSeller.trust_level)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Verification Form */}
              <div className="verification-form">
                <h3>⚙️ Update Verification Status</h3>

                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={verificationData.is_verified}
                      onChange={(e) =>
                        setVerificationData({
                          ...verificationData,
                          is_verified: e.target.checked
                        })
                      }
                    />
                    <strong> Grant Verified Badge</strong>
                  </label>
                  <p className="help-text">
                    ✓ Verified sellers get a badge and appear in featured sections
                  </p>
                </div>

                <div className="form-group">
                  <label>
                    Trust Level (0-10):
                    <span className="trust-preview">
                      {getTrustLevelBadge(verificationData.trust_level)}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={verificationData.trust_level}
                    onChange={(e) =>
                      setVerificationData({
                        ...verificationData,
                        trust_level: parseInt(e.target.value)
                      })
                    }
                  />
                  <div className="trust-legend">
                    <span>0-3: New</span>
                    <span>4-5: Fair</span>
                    <span>6-7: Good</span>
                    <span>8-10: Excellent</span>
                  </div>
                  <p className="help-text">
                    ⭐ Trust level 4+ is required for Featured Sellers
                  </p>
                </div>

                <div className="form-group">
                  <label>Admin Notes (optional):</label>
                  <textarea
                    value={verificationData.admin_notes}
                    onChange={(e) =>
                      setVerificationData({
                        ...verificationData,
                        admin_notes: e.target.value
                      })
                    }
                    placeholder="Add internal notes about this verification decision..."
                    rows="3"
                  />
                </div>

                <div className="criteria-box">
                  <h4>✅ Verification Criteria:</h4>
                  <ul>
                    <li>Sales history and volume</li>
                    <li>Customer reviews and ratings</li>
                    <li>Product quality and descriptions</li>
                    <li>Response time to inquiries</li>
                    <li>Compliance with platform policies</li>
                    <li>Complete seller profile</li>
                  </ul>
                </div>

                <div className="modal-actions">
                  <button
                    className="btn-cancel"
                    onClick={() => setSelectedSeller(null)}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-save"
                    onClick={handleVerificationUpdate}
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : '✓ Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellersPage;
