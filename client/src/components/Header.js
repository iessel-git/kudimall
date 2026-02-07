import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
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
              <h1>KudiMall</h1>
              <span className="tagline">Shop with Confidence</span>
            </Link>
            
            <form className="search-form" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search products, sellers, or categories..."
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
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
