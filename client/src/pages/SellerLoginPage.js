import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL, sellerLogin } from '../services/api';
import '../styles/AuthPage.css';

const SellerLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);

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
    setNeedsVerification(false);

    try {
      const response = await sellerLogin(formData);
      const { token, seller } = response.data;

      // Store token and seller info
      localStorage.setItem('seller_token', token);
      localStorage.setItem('seller_info', JSON.stringify(seller));

      // Navigate to seller dashboard
      navigate('/seller/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      
      // Check if email verification is required
      if (err.response?.data?.requiresEmailVerification) {
        setNeedsVerification(true);
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      alert('Please enter your email address first');
      return;
    }

    setResendingEmail(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/seller/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });
      
      const data = await response.json();
      alert(data.message);
      
      if (response.ok) {
        setNeedsVerification(false);
        setError('');
      }
    } catch (err) {
      alert('Failed to resend verification code. Please try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-header">
            <h1>Seller Login</h1>
            <p>Welcome back! Login to manage your store</p>
          </div>

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
              {needsVerification && (
                <div style={{ marginTop: '15px' }}>
                  <button 
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingEmail}
                    style={{
                      background: '#c8a45a',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    {resendingEmail ? 'Sending...' : '📧 Resend Verification Code'}
                  </button>
                  <div style={{ marginTop: '10px' }}>
                    <Link to="/seller/verify-code" state={{ email: formData.email }}>
                      Enter Verification Code
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
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
                placeholder="Enter your password"
                minLength="6"
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              <Link to="/seller/forgot-password" style={{ fontSize: '0.9rem' }}>
                Forgot your password?
              </Link>
            </p>
            <p>
              Don't have a seller account? 
              <Link to="/seller/signup"> Sign up here</Link>
            </p>
            <p>
              Need to apply first? 
              <Link to="/seller-application"> Submit Application</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerLoginPage;
