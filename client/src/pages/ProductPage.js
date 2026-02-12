import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProduct, getProductReviews, addToCart, addToWishlist, removeFromWishlist, checkWishlist } from '../services/api';
import '../styles/ProductPage.css';

const ProductPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const checkWishlistStatus = useCallback(async (productId) => {
    const token = localStorage.getItem('buyer_token');
    if (token && productId) {
      try {
        const response = await checkWishlist(productId);
        setIsInWishlist(response.data.inWishlist);
      } catch (error) {
        console.error('Error checking wishlist:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, reviewsRes] = await Promise.all([
          getProduct(slug),
          getProductReviews(slug)
        ]);
        
        setProduct(productRes.data);
        setReviews(reviewsRes.data);
        checkWishlistStatus(productRes.data.id);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, checkWishlistStatus]);

  const handleBuyNow = () => {
    navigate(`/checkout/${slug}`);
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('buyer_token');
    if (!token) {
      navigate('/buyer/login', { state: { from: { pathname: `/product/${slug}` } } });
      return;
    }

    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity);
      alert('Added to cart!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    const token = localStorage.getItem('buyer_token');
    if (!token) {
      navigate('/buyer/login', { state: { from: { pathname: `/product/${slug}` } } });
      return;
    }

    setWishlistLoading(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist(product.id);
        setIsInWishlist(false);
      } else {
        await addToWishlist(product.id);
        setIsInWishlist(true);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!product) {
    return <div className="error">Product not found</div>;
  }

  // Calculate average rating
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="product-page">
      <div className="container">
        <div className="product-layout">
          {/* Product Image */}
          <div className="product-image-section">
            <div className="product-image-large">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="product-main-image" />
              ) : (
                <div className="placeholder-image-large">📷</div>
              )}
            </div>
            <button 
              className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}
              onClick={handleWishlistToggle}
              disabled={wishlistLoading}
            >
              {isInWishlist ? '❤️' : '🤍'} {isInWishlist ? 'Saved' : 'Save'}
            </button>
          </div>

          {/* Product Details */}
          <div className="product-details-section">
            <h1 className="product-title">{product.name}</h1>
            
            {reviews.length > 0 && (
              <div className="product-rating-summary">
                <span className="rating-stars">{'⭐'.repeat(Math.round(avgRating))}</span>
                <span className="rating-value">{avgRating}</span>
                <span className="rating-count">({reviews.length} reviews)</span>
              </div>
            )}
            
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
                <span className={`info-value ${product.stock <= 5 ? 'low-stock' : ''}`}>
                  {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                  {product.stock <= 5 && product.stock > 0 && ' - Low stock!'}
                </span>
              </div>
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className="quantity-section">
                <label>Quantity:</label>
                <div className="quantity-selector">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    −
                  </button>
                  <span>{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="product-actions">
              <button
                className="btn-add-to-cart"
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addingToCart}
              >
                {addingToCart ? 'Adding...' : '🛒 Add to Cart'}
              </button>
              <button
                className="btn-buy-now"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                {product.stock > 0 ? 'Buy Now' : 'Out of Stock'}
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
          <h2>Customer Reviews {reviews.length > 0 && `(${reviews.length})`}</h2>
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
