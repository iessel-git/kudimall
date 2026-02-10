import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProduct, getProductReviews } from '../services/api';
import '../styles/ProductPage.css';

const ProductPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          getProduct(slug),
          getProductReviews(slug)
        ]);
        
        setProduct(productRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleBuyNow = () => {
    navigate(`/checkout/${slug}`);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!product) {
    return <div className="error">Product not found</div>;
  }

  return (
    <div className="product-page">
      <div className="container">
        <div className="product-layout">
          {/* Product Image */}
          <div className="product-image-section">
            <div className="product-image-large">
              <div className="placeholder-image-large">📷</div>
            </div>
          </div>

          {/* Product Details */}
          <div className="product-details-section">
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-seller-info">
              <Link to={`/seller/${product.seller_slug}`} className="seller-link">
                <span className="seller-icon">🏪</span>
                <span className="seller-name">{product.seller_name}</span>
                {product.is_verified && (
                  <span className="verified-icon">✅</span>
                )}
              </Link>
              <span className="trust-level">
                Trust Level: {product.trust_level}/5 ⭐
              </span>
            </div>

            <div className="product-price-section">
              <p className="product-price">₵{product.price.toLocaleString()}</p>
              <div className="trust-badges">
                <span className="badge escrow">🔒 Escrow Protected</span>
                <span className="badge verified">✓ Verified Seller</span>
              </div>
            </div>

            <div className="product-description">
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>

            <div className="product-info-grid">
              <div className="info-item">
                <span className="info-label">Category:</span>
                <Link to={`/category/${product.category_slug}`} className="info-value">
                  {product.category_name}
                </Link>
              </div>
              <div className="info-item">
                <span className="info-label">Location:</span>
                <span className="info-value">{product.seller_location}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Stock:</span>
                <span className="info-value">
                  {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                </span>
              </div>
            </div>

            <div className="product-actions">
              <button
                className="btn-buy-now"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                {product.stock > 0 ? 'Buy Now - Secure Checkout' : 'Out of Stock'}
              </button>
            </div>

            <div className="trust-message">
              <p>
                🔒 <strong>Your purchase is protected:</strong> Money is held 
                in escrow until you confirm delivery. Shop with confidence!
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <section className="product-reviews">
          <h2>Customer Reviews</h2>
          {reviews.length === 0 ? (
            <p>No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <span className="reviewer-name">{review.buyer_name}</span>
                    <span className="review-rating">
                      {'⭐'.repeat(review.rating)}
                    </span>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  <p className="review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductPage;
