import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [buyer, setBuyer] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const buyerInfo = localStorage.getItem('buyer_info');
    if (buyerInfo) {
      try {
        setBuyer(JSON.parse(buyerInfo));
      } catch (error) {
        console.error('Error parsing buyer info:', error);
      }
    }
  }, []);

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
                <Link to="/search?type=sellers" className="nav-link">Sellers</Link>
                {buyer ? (
                  <Link to="/buyer/dashboard" className="nav-link buyer-account">
                    👤 {buyer.name}
                  </Link>
                ) : (
                  <Link to="/buyer/login" className="nav-link my-orders-link">My Orders</Link>
                )}
                <Link to="/delivery/login" className="nav-link">Delivery</Link>
                <Link to="/seller/login" className="nav-link seller-login">Sell</Link>
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
        
        <Link to="/search?type=sellers" className={`mobile-nav-item ${location.search.includes('type=sellers') ? 'active' : ''}`}>
          <span className="mobile-nav-icon">🏪</span>
          <span className="mobile-nav-label">Sellers</span>
        </Link>
        
        {buyer ? (
          <Link to="/buyer/dashboard?view=orders" className={`mobile-nav-item ${location.pathname === '/buyer/dashboard' && location.search.includes('view=orders') ? 'active' : ''}`}>
            <span className="mobile-nav-icon">📦</span>
            <span className="mobile-nav-label">Orders</span>
          </Link>
        ) : (
          <Link to="/buyer/login" className={`mobile-nav-item ${isActive('/buyer/login') ? 'active' : ''}`}>
            <span className="mobile-nav-icon">📦</span>
            <span className="mobile-nav-label">Orders</span>
          </Link>
        )}
        
        {buyer ? (
          <Link to="/buyer/dashboard" className={`mobile-nav-item ${location.pathname === '/buyer/dashboard' && !location.search.includes('view=orders') ? 'active' : ''}`}>
            <span className="mobile-nav-icon">👤</span>
            <span className="mobile-nav-label">Account</span>
          </Link>
        ) : (
          <Link to="/buyer/login" className={`mobile-nav-item ${isActive('/buyer/login') ? 'active' : ''}`}>
            <span className="mobile-nav-icon">👤</span>
            <span className="mobile-nav-label">Account</span>
          </Link>
        )}
        
        <Link to="/seller/login" className={`mobile-nav-item ${location.pathname.includes('/seller') ? 'active' : ''}`}>
          <span className="mobile-nav-icon">💼</span>
          <span className="mobile-nav-label">Sell</span>
        </Link>
      </nav>
    </>
  );
};

export default Header;
