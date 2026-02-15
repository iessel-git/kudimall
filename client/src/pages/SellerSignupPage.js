import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sellerSignup } from '../services/api';
import '../styles/AuthPage.css';

const SellerSignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    description: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { confirmPassword, ...signupData } = formData;
      const response = await sellerSignup(signupData);

      // Check if email verification is required
      if (response.data.emailVerificationRequired) {
        setSuccess(true);
        setSuccessMessage(response.data.message);
        setEmailSent(response.data.emailSent !== false); // Default to true if not specified
        setUserEmail(signupData.email);
      } else {
        // Old flow (if email verification is disabled)
        const { token, seller } = response.data;
        localStorage.setItem('seller_token', token);
        localStorage.setItem('seller_info', JSON.stringify(seller));
        alert('🎉 Account created successfully! Welcome to KudiMall.');
        navigate('/seller/dashboard');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container">
        <div className="auth-container">
          <div className="auth-header">
            <h1>Create Seller Account</h1>
            <p>Join KudiMall and start selling today</p>
          </div>

          {success && (
            <div className="success-message" style={{
              background: emailSent ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
              border: emailSent ? '2px solid rgba(76, 175, 80, 0.5)' : '2px solid rgba(255, 152, 0, 0.5)',
              color: emailSent ? '#4caf50' : '#f57c00',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>
                {emailSent ? '✉️ Verification Code Sent!' : '⚠️ Account Created - Email Not Sent'}
              </h3>
              <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>{successMessage}</p>
              {emailSent ? (
                <p style={{ fontSize: '0.9rem', color: '#66bb6a' }}>
                  Please check your email (including spam folder) for your 6-digit verification code.
                </p>
              ) : (
                <div>
                  <p style={{ fontSize: '0.9rem', marginBottom: '15px' }}>
                    You can try to resend the verification code from the verification page.
                  </p>
                  <Link 
                    to="/seller/verify-code" 
                    state={{ email: userEmail }}
                    className="btn-primary"
                    style={{ marginRight: '10px' }}
                  >
                    Resend Verification Code
                  </Link>
                </div>
              )}
              <div style={{ marginTop: '20px' }}>
                <Link to="/seller/login" className="btn-secondary">
                  Go to Login
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span>⚠️ {error}</span>
            </div>
          )}

          {!success && (
            <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Store Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your Store Name"
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
                placeholder="your@email.com"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Min. 6 characters"
                  minLength="6"
                />
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
                  placeholder="Confirm password"
                  minLength="6"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Store Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell customers about your store..."
                rows="3"
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          )}

          {!success && (
            <div className="auth-footer">
              <p>
                Already have an account? 
                <Link to="/seller/login"> Login here</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerSignupPage;
