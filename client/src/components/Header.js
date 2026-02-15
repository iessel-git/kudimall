import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { getCartCount } from '../services/api';
import '../styles/Header.css';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [buyer, setBuyer] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchCartCount = useCallback(async () => {
    const token = localStorage.getItem('buyer_token');
    if (token) {
      try {
        const response = await getCartCount();
        setCartCount(response.data.count || 0);
      } catch (error) {
        console.error('Error fetching cart count:', error);
      }
    }
  }, []);

  useEffect(() => {
    const buyerInfo = localStorage.getItem('buyer_info');
    if (buyerInfo) {
      try {
        setBuyer(JSON.parse(buyerInfo));
        fetchCartCount();
      } catch (error) {
        console.error('Error parsing buyer info:', error);
      }
    }
  }, [fetchCartCount]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      fetchCartCount();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, [fetchCartCount]);

  // Refresh cart count on location change
  useEffect(() => {
    if (buyer) {
      fetchCartCount();
    }
  }, [location.pathname, buyer, fetchCartCount]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <header className="header">
        <div className="header-top">
          <div className="container">
            <p className="trust-message">
              🔒 Whether you find us through social media or come directly to KudiMall, 
              you'll always buy with confidence.
            </p>
          </div>
        </div>
        
        <div className="header-main">
          <div className="container">
            <div className="header-content">
              <Link to="/" className="logo">
                <div className="logo-stack">
                  <img src="/kudimallv2.png" alt="KudiMall logo" className="logo-mark" />
                </div>
                <span className="logo-text" aria-hidden="true">
                  <span className="logo-text-kudi">Kudi</span>
                  <span className="logo-text-mall">Mall</span>
                </span>
                <h1 className="visually-hidden">KudiMall</h1>
              </Link>
              
              <form className="search-form" onSubmit={handleSearch}>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-button">
                  Search
                </button>
              </form>
              
              <nav className="header-nav">
                <Link to="/" className="nav-link">Home</Link>
                <Link to="/deals" className="nav-link deals-link">🔥 Deals</Link>
                {buyer && (
                  <Link to="/wishlist" className="nav-link wishlist-link">❤️</Link>
                )}
                <Link to="/cart" className="nav-link cart-link">
                  🛒
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
                {buyer ? (
                  <Link to="/buyer/dashboard" className="nav-link buyer-account">
                    👤 {buyer.name}
                  </Link>
                ) : (
                  <Link to="/buyer/login" className="nav-link my-orders-link">My Orders</Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <Link to="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}>
          <span className="mobile-nav-icon">🏠</span>
          <span className="mobile-nav-label">Home</span>
        </Link>
        
        <Link to="/deals" className={`mobile-nav-item ${isActive('/deals') ? 'active' : ''}`}>
          <span className="mobile-nav-icon">🔥</span>
          <span className="mobile-nav-label">Deals</span>
        </Link>
        
        <Link to="/cart" className={`mobile-nav-item cart-mobile ${isActive('/cart') ? 'active' : ''}`}>
          <span className="mobile-nav-icon">
            🛒
            {cartCount > 0 && <span className="mobile-cart-badge">{cartCount}</span>}
          </span>
          <span className="mobile-nav-label">Cart</span>
        </Link>
        
        {buyer ? (
          <Link to="/wishlist" className={`mobile-nav-item ${isActive('/wishlist') ? 'active' : ''}`}>
            <span className="mobile-nav-icon">❤️</span>
            <span className="mobile-nav-label">Wishlist</span>
          </Link>
        ) : (
          <Link to="/buyer/login" className={`mobile-nav-item ${isActive('/buyer/login') ? 'active' : ''}`}>
            <span className="mobile-nav-icon">📦</span>
            <span className="mobile-nav-label">Orders</span>
          </Link>
        )}
        
        {buyer ? (
          <Link to="/buyer/dashboard" className={`mobile-nav-item ${location.pathname === '/buyer/dashboard' ? 'active' : ''}`}>
            <span className="mobile-nav-icon">👤</span>
            <span className="mobile-nav-label">Account</span>
          </Link>
        ) : (
          <Link to="/buyer/login" className={`mobile-nav-item ${isActive('/buyer/login') ? 'active' : ''}`}>
            <span className="mobile-nav-icon">👤</span>
            <span className="mobile-nav-label">Account</span>
          </Link>
        )}
      </nav>
    </>
  );
};

export default Header;
