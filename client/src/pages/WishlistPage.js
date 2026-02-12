import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  getWishlist, 
  removeFromWishlist, 
  moveWishlistToCart 
} from '../services/api';
import '../styles/WishlistPage.css';

const WishlistPage = () => {
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  const fetchWishlist = useCallback(async () => {
    try {
      const response = await getWishlist();
      setWishlist(response.data.wishlist || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      if (error.response?.status === 401) {
        navigate('/buyer/login', { state: { from: { pathname: '/wishlist' } } });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('buyer_token');
    if (!token) {
      navigate('/buyer/login', { state: { from: { pathname: '/wishlist' } } });
      return;
    }
    fetchWishlist();
  }, [navigate, fetchWishlist]);

  const handleRemove = async (productId) => {
    setUpdating(prev => ({ ...prev, [productId]: true }));
    try {
      await removeFromWishlist(productId);
      await fetchWishlist();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to remove item');
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleMoveToCart = async (productId) => {
    setUpdating(prev => ({ ...prev, [productId]: true }));
    try {
      await moveWishlistToCart(productId);
      await fetchWishlist();
      alert('Item moved to cart!');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to move to cart');
    } finally {
      setUpdating(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (loading) {
    return <div className="loading">Loading your wishlist...</div>;
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        <div className="wishlist-header">
          <h1>❤️ My Wishlist</h1>
          <p className="wishlist-count">{wishlist.length} items</p>
        </div>

        {wishlist.length === 0 ? (
          <div className="empty-wishlist">
            <div className="empty-icon">❤️</div>
            <h2>Your wishlist is empty</h2>
            <p>Save items you love by clicking the heart icon on any product.</p>
            <Link to="/" className="btn-shop-now">Explore Products</Link>
          </div>
        ) : (
          <div className="wishlist-grid">
            {wishlist.map(item => (
              <div key={item.product_id} className={`wishlist-card ${updating[item.product_id] ? 'updating' : ''}`}>
                <button 
                  className="btn-remove-wishlist"
                  onClick={() => handleRemove(item.product_id)}
                  disabled={updating[item.product_id]}
                  aria-label="Remove from wishlist"
                >
                  ×
                </button>
                
                <Link to={`/product/${item.slug}`} className="wishlist-image">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} />
                  ) : (
                    <div className="placeholder-image">📷</div>
                  )}
                  {item.deal_price && (
                    <span className="deal-badge">🔥 {item.discount_percentage}% OFF</span>
                  )}
                </Link>
                
                <div className="wishlist-details">
                  <Link to={`/product/${item.slug}`} className="product-name">
                    {item.name}
                  </Link>
                  
                  <Link to={`/seller/${item.seller_slug}`} className="seller-info">
                    <span className="seller-icon">🏪</span>
                    {item.seller_name}
                    {item.is_verified && <span className="verified">✓</span>}
                  </Link>
                  
                  <div className="product-rating">
                    {item.avg_rating > 0 ? (
                      <>
                        <span className="stars">{'⭐'.repeat(Math.round(item.avg_rating))}</span>
                        <span className="rating-count">({item.review_count})</span>
                      </>
                    ) : (
                      <span className="no-rating">No reviews yet</span>
                    )}
                  </div>
                  
                  <div className="product-price">
                    {item.deal_price ? (
                      <>
                        <span className="original-price">₵{item.price}</span>
                        <span className="deal-price">₵{item.deal_price}</span>
                      </>
                    ) : (
                      <span className="current-price">₵{item.price}</span>
                    )}
                  </div>
                  
                  <div className="stock-status">
                    {item.stock > 0 && item.is_available ? (
                      <span className="in-stock">✓ In Stock</span>
                    ) : (
                      <span className="out-of-stock">Out of Stock</span>
                    )}
                  </div>
                </div>
                
                <div className="wishlist-actions">
                  <button 
                    className="btn-add-to-cart"
                    onClick={() => handleMoveToCart(item.product_id)}
                    disabled={updating[item.product_id] || !item.is_available || item.stock <= 0}
                  >
                    {updating[item.product_id] ? 'Adding...' : '🛒 Add to Cart'}
                  </button>
                  <Link to={`/checkout/${item.slug}`} className="btn-buy-now">
                    Buy Now
                  </Link>
                </div>
                
                <div className="added-date">
                  Added {new Date(item.added_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
