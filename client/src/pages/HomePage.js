import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories, getSellers, getProducts } from '../services/api';
import '../styles/HomePage.css';

const HomePage = () => {
  const [categories, setCategories] = useState([]);
  const [featuredSellers, setFeaturedSellers] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, sellersRes, productsRes] = await Promise.all([
          getCategories(),
          getSellers({ featured: true, limit: 6 }),
          getProducts({ featured: true, limit: 8 })
        ]);
        
        setCategories(categoriesRes.data);
        setFeaturedSellers(sellersRes.data);
        setFeaturedProducts(productsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Shop Directly or From Social Media Links
            </h1>
            <p className="hero-subtitle">
              Shop directly on KudiMall or buy from links shared on social media.
              {/* <br /> */}
              {/*Either way, every purchase is protected.*/}
                          <br />

            </p>
            <div className="hero-features">
              <div className="feature">
                <span className="feature-icon">🔒</span>
                <span>Secure Escrow</span>
              </div>
              <div className="feature">
                <span className="feature-icon">✅</span>
                <span>Verified Sellers</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🛡️</span>
                <span>Buyer Protection</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section" id="categories">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          <div className="categories-grid">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="category-card"
              >
                <div className="category-icon">📦</div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Sellers Section */}
      <section className="featured-sellers" id="featured-sellers">
        <div className="container">
          <h2 className="section-title">Featured Sellers</h2>
          <div className="sellers-grid">
            {featuredSellers.map((seller) => (
              <Link
                key={seller.id}
                to={`/seller/${seller.slug}`}
                className="seller-card"
              >
                <div className="seller-header">
                  <div className="seller-logo">🏪</div>
                  {seller.is_verified && (
                    <span className="verified-badge">✓ Verified</span>
                  )}
                </div>
                <h3>{seller.name}</h3>
                <p className="seller-location">📍 {seller.location}</p>
                <div className="seller-stats">
                  <span className="trust-level">
                    Trust Level: {seller.trust_level}/5
                  </span>
                </div>
                <p className="seller-description">{seller.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="featured-products">
        <div className="container">
          <h2 className="section-title">Featured Products</h2>
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="product-card"
              >
                <div className="product-image">
                  <div className="placeholder-image">📷</div>
                  {product.is_featured && (
                    <span className="featured-badge">⭐ Featured</span>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-seller">
                    by {product.seller_name}
                    {product.is_verified && ' ✓'}
                  </p>
                  <p className="product-price">
                    ₵{product.price.toLocaleString()}
                  </p>
                  <div className="product-badges">
                    <span className="escrow-badge">🔒 Escrow Protected</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Seller CTA Section */}
      <section className="seller-cta-section">
        <div className="container">
          <div className="seller-cta-content">
            <h2>Ready to Start Selling?</h2>
            <p>Join thousands of successful sellers on KudiMall. Reach buyers through our marketplace and social media.</p>
            <div className="seller-cta-features">
              <span>🛡️ Seller Protection</span>
              <span>📱 Social Commerce Tools</span>
              <span>💰 Competitive Commission Rates</span>
            </div>
            <Link to="/seller-application" className="cta-button">Apply to Become a Seller</Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="trust-section">
        <div className="container">
          <h2>Why Shop on KudiMall?</h2>
          <div className="trust-features">
            <div className="trust-feature">
              <span className="trust-icon">🏬</span>
              <h3>Destination Marketplace</h3>
              <p>Browse stores, discover products, and shop with confidence</p>
            </div>
            <div className="trust-feature">
              <span className="trust-icon">📱</span>
              <h3>Social Commerce Ready</h3>
              <p>Click any link from TikTok, Instagram, or WhatsApp - we've got you covered</p>
            </div>
            <div className="trust-feature">
              <span className="trust-icon">🔐</span>
              <h3>Escrow Protection</h3>
              <p>Your money is held securely until you confirm delivery</p>
            </div>
            <div className="trust-feature">
              <span className="trust-icon">✅</span>
              <h3>Verified Sellers</h3>
              <p>Shop from trusted sellers with proven track records</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
