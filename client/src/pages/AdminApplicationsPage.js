import React, { useState, useEffect, useCallback } from 'react';
import { getSellerApplications, updateSellerApplication } from '../services/api';
import '../styles/AdminApplicationsPage.css';

const AdminApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await getSellerApplications(params);
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusUpdate = async (applicationId, newStatus) => {
    setUpdating(true);
    try {
      await updateSellerApplication(applicationId, {
        status: newStatus,
        admin_notes: adminNotes,
        reviewed_by: 'Admin' // In production, use actual admin user
      });
      
      alert(`Application ${newStatus} successfully!`);
      setSelectedApp(null);
      setAdminNotes('');
      fetchApplications();
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const viewDetails = (app) => {
    setSelectedApp(app);
    setAdminNotes(app.admin_notes || '');
  };

  const closeModal = () => {
    setSelectedApp(null);
    setAdminNotes('');
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      pending: 'status-pending',
      reviewing: 'status-reviewing',
      approved: 'status-approved',
      rejected: 'status-rejected'
    };
    return classes[status] || 'status-pending';
  };

  if (loading) {
    return <div className="loading">Loading applications...</div>;
  }

  return (
    <div className="admin-applications-page">
      <div className="container">
        <div className="admin-header">
          <h1>Seller Applications Management</h1>
          <p className="subtitle">Review and manage seller applications</p>
        </div>

        <div className="filters">
          <button 
            className={filter === 'all' ? 'active' : ''} 
            onClick={() => setFilter('all')}
          >
            All Applications
          </button>
          <button 
            className={filter === 'pending' ? 'active' : ''} 
            onClick={() => setFilter('pending')}
          >
            Pending
          </button>
          <button 
            className={filter === 'reviewing' ? 'active' : ''} 
            onClick={() => setFilter('reviewing')}
          >
            Under Review
          </button>
          <button 
            className={filter === 'approved' ? 'active' : ''} 
            onClick={() => setFilter('approved')}
          >
            Approved
          </button>
          <button 
            className={filter === 'rejected' ? 'active' : ''} 
            onClick={() => setFilter('rejected')}
          >
            Rejected
          </button>
        </div>

        <div className="applications-table">
          {applications.length === 0 ? (
            <div className="no-results">
              <p>No applications found.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Store Name</th>
                  <th>Applicant</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td className="app-id">{app.application_id}</td>
                    <td className="store-name">{app.store_name}</td>
                    <td>{app.first_name} {app.last_name}</td>
                    <td>{app.email}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(app.status)}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </td>
                    <td>{new Date(app.created_at).toLocaleDateString()}</td>
                    <td>
                      <button 
                        className="btn-view" 
                        onClick={() => viewDetails(app)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Application Details</h2>
              <button className="close-btn" onClick={closeModal}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-section">
                <h3>📋 Personal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Name:</strong>
                    <span>{selectedApp.first_name} {selectedApp.last_name}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Email:</strong>
                    <span>{selectedApp.email}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Phone:</strong>
                    <span>{selectedApp.phone}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>🏢 Business Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Business Name:</strong>
                    <span>{selectedApp.business_name}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Business Type:</strong>
                    <span>{selectedApp.business_type}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Address:</strong>
                    <span>
                      {selectedApp.business_address}, {selectedApp.city}, {selectedApp.state} {selectedApp.zip_code}, {selectedApp.country}
                    </span>
                  </div>
                  {selectedApp.tax_id && (
                    <div className="detail-item">
                      <strong>Tax ID:</strong>
                      <span>{selectedApp.tax_id}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="detail-section">
                <h3>🏪 Store Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Store Name:</strong>
                    <span>{selectedApp.store_name}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Description:</strong>
                    <span>{selectedApp.store_description}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Product Categories:</strong>
                    <span>{selectedApp.product_categories}</span>
                  </div>
                  {selectedApp.estimated_monthly_volume && (
                    <div className="detail-item">
                      <strong>Est. Monthly Volume:</strong>
                      <span>{selectedApp.estimated_monthly_volume}</span>
                    </div>
                  )}
                </div>
              </div>

              {(selectedApp.instagram_handle || selectedApp.facebook_page || 
                selectedApp.twitter_handle || selectedApp.tiktok_handle || 
                selectedApp.website_url) && (
                <div className="detail-section">
                  <h3>📱 Social Media</h3>
                  <div className="detail-grid">
                    {selectedApp.instagram_handle && (
                      <div className="detail-item">
                        <strong>Instagram:</strong>
                        <span>{selectedApp.instagram_handle}</span>
                      </div>
                    )}
                    {selectedApp.facebook_page && (
                      <div className="detail-item">
                        <strong>Facebook:</strong>
                        <span>{selectedApp.facebook_page}</span>
                      </div>
                    )}
                    {selectedApp.twitter_handle && (
                      <div className="detail-item">
                        <strong>Twitter/X:</strong>
                        <span>{selectedApp.twitter_handle}</span>
                      </div>
                    )}
                    {selectedApp.tiktok_handle && (
                      <div className="detail-item">
                        <strong>TikTok:</strong>
                        <span>{selectedApp.tiktok_handle}</span>
                      </div>
                    )}
                    {selectedApp.website_url && (
                      <div className="detail-item">
                        <strong>Website:</strong>
                        <span>{selectedApp.website_url}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h3>🏦 Banking Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>Bank Name:</strong>
                    <span>{selectedApp.bank_name}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Account Holder:</strong>
                    <span>{selectedApp.account_holder_name}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Account Number:</strong>
                    <span>****{selectedApp.account_number_last4}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Routing Number:</strong>
                    <span>{selectedApp.routing_number}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>✅ Verification</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <strong>ID Type:</strong>
                    <span>{selectedApp.id_type}</span>
                  </div>
                  <div className="detail-item">
                    <strong>ID Number:</strong>
                    <span>{selectedApp.id_number}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>📝 Admin Notes</h3>
                <textarea
                  className="admin-notes-input"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this application..."
                  rows="4"
                />
              </div>

              <div className="detail-section">
                <h3>📊 Application Status</h3>
                <p>
                  <strong>Current Status:</strong> 
                  <span className={`status-badge ${getStatusBadgeClass(selectedApp.status)}`}>
                    {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
                  </span>
                </p>
                {selectedApp.reviewed_by && (
                  <p><strong>Reviewed By:</strong> {selectedApp.reviewed_by}</p>
                )}
                {selectedApp.reviewed_at && (
                  <p><strong>Reviewed At:</strong> {new Date(selectedApp.reviewed_at).toLocaleString()}</p>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-action btn-reviewing" 
                onClick={() => handleStatusUpdate(selectedApp.id, 'reviewing')}
                disabled={updating || selectedApp.status === 'reviewing'}
              >
                Mark as Reviewing
              </button>
              <button 
                className="btn-action btn-approved" 
                onClick={() => handleStatusUpdate(selectedApp.id, 'approved')}
                disabled={updating || selectedApp.status === 'approved'}
              >
                Approve
              </button>
              <button 
                className="btn-action btn-rejected" 
                onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')}
                disabled={updating || selectedApp.status === 'rejected'}
              >
                Reject
              </button>
              <button 
                className="btn-cancel" 
                onClick={closeModal}
                disabled={updating}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApplicationsPage;
