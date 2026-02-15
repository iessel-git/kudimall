import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { buyerLogin, buyerResendVerification } from '../services/api';
import '../styles/AuthPage.css';

const BuyerLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);

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
    setNeedsVerification(false);

    try {
      const response = await buyerLogin(formData);
      localStorage.setItem('buyer_token', response.data.token);
      localStorage.setItem('buyer_info', JSON.stringify(response.data.buyer));
      navigate(from, { replace: true });
    } catch (err) {
      if (err.response?.data?.requiresEmailVerification) {
        setNeedsVerification(true);
        setError(err.response?.data?.message || 'Please verify your email to continue.');
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setError('Please enter your email address first.');
      return;
    }

    setResending(true);
    try {
      const response = await buyerResendVerification({ email: formData.email });
      setError(response.data?.message || 'Verification code sent.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-box">
            <h1>Welcome Back</h1>
            <p className="auth-subtitle">Log in to track your orders</p>

            {error && (
              <div className="error-banner">
                {error}
                {needsVerification && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resending}
                      style={{
                        background: '#c8a45a',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      {resending ? 'Sending...' : '📧 Resend Verification Code'}
                    </button>
                    <div style={{ marginTop: '8px' }}>
                      <Link to="/buyer/verify-code" state={{ email: formData.email }}>
                        Enter Verification Code
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
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
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
              </div>

              <div className="auth-links" style={{ marginTop: '10px', marginBottom: '20px', textAlign: 'right' }}>
                <Link to="/buyer/forgot-password" style={{ fontSize: '0.9rem' }}>
                  Forgot password?
                </Link>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>

            <div className="auth-links">
              <p>
                Don't have an account?{' '}
                <Link to="/buyer/signup" state={{ from: location.state?.from }}>
                  Sign up
                </Link>
              </p>
              <p>
                <Link to="/">Continue as guest</Link>
              </p>
            </div>
          </div>

          <div className="auth-benefits">
            <h2>Why create an account?</h2>
            <ul>
              <li>📦 Track all your orders in one place</li>
              <li>🔒 Manage escrow payments securely</li>
              <li>📍 Save delivery addresses for faster checkout</li>
              <li>💬 Communicate directly with sellers</li>
              <li>⭐ Leave reviews and ratings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerLoginPage;
