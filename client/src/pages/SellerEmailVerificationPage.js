import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../services/api';
import '../styles/AuthPage.css';

const SellerEmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error, expired
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Please check your email and try again.');
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/auth/seller/verify-email?token=${token}`
        );
        
        setStatus('success');
        setMessage(response.data.message);
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/seller/login');
        }, 3000);
      } catch (error) {
        if (error.response?.data?.expired) {
          setStatus('expired');
          setMessage(error.response.data.message);
        } else {
          setStatus('error');
          setMessage(error.response?.data?.message || 'Verification failed. Please try again.');
        }
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const handleResendVerification = async (e) => {
    e.preventDefault();
    setResending(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/seller/resend-verification`,
        { email: resendEmail }
      );
      
      alert(response.data.message);
      setResendEmail('');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>📧 Email Verification</h1>
            <p>KudiMall Seller Account</p>
          </div>

          <div className="auth-content">
            {status === 'verifying' && (
              <div className="verification-status verifying">
                <div className="spinner"></div>
                <h3>Verifying your email...</h3>
                <p>Please wait while we confirm your email address.</p>
              </div>
            )}

            {status === 'success' && (
              <div className="verification-status success">
                <div className="success-icon">✓</div>
                <h3>Email Verified Successfully!</h3>
                <p>{message}</p>
                <p className="redirect-message">
                  Redirecting to login page in 3 seconds...
                </p>
                <Link to="/seller/login" className="btn-primary">
                  Go to Login Now
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="verification-status error">
                <div className="error-icon">✗</div>
                <h3>Verification Failed</h3>
                <p>{message}</p>
                <div className="action-buttons">
                  <Link to="/seller/signup" className="btn-secondary">
                    Create New Account
                  </Link>
                  <button 
                    onClick={() => setStatus('expired')} 
                    className="btn-link"
                  >
                    Resend Verification Email
                  </button>
                </div>
              </div>
            )}

            {status === 'expired' && (
              <div className="verification-status expired">
                <div className="warning-icon">⚠</div>
                <h3>Verification Link Expired</h3>
                <p>{message || 'Your verification link has expired. Please request a new one.'}</p>
                
                <form onSubmit={handleResendVerification} className="resend-form">
                  <div className="form-group">
                    <label>Enter your email address</label>
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      placeholder="your-email@example.com"
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={resending}
                  >
                    {resending ? 'Sending...' : 'Send New Verification Email'}
                  </button>
                </form>

                <div className="help-text">
                  <p>
                    <Link to="/seller/login">← Back to Login</Link>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerEmailVerificationPage;
