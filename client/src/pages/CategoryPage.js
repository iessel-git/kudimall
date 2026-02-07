import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCategory, getCategoryProducts } from '../services/api';
import '../styles/CategoryPage.css';

const CategoryPage = () => {
  const { slug } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoryRes, productsRes] = await Promise.all([
          getCategory(slug),
          getCategoryProducts(slug)
        ]);
        
        setCategory(categoryRes.data);
        setProducts(productsRes.data);
      } catch (error) {
        console.error('Error fetching category:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!category) {
    return <div className="error">Category not found</div>;
  }

  return (
    <div className="category-page">
      <div className="container">
        <div className="category-header">
          <h1>{category.name}</h1>
          <p>{category.description}</p>
        </div>

        <div className="products-grid">
          {products.length === 0 ? (
            <p className="no-products">No products found in this category.</p>
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
                  <p className="product-seller">
                    by {product.seller_name}
                    {product.is_verified && ' ✓'}
                  </p>
                  <p className="product-price">
                    ₦{product.price.toLocaleString()}
                  </p>
                  <div className="product-meta">
                    <span className="trust-badge">
                      Trust: {product.trust_level}/5
                    </span>
                    <span className="escrow-badge">🔒 Escrow</span>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
