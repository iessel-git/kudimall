import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSeller, getSellerProducts, getSellerReviews } from '../services/api';
import '../styles/SellerStorePage.css';

const SellerStorePage = () => {
  const { slug } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sellerRes, productsRes, reviewsRes] = await Promise.all([
          getSeller(slug),
          getSellerProducts(slug),
          getSellerReviews(slug)
        ]);
        
        setSeller(sellerRes.data);
        setProducts(productsRes.data);
        setReviews(reviewsRes.data);
      } catch (error) {
        console.error('Error fetching seller:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!seller) {
    return <div className="error">Seller not found</div>;
  }

  return (
    <div className="seller-store-page">
      {/* Store Banner */}
      <div className="store-banner">
        <div className="container">
          <div className="store-header">
            <div className="store-logo">🏪</div>
            <div className="store-info">
              <h1>{seller.name}</h1>
              {seller.is_verified && (
                <span className="verified-badge">✅ Verified Seller</span>
              )}
              <p className="store-location">📍 {seller.location}</p>
              <div className="store-stats">
                <span>Trust Level: {seller.trust_level}/5 ⭐</span>
                <span>•</span>
                <span>{seller.total_sales} Sales</span>
                <span>•</span>
                <span>{reviews.length} Reviews</span>
              </div>
            </div>
            <button className="follow-button">Follow Store</button>
          </div>
          <p className="store-description">{seller.description}</p>
        </div>
      </div>

      {/* Products Section */}
      <div className="container">
        <section className="store-products">
          <h2>Products</h2>
          <div className="products-grid">
            {products.length === 0 ? (
              <p className="no-products">No products available.</p>
            ) : (
              products.map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.slug}`}
                  className="product-card"
                >
                  <div className="product-image">
                    <div className="placeholder-image">📷</div>
                  </div>
                  <div className="product-info">
                    <h3 className="product-name">{product.name}</h3>
                    <p className="product-category">{product.category_name}</p>
                    <p className="product-price">
                      ₵{product.price.toLocaleString()}
                    </p>
                    <span className="escrow-badge">🔒 Escrow Protected</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Reviews Section */}
        <section className="store-reviews">
          <h2>Customer Reviews</h2>
          {reviews.length === 0 ? (
            <p>No reviews yet.</p>
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
                  <p className="review-product">Product: {review.product_name}</p>
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

export default SellerStorePage;
