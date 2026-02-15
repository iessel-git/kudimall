import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { sellerResendVerification, sellerVerifyCode } from '../services/api';
import '../styles/AuthPage.css';

const REDIRECT_DELAY_MS = 3000;

const SellerVerifyCodePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle'); // idle, verifying, success, error
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setStatus('verifying');
    setMessage('');

    try {
      const response = await sellerVerifyCode({ email, code });
      setStatus('success');
      setMessage(response.data?.message || 'Email verified successfully.');
      setTimeout(() => navigate('/seller/login'), REDIRECT_DELAY_MS);
    } catch (error) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Verification failed. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!email) {
      setResendMessage('Please enter your email address first.');
      return;
    }

    setResending(true);
    setResendMessage('');
    try {
      const response = await sellerResendVerification({ email });
      setResendMessage(response.data?.message || 'Verification code sent.');
    } catch (error) {
      setResendMessage(error.response?.data?.message || 'Failed to resend code. Please try again later.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>🔐 Verify Seller Email</h1>
            <p>Enter the 6-digit code sent to your email</p>
          </div>

          <div className="auth-content">
            {status === 'success' && (
              <div className="verification-status success">
                <div className="success-icon">✓</div>
                <h3>Email Verified!</h3>
                <p>{message}</p>
                <p className="redirect-message">Redirecting to login...</p>
                <Link to="/seller/login" className="btn-primary">Go to Login</Link>
              </div>
            )}

            {status !== 'success' && (
              <form onSubmit={handleVerify} className="auth-form">
                {status === 'error' && (
                  <div className="error-message">
                    <strong>✗ {message}</strong>
                  </div>
                )}

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Verification Code</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                    inputMode="numeric"
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={status === 'verifying'}>
                  {status === 'verifying' ? 'Verifying...' : 'Verify Email'}
                </button>

                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={handleResend}
                    disabled={resending}
                  >
                    {resending ? 'Sending...' : 'Resend Verification Code'}
                  </button>
                </div>

                {resendMessage && (
                  <div style={{ marginTop: '10px', textAlign: 'center' }}>
                    <small>{resendMessage}</small>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerVerifyCodePage;
