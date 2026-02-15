import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sellerForgotPassword } from '../services/api';
import '../styles/AuthPage.css';

const SellerForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await sellerForgotPassword({ email });
      setMessage(response.data.message);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container" style={{ maxWidth: '600px', gridTemplateColumns: '1fr' }}>
          <div className="auth-box">
            <h1>Forgot Password?</h1>
            <p className="auth-subtitle">Enter your seller account email and we'll send you a reset link</p>

            {error && <div className="error-banner">{error}</div>}
            {message && (
              <div className="success-banner" style={{
                background: 'rgba(76, 175, 80, 0.15)',
                border: '2px solid rgba(76, 175, 80, 0.5)',
                color: '#81c784',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="Enter your seller email"
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="auth-links">
              <p>
                Remember your password?{' '}
                <Link to="/seller/login">Log in</Link>
              </p>
              <p>
                Don't have a seller account?{' '}
                <Link to="/seller/signup">Sign up</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerForgotPasswordPage;
