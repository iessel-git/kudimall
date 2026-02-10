import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import '../styles/SupportPage.css';
import '../styles/ApplicationPage.css';

const ReceiptConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationStep, setConfirmationStep] = useState('review'); // review, condition, rating, success
  const [formData, setFormData] = useState({
    receivedComplete: '',
    itemCondition: '',
    matchesDescription: '',
    rating: 0,
    reviewTitle: '',
    reviewText: '',
    images: [],
    issueDescription: ''
  });

  useEffect(() => {
    // In a real app, fetch order details from API
    const fetchOrderDetails = async () => {
      setLoading(true);
      // Simulated API call
      setTimeout(() => {
        // Mock data
        const mockOrder = {
          id: orderId || 'ORD-2024-001234',
          orderDate: '2024-01-25',
          items: [
            {
              id: 1,
              name: 'Wireless Bluetooth Headphones',
              price: 89.99,
              quantity: 1,
              image: '/api/placeholder/100/100',
              seller: 'TechGear Store'
            }
          ],
          total: 89.99,
          trackingNumber: 'TRACK123456',
          deliveryDate: '2024-02-01',
          seller: {
            name: 'TechGear Store',
            rating: 4.8,
            totalSales: 1253
          },
          shippingAddress: {
            name: 'John Doe',
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001'
          }
        };
        setOrder(mockOrder);
        setLoading(false);
      }, 1000);
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRatingClick = (rating) => {
    setFormData({
      ...formData,
      rating: rating
    });
  };

  const handleReviewStep = () => {
    if (formData.receivedComplete === 'no' || 
        formData.itemCondition === 'damaged' || 
        formData.matchesDescription === 'no') {
      setConfirmationStep('issue');
    } else {
      setConfirmationStep('rating');
    }
  };

  const handleSubmitIssue = (e) => {
    e.preventDefault();
    // In real app, submit issue to support
    alert('Issue reported. Our support team will contact you within 24 hours. Funds will remain in escrow until resolved.');
    navigate('/');
  };

  const handleSubmitConfirmation = (e) => {
    e.preventDefault();
    
    // In real app, submit confirmation to API
    console.log('Receipt Confirmation:', {
      orderId: order.id,
      ...formData
    });
    
    setConfirmationStep('success');
  };

  if (loading) {
    return (
      <div className="support-page">
        <div className="container">
          <div className="loading-state">
            <p>Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="support-page">
        <div className="container">
          <div className="error-state">
            <h2>Order Not Found</h2>
            <p>We couldn't find the order you're looking for.</p>
            <button onClick={() => navigate('/')} className="btn-primary">
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="support-page">
      <div className="container">
        <div className="support-header">
          <h1>Receipt Confirmation</h1>
          <p>Confirm you received your order to release payment to seller</p>
        </div>

        <div className="receipt-confirmation-container">
          {/* Order Summary */}
          <div className="order-summary-card">
            <h3>Order Details</h3>
            <div className="order-info">
              <div className="info-row">
                <span className="label">Order ID:</span>
                <span className="value">{order.id}</span>
              </div>
              <div className="info-row">
                <span className="label">Order Date:</span>
                <span className="value">{order.orderDate}</span>
              </div>
              <div className="info-row">
                <span className="label">Delivery Date:</span>
                <span className="value">{order.deliveryDate}</span>
              </div>
              <div className="info-row">
                <span className="label">Tracking:</span>
                <span className="value">{order.trackingNumber}</span>
              </div>
            </div>

            <div className="order-items">
              {order.items.map(item => (
                <div key={item.id} className="order-item">
                  <div className="item-details">
                    <h4>{item.name}</h4>
                    <p className="seller-name">Sold by: {item.seller}</p>
                    <p className="item-price">${item.price.toFixed(2)} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="order-total">
              <span>Total:</span>
              <span className="total-amount">${order.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Review Step */}
          {confirmationStep === 'review' && (
            <div className="confirmation-form">
              <h3>Confirm Receipt</h3>
              <p className="form-intro">Please answer the following questions about your order:</p>

              <div className="form-group">
                <label>Did you receive all items ordered? *</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="receivedComplete"
                      value="yes"
                      checked={formData.receivedComplete === 'yes'}
                      onChange={handleChange}
                    />
                    <span>Yes, I received everything</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="receivedComplete"
                      value="no"
                      checked={formData.receivedComplete === 'no'}
                      onChange={handleChange}
                    />
                    <span>No, items are missing</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>What is the condition of the items? *</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="itemCondition"
                      value="perfect"
                      checked={formData.itemCondition === 'perfect'}
                      onChange={handleChange}
                    />
                    <span>Perfect condition</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="itemCondition"
                      value="minor"
                      checked={formData.itemCondition === 'minor'}
                      onChange={handleChange}
                    />
                    <span>Minor imperfections (acceptable)</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="itemCondition"
                      value="damaged"
                      checked={formData.itemCondition === 'damaged'}
                      onChange={handleChange}
                    />
                    <span>Damaged or defective</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Do the items match the description? *</label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="matchesDescription"
                      value="yes"
                      checked={formData.matchesDescription === 'yes'}
                      onChange={handleChange}
                    />
                    <span>Yes, exactly as described</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="matchesDescription"
                      value="no"
                      checked={formData.matchesDescription === 'no'}
                      onChange={handleChange}
                    />
                    <span>No, different from description</span>
                  </label>
                </div>
              </div>

              <div className="escrow-notice">
                <span className="notice-icon">🔒</span>
                <div>
                  <h4>Escrow Protection Active</h4>
                  <p>Your payment is held securely. By confirming receipt, you authorize the release of funds to the seller. If there are any issues, funds will remain protected.</p>
                </div>
              </div>

              <button 
                onClick={handleReviewStep}
                disabled={!formData.receivedComplete || !formData.itemCondition || !formData.matchesDescription}
                className="btn-primary"
              >
                Continue
              </button>
            </div>
          )}

          {/* Issue Reporting Step */}
          {confirmationStep === 'issue' && (
            <div className="confirmation-form">
              <h3>Report Issue</h3>
              <p className="form-intro">We're sorry to hear there's a problem. Please provide details so we can help resolve it.</p>

              <div className="issue-alert">
                <span className="alert-icon">⚠️</span>
                <p>Don't worry - your payment is still protected in escrow. We'll work with you and the seller to resolve this issue.</p>
              </div>

              <form onSubmit={handleSubmitIssue}>
                <div className="form-group">
                  <label htmlFor="issueDescription">Describe the issue *</label>
                  <textarea
                    id="issueDescription"
                    name="issueDescription"
                    rows="6"
                    value={formData.issueDescription}
                    onChange={handleChange}
                    placeholder="Please provide as much detail as possible about the problem..."
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Upload photos (optional but recommended)</label>
                  <input type="file" accept="image/*" multiple />
                  <small>Photos help us resolve issues faster</small>
                </div>

                <div className="info-box">
                  <h4>What happens next?</h4>
                  <ul>
                    <li>Our support team will review your case within 24 hours</li>
                    <li>We'll contact both you and the seller</li>
                    <li>Funds remain in escrow until resolved</li>
                    <li>You may be eligible for a full refund or replacement</li>
                  </ul>
                </div>

                <div className="button-group">
                  <button type="button" onClick={() => setConfirmationStep('review')} className="btn-secondary">
                    Back
                  </button>
                  <button type="submit" className="btn-primary">
                    Submit Issue
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Rating Step */}
          {confirmationStep === 'rating' && (
            <div className="confirmation-form">
              <h3>Rate Your Experience</h3>
              <p className="form-intro">Help other buyers by sharing your experience</p>

              <form onSubmit={handleSubmitConfirmation}>
                <div className="form-group">
                  <label>Overall Rating *</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`star ${formData.rating >= star ? 'filled' : ''}`}
                        onClick={() => handleRatingClick(star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <p className="rating-text">
                    {formData.rating === 0 && 'Click to rate'}
                    {formData.rating === 1 && 'Poor'}
                    {formData.rating === 2 && 'Fair'}
                    {formData.rating === 3 && 'Good'}
                    {formData.rating === 4 && 'Very Good'}
                    {formData.rating === 5 && 'Excellent'}
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="reviewTitle">Review Title (Optional)</label>
                  <input
                    type="text"
                    id="reviewTitle"
                    name="reviewTitle"
                    value={formData.reviewTitle}
                    onChange={handleChange}
                    placeholder="Summarize your experience"
                    maxLength="100"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reviewText">Your Review (Optional)</label>
                  <textarea
                    id="reviewText"
                    name="reviewText"
                    rows="4"
                    value={formData.reviewText}
                    onChange={handleChange}
                    placeholder="Share details about the product quality, seller communication, shipping speed, etc."
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Add Photos to Your Review (Optional)</label>
                  <input type="file" accept="image/*" multiple />
                  <small>Photos help other buyers see the actual product</small>
                </div>

                <div className="confirmation-summary">
                  <h4>By confirming, you agree that:</h4>
                  <ul>
                    <li>✓ You received all ordered items</li>
                    <li>✓ Items are in acceptable condition</li>
                    <li>✓ Payment will be released from escrow to seller</li>
                    <li>✓ This order will be marked as complete</li>
                  </ul>
                </div>

                <div className="button-group">
                  <button type="button" onClick={() => setConfirmationStep('review')} className="btn-secondary">
                    Back
                  </button>
                  <button type="submit" disabled={formData.rating === 0} className="btn-primary">
                    Confirm Receipt & Submit Review
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Success Step */}
          {confirmationStep === 'success' && (
            <div className="confirmation-success">
              <div className="success-icon">✓</div>
              <h2>Receipt Confirmed!</h2>
              <p>Thank you for confirming your order receipt.</p>

              <div className="success-details">
                <div className="detail-card">
                  <h4>Payment Released</h4>
                  <p>The seller will receive their payment within 1-2 business days.</p>
                </div>
                <div className="detail-card">
                  <h4>Review Posted</h4>
                  <p>Your {formData.rating}-star review has been published and will help other buyers.</p>
                </div>
                <div className="detail-card">
                  <h4>Order Complete</h4>
                  <p>This order is now marked as complete in your purchase history.</p>
                </div>
              </div>

              <div className="success-actions">
                <button onClick={() => navigate('/')} className="btn-primary">
                  Continue Shopping
                </button>
                <button onClick={() => navigate(`/seller/${order.seller.name}`)} className="btn-secondary">
                  Visit Seller Store
                </button>
              </div>

              <div className="thank-you-message">
                <p>Thank you for shopping with KudiMall! We hope to serve you again soon.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceiptConfirmationPage;
