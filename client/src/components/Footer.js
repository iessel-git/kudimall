import React from 'react';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>KudiMall</h3>
            <p className="footer-description">
              Shop directly on KudiMall or buy from links shared on social media. 
              Either way, every purchase is protected.
            </p>
            <div className="trust-badges">
              <span className="badge">🔒 Secure Escrow</span>
              <span className="badge">✅ Verified Sellers</span>
              <span className="badge">🛡️ Buyer Protection</span>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>For Buyers</h4>
            <ul>
              <li>Browse Categories</li>
              <li>Featured Sellers</li>
              <li>How It Works</li>
              <li>Buyer Protection</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>For Sellers</h4>
            <ul>
              <li>Start Selling</li>
              <li>Seller Dashboard</li>
              <li>Pricing</li>
              <li>Success Stories</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li>Help Center</li>
              <li>Contact Us</li>
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 KudiMall. All rights reserved.</p>
          <p className="footer-tagline">
            KudiMall is both a destination marketplace and a social-commerce checkout platform.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
