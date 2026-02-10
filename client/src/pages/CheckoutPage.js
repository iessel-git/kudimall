import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProduct, createOrder, getBuyerProfile } from '../services/api';
import '../styles/CheckoutPage.css';

const CheckoutPage = () => {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [buyer, setBuyer] = useState(null);
  const [showAccountPrompt, setShowAccountPrompt] = useState(true);
  
  const [formData, setFormData] = useState({
    buyer_name: '',
    buyer_email: '',
    buyer_phone: '',
    delivery_address: '',
    quantity: 1
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await getProduct(productSlug);
        setProduct(response.data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    const checkBuyerAuth = async () => {
      const token = localStorage.getItem('buyer_token');
      if (token) {
        try {
          const response = await getBuyerProfile();
          setBuyer(response.data.buyer);
          // Auto-fill form with buyer's saved info
          setFormData(prev => ({
            ...prev,
            buyer_name: response.data.buyer.name,
            buyer_email: response.data.buyer.email,
            buyer_phone: response.data.buyer.phone || '',
            delivery_address: response.data.buyer.default_address || ''
          }));
          setShowAccountPrompt(false);
        } catch (error) {
          console.error('Error fetching buyer profile:', error);
        }
      }
    };

    fetchProduct();
    checkBuyerAuth();
  }, [productSlug]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const orderData = {
        ...formData,
        seller_id: product.seller_id,
        product_id: product.id,
        quantity: parseInt(formData.quantity)
      };

      const response = await createOrder(orderData);
      
      // If buyer is not logged in, offer to create account
      if (!buyer) {
        const createAccount = window.confirm(
          `Order placed successfully! Order Number: ${response.data.order_number}\n\n` +
          'Would you like to create an account to track this order?'
        );
        if (createAccount) {
          navigate('/buyer/signup', { 
            state: { from: { pathname: '/buyer/dashboard' } }
          });
        } else {
          navigate('/');
        }
      } else {
        alert(`Order placed successfully! Order Number: ${response.data.order_number}`);
        navigate('/buyer/dashboard');
      }
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!product) {
    return <div className="error">Product not found</div>;
  }

  const totalAmount = product.price * formData.quantity;

  return (
    <div className="checkout-page">
      <div className="container">
        <h1 className="page-title">Secure Checkout</h1>
        
        {showAccountPrompt && (
          <div className="account-prompt">
            <div className="prompt-content">
              <p>
                💡 <strong>Have an account?</strong>{' '}
                <Link to="/buyer/login" state={{ from: { pathname: `/checkout/${productSlug}` } }}>
                  Log in
                </Link>{' '}
                for faster checkout or{' '}
                <Link to="/buyer/signup" state={{ from: { pathname: `/checkout/${productSlug}` } }}>
                  Sign up
                </Link>{' '}
                to track your order
              </p>
              <button 
                className="btn-guest-checkout"
                onClick={() => setShowAccountPrompt(false)}
              >
                Continue as Guest
              </button>
            </div>
            <button className="btn-close" onClick={() => setShowAccountPrompt(false)}>×</button>
          </div>
        )}

        {buyer && (
          <div className="buyer-info-banner">
            <p>
              ✓ Logged in as <strong>{buyer.name}</strong> ({buyer.email})
            </p>
          </div>
        )}
        
        <div className="checkout-layout">
          {/* Order Summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-product">
              <div className="product-thumbnail">📷</div>
              <div className="product-details">
                <h3>{product.name}</h3>
                <p className="seller-name">
                  Sold by {product.seller_name}
                  {product.is_verified && ' ✓'}
                </p>
                <p className="product-price">₵{product.price.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="summary-breakdown">
              <div className="summary-row">
                <span>Price per item:</span>
                <span>₵{product.price.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Quantity:</span>
                <span>{formData.quantity}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>₵{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="escrow-notice">
              <h4>🔒 Escrow Protection</h4>
              <p>
                Your payment will be held securely until you confirm delivery.
                After receiving your order, you'll be asked to confirm receipt through
                our online receipt confirmation system. This protects both you and the seller.
              </p>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="checkout-form-section">
            <h2>Buyer Information</h2>
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-group">
                <label htmlFor="buyer_name">Full Name *</label>
                <input
                  type="text"
                  id="buyer_name"
                  name="buyer_name"
                  value={formData.buyer_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="buyer_email">Email Address *</label>
                <input
                  type="email"
                  id="buyer_email"
                  name="buyer_email"
                  value={formData.buyer_email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="buyer_phone">Phone Number *</label>
                <input
                  type="tel"
                  id="buyer_phone"
                  name="buyer_phone"
                  value={formData.buyer_phone}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="quantity">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  max={product.stock}
                  value={formData.quantity}
                  onChange={handleInputChange}
                  required
                />
                <small>Available: {product.stock}</small>
              </div>

              <div className="form-group">
                <label htmlFor="delivery_address">Delivery Address *</label>
                <textarea
                  id="delivery_address"
                  name="delivery_address"
                  rows="4"
                  value={formData.delivery_address}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Place Order - Secure Payment'}
              </button>

              <p className="form-note">
                By placing this order, you agree to our terms of service and 
                escrow protection policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
