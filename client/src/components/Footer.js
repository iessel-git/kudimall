import React from 'react';
import { Link } from 'react-router-dom';
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
              <li><Link to="/#categories">Browse Categories</Link></li>
              <li><Link to="/#featured-sellers">Featured Sellers</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/buyer-protection">Buyer Protection</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>For Sellers</h4>
            <ul>
              <li><Link to="/seller/login">Seller Login</Link></li>
              <li><Link to="/start-selling">Start Selling</Link></li>
              <li><Link to="/seller-application">Apply Now</Link></li>
              <li><Link to="/seller-dashboard">Seller Dashboard</Link></li>
              <li>Success Stories</li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><Link to="/help-center">Help Center</Link></li>
              <li><Link to="/contact-us">Contact Us</Link></li>
              <li><Link to="/terms-of-service">Terms of Service</Link></li>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2026 KudiMall. All rights reserved.</p>
          <p className="footer-tagline">
            KudiMall is both a destination marketplace and a social-commerce checkout platform.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
