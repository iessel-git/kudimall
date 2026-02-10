import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { search, getSellers } from '../services/api';
import '../styles/SearchResultsPage.css';

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  
  const [results, setResults] = useState({ products: [], sellers: [], categories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        
        // If type is 'sellers' and no query, fetch all sellers
        if (type === 'sellers' && !query) {
          const response = await getSellers();
          setResults({ products: [], sellers: response.data, categories: [] });
        } else if (query) {
          // Normal search with query
          const response = await search({ q: query, type });
          setResults(response.data);
        } else {
          // No query and not sellers-only view
          setResults({ products: [], sellers: [], categories: [] });
        }
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, type]);

  if (loading) {
    return <div className="loading">Searching...</div>;
  }

  const totalResults = 
    results.products.length + results.sellers.length + results.categories.length;

  const getPageTitle = () => {
    if (type === 'sellers' && !query) {
      return 'All Sellers';
    }
    return query ? `Search Results for "${query}"` : 'Search Results';
  };

  return (
    <div className="search-results-page">
      <div className="container">
        <div className="search-header">
          <h1>{getPageTitle()}</h1>
          <p>{totalResults} results found</p>
        </div>

        {/* Products */}
        {results.products.length > 0 && (
          <section className="results-section">
            <h2>Products ({results.products.length})</h2>
            <div className="products-grid">
              {results.products.map((product) => (
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
                      ₵{product.price.toLocaleString()}
                    </p>
                    <div className="product-badges">
                      <span className="trust-badge">
                        Trust: {product.trust_level}/5
                      </span>
                      <span className="escrow-badge">🔒 Escrow</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Sellers */}
        {results.sellers.length > 0 && (
          <section className="results-section">
            <h2>Sellers ({results.sellers.length})</h2>
            <div className="sellers-grid">
              {results.sellers.map((seller) => (
                <Link
                  key={seller.id}
                  to={`/seller/${seller.slug}`}
                  className="seller-card"
                >
                  <div className="seller-logo">🏪</div>
                  <h3>{seller.name}</h3>
                  {seller.is_verified && (
                    <span className="verified-badge">✓ Verified</span>
                  )}
                  <p className="seller-location">📍 {seller.location}</p>
                  <p className="seller-description">{seller.description}</p>
                  <div className="seller-stats">
                    <span>Trust: {seller.trust_level}/5</span>
                    <span>Sales: {seller.total_sales}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        {results.categories.length > 0 && (
          <section className="results-section">
            <h2>Categories ({results.categories.length})</h2>
            <div className="categories-grid">
              {results.categories.map((category) => (
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
          </section>
        )}

        {totalResults === 0 && (
          <div className="no-results">
            {query ? (
              <>
                <p>No results found for "{query}"</p>
                <p>Try different keywords or browse our categories.</p>
              </>
            ) : (
              <>
                <p>No sellers found</p>
                <p>Check back later for new sellers.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;
