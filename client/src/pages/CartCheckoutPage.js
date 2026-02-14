import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PaystackButton } from 'react-paystack';
import { 
  getCart, 
  createOrder,
  getBuyerProfile,
  clearCart 
} from '../services/api';
import '../styles/CartCheckoutPage.css';

const PAYSTACK_PUBLIC_KEY = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_46a6617254ba8ed21bb2b6750475476c320f07a0';

const CartCheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [paymentData, setPaymentData] = useState(null);
  
  const [formData, setFormData] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    delivery_address: '',
    city: '',
    postal_code: '',
    additional_notes: ''
  });

  const [errors, setErrors] = useState({});

  // Calculate delivery fee based on city
  const calculateDeliveryFee = (city) => {
    if (!city) return 0;
    
    const cityLower = city.toLowerCase().trim();
    
    // Major cities - Free delivery
    const majorCities = ['accra', 'kumasi', 'tema', 'takoradi', 'cape coast', 'tamale'];
    if (majorCities.some(majorCity => cityLower.includes(majorCity))) {
      return 0;
    }
    
    // Regional capitals - ₵10 delivery
    const regionalCapitals = [
      'sunyani', 'koforidua', 'ho', 'wa', 'bolgatanga', 
      'sekondi', 'obuasi', 'tarkwa', 'techiman'
    ];
    if (regionalCapitals.some(regional => cityLower.includes(regional))) {
      return 10;
    }
    
    // Remote areas - ₵20 delivery
    return 20;
  };

  const deliveryFee = calculateDeliveryFee(formData.city);
  const orderTotal = cart ? cart.cart_total + deliveryFee : 0;

  const fetchCart = useCallback(async () => {
    try {
      const response = await getCart();
      if (!response.data || response.data.items.length === 0) {
        navigate('/cart');
        return;
      }
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 401) {
        navigate('/buyer/login', { state: { from: { pathname: '/cart-checkout' } } });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const checkBuyerAuth = useCallback(async () => {
    const token = localStorage.getItem('buyer_token');
    if (token) {
      try {
        const response = await getBuyerProfile();
        setBuyer(response.data.buyer);
        setFormData(prev => ({
          ...prev,
          buyer_name: response.data.buyer.name || '',
          buyer_email: response.data.buyer.email || '',
          buyer_phone: response.data.buyer.phone || '',
          delivery_address: response.data.buyer.default_address || ''
        }));
      } catch (error) {
        console.error('Error fetching buyer profile:', error);
      }
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('buyer_token');
    if (!token) {
      navigate('/buyer/login', { state: { from: { pathname: '/cart-checkout' } } });
      return;
    }
    checkBuyerAuth();
    fetchCart();
  }, [navigate, checkBuyerAuth, fetchCart]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    if (!formData.buyer_name.trim()) {
      newErrors.buyer_name = 'Full name is required';
    }
    
    if (!formData.buyer_email.trim()) {
      newErrors.buyer_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.buyer_email)) {
      newErrors.buyer_email = 'Email is invalid';
    }
    
    if (!formData.buyer_phone.trim()) {
      newErrors.buyer_phone = 'Phone number is required';
    } else if (!/^[0-9+\s()-]{10,}$/.test(formData.buyer_phone)) {
      newErrors.buyer_phone = 'Phone number is invalid';
    }
    
    if (!formData.delivery_address.trim()) {
      newErrors.delivery_address = 'Delivery address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinueToReview = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    const orders = [];
    let totalAmount = 0;
    
    try {
      // Step 1: Create orders for each item
      for (const group of cart.seller_groups) {
        for (const item of group.items) {
          const orderData = {
            buyer_name: formData.buyer_name,
            buyer_email: formData.buyer_email,
            buyer_phone: formData.buyer_phone,
            seller_id: group.seller_id,
            product_id: item.product_id,
            quantity: item.quantity,
            delivery_address: `${formData.delivery_address}, ${formData.city}${formData.postal_code ? ', ' + formData.postal_code : ''}${formData.additional_notes ? ' (Note: ' + formData.additional_notes + ')' : ''}`
          };

          const response = await createOrder(orderData);
          orders.push({
            order_number: response.data.order_number,
            seller_name: group.seller_name,
            product_name: item.name,
            total: response.data.total_amount
          });
          totalAmount += parseFloat(response.data.total_amount);
        }
      }
      
      setCompletedOrders(orders);
      
      // Step 2: Initialize Paystack payment
      const paymentAmount = Math.round(totalAmount * 100); // Convert to pesewas
      const paymentPayload = {
        email: formData.buyer_email,
        amount: paymentAmount,
        order_numbers: orders.map(o => o.order_number).join(','),
        metadata: {
          buyer_name: formData.buyer_name,
          buyer_phone: formData.buyer_phone,
          order_count: orders.length,
          order_numbers: orders.map(o => o.order_number)
        }
      };

      // Prepare Paystack config
      setPaymentData({
        email: formData.buyer_email,
        amount: paymentAmount,
        currency: 'GHS', // Ghana Cedis
        reference: `KM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        publicKey: PAYSTACK_PUBLIC_KEY,
        metadata: paymentPayload.metadata
      });

      // Clear cart after successful order creation
      await clearCart();
      
      // Move to payment step
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
    } catch (error) {
      console.error('Error creating orders:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.error || 'Failed to place order. Please try again.';
      alert(`Order failed: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = (reference) => {
    console.log('Payment successful:', reference);
    setCurrentStep(4); // Move to success confirmation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaymentClose = () => {
    console.log('Payment popup closed');
    alert('Payment was not completed. Your orders are on hold pending payment.');
  };

  if (loading) {
    return <div className="loading">Loading checkout...</div>;
  }

  if (!cart) {
    return null;
  }

  const fullAddress = `${formData.delivery_address}${formData.city ? ', ' + formData.city : ''}${formData.postal_code ? ', ' + formData.postal_code : ''}`;

  return (
    <div className="cart-checkout-page">
      <div className="container">
        {/* Progress Indicator */}
        <div className="checkout-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 1 ? '✓' : '1'}</div>
            <div className="step-label">Shipping Info</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 2 ? '✓' : '2'}</div>
            <div className="step-label">Review Order</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">{currentStep > 3 ? '✓' : '3'}</div>
            <div className="step-label">Payment</div>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 4 ? 'active completed' : ''}`}>
            <div className="step-number">{currentStep >= 4 ? '✓' : '4'}</div>
            <div className="step-label">Confirmation</div>
          </div>
        </div>

        {/* Step 1: Shipping Information */}
        {currentStep === 1 && (
          <div className="checkout-content">
            <div className="checkout-main">
              <div className="section-card">
                <div className="section-header">
                  <h2>📍 Shipping Information</h2>
                  <span className="security-badge">🔒 Secure</span>
                </div>

                {buyer && (
                  <div className="buyer-info-banner">
                    <p>
                      ✓ Logged in as <strong>{buyer.name}</strong> ({buyer.email})
                    </p>
                  </div>
                )}
                
                <form onSubmit={handleContinueToReview} className="checkout-form">
                  <div className="form-section">
                    <h3>Contact Details</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="buyer_name">Full Name *</label>
                        <input
                          type="text"
                          id="buyer_name"
                          name="buyer_name"
                          value={formData.buyer_name}
                          onChange={handleInputChange}
                          className={errors.buyer_name ? 'error' : ''}
                          placeholder="John Doe"
                        />
                        {errors.buyer_name && <span className="error-message">{errors.buyer_name}</span>}
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="buyer_email">Email Address *</label>
                        <input
                          type="email"
                          id="buyer_email"
                          name="buyer_email"
                          value={formData.buyer_email}
                          onChange={handleInputChange}
                          className={errors.buyer_email ? 'error' : ''}
                          placeholder="john@example.com"
                        />
                        {errors.buyer_email && <span className="error-message">{errors.buyer_email}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="buyer_phone">Phone Number *</label>
                        <input
                          type="tel"
                          id="buyer_phone"
                          name="buyer_phone"
                          value={formData.buyer_phone}
                          onChange={handleInputChange}
                          className={errors.buyer_phone ? 'error' : ''}
                          placeholder="+233 XX XXX XXXX"
                        />
                        {errors.buyer_phone && <span className="error-message">{errors.buyer_phone}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Delivery Address</h3>
                    <div className="form-group">
                      <label htmlFor="delivery_address">Street Address *</label>
                      <textarea
                        id="delivery_address"
                        name="delivery_address"
                        rows="3"
                        value={formData.delivery_address}
                        onChange={handleInputChange}
                        className={errors.delivery_address ? 'error' : ''}
                        placeholder="House number, street name, neighborhood"
                      ></textarea>
                      {errors.delivery_address && <span className="error-message">{errors.delivery_address}</span>}
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="city">City *</label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className={errors.city ? 'error' : ''}
                          placeholder="Accra"
                        />
                        {errors.city && <span className="error-message">{errors.city}</span>}
                      </div>

                      <div className="form-group">
                        <label htmlFor="postal_code">Postal Code (Optional)</label>
                        <input
                          type="text"
                          id="postal_code"
                          name="postal_code"
                          value={formData.postal_code}
                          onChange={handleInputChange}
                          placeholder="GA-123-4567"
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="additional_notes">Additional Delivery Notes (Optional)</label>
                      <textarea
                        id="additional_notes"
                        name="additional_notes"
                        rows="2"
                        value={formData.additional_notes}
                        onChange={handleInputChange}
                        placeholder="Any special instructions for delivery (e.g., gate code, landmarks)"
                      ></textarea>
                    </div>
                  </div>

                  <div className="form-actions">
                    <Link to="/cart" className="btn-secondary">
                      ← Back to Cart
                    </Link>
                    <button type="submit" className="btn-primary">
                      Continue to Review →
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="checkout-sidebar">
              <div className="section-card">
                <h3>Order Summary</h3>
                <div className="summary-items">
                  {cart.seller_groups.map(group => (
                    <div key={group.seller_id} className="seller-summary">
                      <div className="seller-name">🏪 {group.seller_name}</div>
                      <div className="seller-items">
                        {group.items.map(item => (
                          <div key={item.id} className="summary-item">
                            <span className="item-name">{item.name} × {item.quantity}</span>
                            <span className="item-price">₵{parseFloat(item.subtotal).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="seller-subtotal">
                        <span>Subtotal:</span>
                        <span>₵{group.subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="summary-divider"></div>
                
                <div className="summary-row">
                  <span>Subtotal ({cart.item_count} items):</span>
                  <span>₵{cart.cart_total.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery{formData.city && ` (${formData.city})`}:</span>
                  {deliveryFee === 0 ? (
                    <span className="free-delivery">FREE</span>
                  ) : (
                    <span>₵{deliveryFee.toLocaleString()}</span>
                  )}
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₵{orderTotal.toLocaleString()}</span>
                </div>

                <div className="security-info">
                  <div className="security-item">
                    <span className="icon">🔒</span>
                    <span>Escrow Protection</span>
                  </div>
                  <div className="security-item">
                    <span className="icon">✓</span>
                    <span>Verified Sellers</span>
                  </div>
                  <div className="security-item">
                    <span className="icon">🛡️</span>
                    <span>Buyer Protection</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Review Order */}
        {currentStep === 2 && (
          <div className="checkout-content">
            <div className="checkout-main">
              <div className="section-card">
                <div className="section-header">
                  <h2>📋 Review Your Order</h2>
                </div>

                {/* Shipping Address Review */}
                <div className="review-section">
                  <div className="review-header">
                    <h3>📍 Shipping Address</h3>
                    <button className="btn-edit" onClick={() => setCurrentStep(1)}>
                      Edit
                    </button>
                  </div>
                  <div className="review-content">
                    <p><strong>{formData.buyer_name}</strong></p>
                    <p>{fullAddress}</p>
                    <p>Phone: {formData.buyer_phone}</p>
                    <p>Email: {formData.buyer_email}</p>
                    {formData.additional_notes && (
                      <p className="delivery-note">Note: {formData.additional_notes}</p>
                    )}
                  </div>
                </div>

                {/* Items by Seller */}
                <div className="review-section">
                  <h3>📦 Order Items</h3>
                  {cart.seller_groups.map(group => (
                    <div key={group.seller_id} className="seller-order-group">
                      <div className="seller-group-header">
                        <Link to={`/seller/${group.seller_slug}`} className="seller-name">
                          🏪 {group.seller_name}
                        </Link>
                        <span className="delivery-info">📦 Separate Delivery</span>
                      </div>
                      <div className="order-items">
                        {group.items.map(item => (
                          <div key={item.id} className="order-item">
                            <div className="item-image">
                              {item.image_url ? (
                                <img src={item.image_url} alt={item.name} />
                              ) : (
                                <div className="placeholder-image">📷</div>
                              )}
                            </div>
                            <div className="item-details">
                              <h4>{item.name}</h4>
                              <p className="item-quantity">Quantity: {item.quantity}</p>
                              {item.deal_price && (
                                <div className="item-pricing">
                                  <span className="original-price">₵{item.unit_price}</span>
                                  <span className="deal-price">₵{item.deal_price}</span>
                                  <span className="discount-badge">🔥 {item.discount_percentage}% OFF</span>
                                </div>
                              )}
                            </div>
                            <div className="item-total">
                              ₵{parseFloat(item.subtotal).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="seller-group-total">
                        <span>Seller Subtotal:</span>
                        <span>₵{group.subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Payment Information */}
                <div className="review-section">
                  <h3>💳 Payment & Protection</h3>
                  <div className="payment-info">
                    <div className="payment-method">
                      <div className="payment-icon">🔐</div>
                      <div className="payment-details">
                        <h4>Escrow Payment Protection</h4>
                        <p>
                          Your payment of <strong>₵{cart.cart_total.toLocaleString()}</strong> will be securely held in escrow. 
                          Funds will only be released to sellers after you confirm delivery receipt through 
                          our secure confirmation system.
                        </p>
                        <ul className="protection-list">
                          <li>✓ Payment held securely until delivery confirmed</li>
                          <li>✓ Full refund if items not received</li>
                          <li>✓ Dispute resolution available</li>
                          <li>✓ Digital signature confirmation required</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button className="btn-secondary" onClick={() => setCurrentStep(1)}>
                    ← Back to Shipping
                  </button>
                  <button 
                    className="btn-primary btn-place-order"
                    onClick={handlePlaceOrder}
                    disabled={submitting}
                  >
                    {submitting ? '⏳ Processing...' : '🔒 Place Order - Secure Payment'}
                  </button>
                </div>

                <p className="terms-note">
                  By placing your order, you agree to KudiMall's{' '}
                  <Link to="/terms-of-service">Terms of Service</Link> and{' '}
                  <Link to="/privacy-policy">Privacy Policy</Link>
                </p>
              </div>
            </div>

            <div className="checkout-sidebar">
              <div className="section-card">
                <h3>Order Summary</h3>
                <div className="summary-row">
                  <span>Subtotal ({cart.item_count} items):</span>
                  <span>₵{cart.cart_total.toLocaleString()}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery{formData.city && ` (${formData.city})`}:</span>
                  {deliveryFee === 0 ? (
                    <span className="free-delivery">FREE</span>
                  ) : (
                    <span>₵{deliveryFee.toLocaleString()}</span>
                  )}
                </div>
                <div className="summary-divider"></div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>₵{orderTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Payment */}
        {currentStep === 3 && paymentData && (
          <div className="checkout-content">
            <div className="payment-section">
              <div className="payment-icon-large">💳</div>
              <h1>Complete Your Payment</h1>
              <p className="payment-message">
                Your orders have been created. Please complete your payment of <strong>₵{(paymentData.amount / 100).toLocaleString()}</strong> to confirm your purchase.
              </p>

              <div className="order-numbers">
                <h3>📋 Order Numbers Created:</h3>
                <div className="orders-list">
                  {completedOrders.map((order, index) => (
                    <div key={index} className="order-confirmation-card">
                      <div className="order-header">
                        <span className="order-number">{order.order_number}</span>
                        <span className="order-amount">₵{order.total.toLocaleString()}</span>
                      </div>
                      <div className="order-details">
                        <p><strong>Seller:</strong> {order.seller_name}</p>
                        <p><strong>Product:</strong> {order.product_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="payment-info-box">
                <h3>🔐 Secure Payment with Paystack</h3>
                <p>You'll be redirected to Paystack's secure payment page where you can pay with:</p>
                <ul className="payment-methods">
                  <li>💳 Credit/Debit Card</li>
                  <li>📱 Mobile Money (MTN, Vodafone, AirtelTigo)</li>
                  <li>🏦 Bank Transfer</li>
                </ul>
              </div>

              <div className="payment-actions">
                <PaystackButton
                  {...paymentData}
                  text="Proceed to Payment"
                  onSuccess={handlePaymentSuccess}
                  onClose={handlePaymentClose}
                  className="btn-primary btn-pay-now"
                />
                <p className="payment-note">
                  Your orders are secured. Complete payment to confirm your purchase.
                </p>
              </div>

              <div className="escrow-info">
                <h4>🛡️ Escrow Protection</h4>
                <p>
                  Your payment will be held securely in escrow and only released to sellers 
                  after you confirm delivery receipt.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="checkout-content">
            <div className="confirmation-section">
              <div className="confirmation-icon">✅</div>
              <h1>Order Placed Successfully!</h1>
              <p className="confirmation-message">
                Thank you for your purchase! Your order has been received and is being processed.
              </p>

              <div className="order-numbers">
                <h3>📋 Your Order Numbers:</h3>
                <div className="orders-list">
                  {completedOrders.map((order, index) => (
                    <div key={index} className="order-confirmation-card">
                      <div className="order-header">
                        <span className="order-number">{order.order_number}</span>
                        <span className="order-amount">₵{order.total.toLocaleString()}</span>
                      </div>
                      <div className="order-details">
                        <p><strong>Seller:</strong> {order.seller_name}</p>
                        <p><strong>Product:</strong> {order.product_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="next-steps">
                <h3>📬 What Happens Next?</h3>
                <ol className="steps-list">
                  <li>
                    <strong>Order Confirmation</strong>
                    <p>Check your email ({formData.buyer_email}) for order confirmation details</p>
                  </li>
                  <li>
                    <strong>Seller Processing</strong>
                    <p>Each seller will prepare your items for shipment</p>
                  </li>
                  <li>
                    <strong>Shipment Tracking</strong>
                    <p>You'll receive tracking information when items ship</p>
                  </li>
                  <li>
                    <strong>Delivery Confirmation</strong>
                    <p>Confirm receipt through our secure system to release payment</p>
                  </li>
                </ol>
              </div>

              <div className="escrow-reminder">
                <div className="reminder-icon">🔒</div>
                <div className="reminder-content">
                  <h4>Your Payment is Protected</h4>
                  <p>
                    ₵{cart.cart_total.toLocaleString()} is securely held in escrow. 
                    Sellers will receive payment only after you confirm delivery receipt.
                  </p>
                </div>
              </div>

              <div className="confirmation-actions">
                <Link to="/buyer/dashboard" className="btn-primary">
                  View Order Details
                </Link>
                <Link to="/" className="btn-secondary">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartCheckoutPage;
