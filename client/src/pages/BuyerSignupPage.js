import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { buyerSignup } from '../services/api';
import '../styles/AuthPage.css';

const BuyerSignupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/buyer/dashboard';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await buyerSignup(signupData);
      localStorage.setItem('buyer_token', response.data.token);
      localStorage.setItem('buyer_info', JSON.stringify(response.data.buyer));
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-box">
          <h1>Create Your Account</h1>
          <p className="auth-subtitle">Join KudiMall and start shopping securely</p>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Delivery Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Optional - save for faster checkout"
                autoComplete="street-address"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
                autoComplete="new-password"
              />
              <small>Minimum 6 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-links">
            <p>
              Already have an account?{' '}
              <Link to="/buyer/login" state={{ from: location.state?.from }}>
                Log in
              </Link>
            </p>
            <p>
              <Link to="/">Continue as guest</Link>
            </p>
          </div>
        </div>

        <div className="auth-benefits">
          <h2>Benefits of Creating an Account</h2>
          <ul>
            <li>📦 <strong>Order Tracking</strong> - Track all purchases in one dashboard</li>
            <li>🔒 <strong>Secure Escrow</strong> - Manage payments and releases</li>
            <li>⚡ <strong>Fast Checkout</strong> - Save addresses and payment info</li>
            <li>💬 <strong>Direct Messaging</strong> - Chat with sellers about orders</li>
            <li>⭐ <strong>Reviews</strong> - Share your experience with products</li>
            <li>📧 <strong>Order Updates</strong> - Get notified about shipping status</li>
          </ul>
          
          <p className="auth-note">
            🛡️ Your past orders will be automatically linked to your account!
          </p>
        </div>
      </div>
    </div>
  );
};

export default BuyerSignupPage;
