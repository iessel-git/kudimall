import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFlashDeals, getTopDeals, getEndingSoonDeals } from '../services/api';
import '../styles/DealsPage.css';

const DealsPage = () => {
  const [allDeals, setAllDeals] = useState([]);
  const [topDeals, setTopDeals] = useState([]);
  const [endingSoonDeals, setEndingSoonDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const [allRes, topRes, endingSoonRes] = await Promise.all([
          getFlashDeals({ limit: 24 }),
          getTopDeals(8),
          getEndingSoonDeals()
        ]);
        
        setAllDeals(allRes.data.deals || []);
        setTopDeals(topRes.data.deals || []);
        setEndingSoonDeals(endingSoonRes.data.deals || []);
      } catch (error) {
        console.error('Error fetching deals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // Update countdown timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimeRemaining = (secondsRemaining) => {
    if (!secondsRemaining || secondsRemaining <= 0) return 'Ended';
    
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    const seconds = Math.floor(secondsRemaining % 60);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const calculateProgress = (deal) => {
    return Math.min((deal.quantity_sold / deal.quantity_available) * 100, 100);
  };

  if (loading) {
    return <div className="loading">Loading deals...</div>;
  }

  return (
    <div className="deals-page">
      {/* Hero Section */}
      <section className="deals-hero">
        <div className="container">
          <h1>🔥 Flash Deals</h1>
          <p>Limited time offers with massive discounts!</p>
        </div>
      </section>

      {/* Ending Soon Section */}
      {endingSoonDeals.length > 0 && (
        <section className="ending-soon-section">
          <div className="container">
            <div className="section-header">
              <h2>⏰ Ending Soon</h2>
              <p>Grab these before they're gone!</p>
            </div>
            <div className="ending-soon-grid">
              {endingSoonDeals.map(deal => (
                <Link key={deal.id} to={`/product/${deal.slug}`} className="ending-soon-card">
                  <div className="countdown-badge urgent">
                    {formatTimeRemaining(deal.seconds_remaining)}
                  </div>
                  <div className="deal-image">
                    {deal.image_url ? (
                      <img src={deal.image_url} alt={deal.name} />
                    ) : (
                      <div className="placeholder-image">📷</div>
                    )}
                  </div>
                  <div className="deal-info">
                    <h3>{deal.name}</h3>
                    <div className="deal-prices">
                      <span className="original">₵{deal.original_price}</span>
                      <span className="current">₵{deal.deal_price}</span>
                    </div>
                    <span className="discount-badge">-{deal.discount_percentage}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top Deals Section */}
      {topDeals.length > 0 && (
        <section className="top-deals-section">
          <div className="container">
            <div className="section-header">
              <h2>💎 Top Deals</h2>
              <p>Biggest discounts of the day</p>
            </div>
            <div className="top-deals-grid">
              {topDeals.map(deal => (
                <Link key={deal.id} to={`/product/${deal.slug}`} className="deal-card">
                  <div className="deal-badge">
                    <span className="discount">-{deal.discount_percentage}%</span>
                  </div>
                  
                  <div className="deal-image">
                    {deal.image_url ? (
                      <img src={deal.image_url} alt={deal.name} />
                    ) : (
                      <div className="placeholder-image">📷</div>
                    )}
                  </div>
                  
                  <div className="deal-content">
                    <h3 className="deal-name">{deal.name}</h3>
                    
                    <div className="seller-info">
                      {deal.seller_name}
                      {deal.is_verified && <span className="verified">✓</span>}
                    </div>
                    
                    <div className="deal-prices">
                      <span className="original-price">₵{deal.original_price}</span>
                      <span className="deal-price">₵{deal.deal_price}</span>
                    </div>
                    
                    <div className="deal-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${calculateProgress(deal)}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {deal.quantity_sold} sold of {deal.quantity_available}
                      </span>
                    </div>
                    
                    <div className="deal-countdown">
                      <span className="clock-icon">⏰</span>
                      <span className="time">{formatTimeRemaining(deal.seconds_remaining)}</span>
                    </div>
                    
                    {deal.avg_rating > 0 && (
                      <div className="deal-rating">
                        {'⭐'.repeat(Math.round(deal.avg_rating))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Deals Section */}
      <section className="all-deals-section">
        <div className="container">
          <div className="section-header">
            <h2>🛍️ All Deals</h2>
          </div>
          
          {allDeals.length === 0 ? (
            <div className="no-deals">
              <div className="no-deals-icon">🎯</div>
              <h3>No active deals right now</h3>
              <p>Check back soon for amazing discounts!</p>
              <Link to="/" className="btn-browse">Browse All Products</Link>
            </div>
          ) : (
            <div className="deals-grid">
              {allDeals.map(deal => (
                <Link key={deal.id} to={`/product/${deal.slug}`} className="deal-card">
                  <div className="deal-badge">
                    <span className="discount">-{deal.discount_percentage}%</span>
                  </div>
                  
                  <div className="deal-image">
                    {deal.image_url ? (
                      <img src={deal.image_url} alt={deal.name} />
                    ) : (
                      <div className="placeholder-image">📷</div>
                    )}
                  </div>
                  
                  <div className="deal-content">
                    <h3 className="deal-name">{deal.name}</h3>
                    
                    <div className="seller-info">
                      {deal.seller_name}
                      {deal.is_verified && <span className="verified">✓</span>}
                    </div>
                    
                    <div className="deal-prices">
                      <span className="original-price">₵{deal.original_price}</span>
                      <span className="deal-price">₵{deal.deal_price}</span>
                    </div>
                    
                    <div className="deal-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${calculateProgress(deal)}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {deal.quantity_sold}/{deal.quantity_available} sold
                      </span>
                    </div>
                    
                    <div className="deal-countdown">
                      <span className="time">{formatTimeRemaining(deal.seconds_remaining)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DealsPage;
