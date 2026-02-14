import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  getCart, 
  updateCartItem, 
  removeFromCart, 
  saveCartItemForLater,
  moveCartItemToCart,
  clearCart 
} from '../services/api';
import '../styles/CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  const fetchCart = useCallback(async () => {
    try {
      const response = await getCart();
      setCart(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 401) {
        navigate('/buyer/login', { state: { from: { pathname: '/cart' } } });
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('buyer_token');
    if (!token) {
      navigate('/buyer/login', { state: { from: { pathname: '/cart' } } });
      return;
    }
    fetchCart();
  }, [navigate, fetchCart]);

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      await updateCartItem(itemId, newQuantity);
      await fetchCart();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update quantity');
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleRemove = async (itemId) => {
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      await removeFromCart(itemId);
      await fetchCart();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to remove item');
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleSaveForLater = async (itemId) => {
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      await saveCartItemForLater(itemId);
      await fetchCart();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save item');
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleMoveToCart = async (itemId) => {
    setUpdating(prev => ({ ...prev, [itemId]: true }));
    try {
      await moveCartItemToCart(itemId);
      await fetchCart();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to move item');
    } finally {
      setUpdating(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;
    
    try {
      await clearCart();
      await fetchCart();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to clear cart');
    }
  };

  const handleCheckout = () => {
    if (!cart || cart.items.length === 0) return;
    navigate('/cart-checkout');
  };

  if (loading) {
    return <div className="loading">Loading your cart...</div>;
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <h1>🛒 Shopping Cart</h1>
          {cart && cart.items.length > 0 && (
            <button className="btn-clear-cart" onClick={handleClearCart}>
              Clear Cart
            </button>
          )}
        </div>

        {!cart || cart.items.length === 0 ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/" className="btn-shop-now">Start Shopping</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items-section">
              {/* Group by seller */}
              {cart.seller_groups.map(group => (
                <div key={group.seller_id} className="seller-group">
                  <div className="seller-group-header">
                    <Link to={`/seller/${group.seller_slug}`} className="seller-name">
                      🏪 {group.seller_name}
                    </Link>
                    <span className="seller-subtotal">
                      Subtotal: ₵{group.subtotal.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="cart-items">
                    {group.items.map(item => (
                      <div key={item.id} className={`cart-item ${updating[item.id] ? 'updating' : ''}`}>
                        <div className="item-image">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} />
                          ) : (
                            <div className="placeholder-image">📷</div>
                          )}
                          {item.deal_price && (
                            <span className="deal-badge">🔥 {item.discount_percentage}% OFF</span>
                          )}
                        </div>
                        
                        <div className="item-details">
                          <Link to={`/product/${item.slug}`} className="item-name">
                            {item.name}
                          </Link>
                          
                          <div className="item-price">
                            {item.deal_price ? (
                              <>
                                <span className="original-price">₵{parseFloat(item.current_product_price).toLocaleString()}</span>
                                <span className="deal-price">₵{parseFloat(item.deal_price).toLocaleString()}</span>
                              </>
                            ) : (
                              <span className="current-price">₵{parseFloat(item.current_product_price || item.unit_price).toLocaleString()}</span>
                            )}
                          </div>
                          
                          <div className="item-stock">
                            {item.stock > 0 ? (
                              <span className="in-stock">✓ In Stock ({item.stock} available)</span>
                            ) : (
                              <span className="out-of-stock">Out of Stock</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="item-quantity">
                          <button 
                            className="qty-btn"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || updating[item.id]}
                          >
                            −
                          </button>
                          <span className="qty-value">{item.quantity}</span>
                          <button 
                            className="qty-btn"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.stock || updating[item.id]}
                          >
                            +
                          </button>
                        </div>
                        
                        <div className="item-subtotal">
                          ₵{parseFloat(item.subtotal).toLocaleString()}
                        </div>
                        
                        <div className="item-actions">
                          <button 
                            className="btn-save-later"
                            onClick={() => handleSaveForLater(item.id)}
                            disabled={updating[item.id]}
                          >
                            Save for Later
                          </button>
                          <button 
                            className="btn-remove"
                            onClick={() => handleRemove(item.id)}
                            disabled={updating[item.id]}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Items ({cart.item_count}):</span>
                <span>₵{cart.cart_total.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Delivery:</span>
                <span className="free-delivery">FREE</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>₵{cart.cart_total.toLocaleString()}</span>
              </div>
              
              <button 
                className="btn-checkout"
                onClick={handleCheckout}
                disabled={cart.items.length === 0}
              >
                Proceed to Checkout
              </button>
              
              <div className="escrow-notice">
                <span>🔒</span>
                <p>Your payment is protected by escrow until you confirm delivery</p>
              </div>
            </div>
          </div>
        )}

        {/* Saved for Later Section */}
        {cart && cart.saved_items && cart.saved_items.length > 0 && (
          <div className="saved-section">
            <h2>Saved for Later ({cart.saved_items.length})</h2>
            <div className="saved-items">
              {cart.saved_items.map(item => (
                <div key={item.id} className={`saved-item ${updating[item.id] ? 'updating' : ''}`}>
                  <div className="item-image">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      <div className="placeholder-image">📷</div>
                    )}
                    {item.deal_price && (
                      <span className="deal-badge">🔥 {item.discount_percentage}% OFF</span>
                    )}
                  </div>
                  <div className="item-details">
                    <Link to={`/product/${item.slug}`} className="item-name">
                      {item.name}
                    </Link>
                    <div className="item-price">
                      {item.deal_price ? (
                        <>
                          <span className="original-price">₵{parseFloat(item.current_product_price).toLocaleString()}</span>
                          <span className="deal-price">₵{parseFloat(item.deal_price).toLocaleString()}</span>
                        </>
                      ) : (
                        <span>₵{parseFloat(item.current_product_price || item.unit_price).toLocaleString()}</span>
                      )}
                    </div>
                    <div className="saved-item-actions">
                      <button 
                        className="btn-move-to-cart"
                        onClick={() => handleMoveToCart(item.id)}
                        disabled={updating[item.id]}
                      >
                        Move to Cart
                      </button>
                      <button 
                        className="btn-remove"
                        onClick={() => handleRemove(item.id)}
                        disabled={updating[item.id]}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
