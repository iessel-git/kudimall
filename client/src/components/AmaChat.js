import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatWithAma, addToCart } from '../services/api';
import '../styles/AmaChat.css';

const AmaChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ama',
      text: "Hi! I'm Ama, your KudiMall shopping assistant! 👋\n\nHow can I help you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatWithAma(inputMessage);
      
      const amaMessage = {
        id: Date.now() + 1,
        sender: 'ama',
        text: response.data.message,
        data: response.data.data,
        actions: response.data.actions,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, amaMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'ama',
        text: "Oops! I had trouble understanding that. Could you try asking in a different way? 😅",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (action) => {
    switch (action.type) {
      case 'view_product':
        navigate(`/product/${action.productSlug}`);
        break;
      case 'view_category':
        navigate(`/category/${action.categorySlug}`);
        break;
      case 'navigate':
        navigate(action.path);
        break;
      case 'add_to_cart':
        try {
          await addToCart(action.productId, 1);
          const successMsg = {
            id: Date.now(),
            sender: 'ama',
            text: `✅ "${action.productName}" added to cart!\n\nWant to:\n• Add more items?\n• View your cart?\n• Continue shopping?`,
            timestamp: new Date(),
            actions: [
              { type: 'navigate', label: '🛒 View Cart', path: '/cart' },
              { type: 'navigate', label: '🏠 Continue Shopping', path: '/' }
            ]
          };
          setMessages(prev => [...prev, successMsg]);
          window.dispatchEvent(new CustomEvent('cartUpdated'));
        } catch (error) {
          const errorMsg = {
            id: Date.now(),
            sender: 'ama',
            text: `❌ Sorry, I couldn't add that to your cart.\n\n${error.response?.data?.error || 'Please try again or contact support if the issue persists.'}`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMsg]);
        }
        break;
      default:
        break;
    }
  };

  const quickActions = [
    { label: '🔍 Search Products', query: 'search products' },
    { label: '🚚 Delivery Fees', query: 'delivery fees' },
    { label: '🔥 View Deals', query: 'show me deals' },
    { label: '📦 Categories', query: 'show categories' }
  ];

  const handleQuickAction = (query) => {
    setInputMessage(query);
    setTimeout(() => {
      document.getElementById('ama-input')?.focus();
    }, 100);
  };

  if (!isOpen) {
    return (
      <button className="ama-chat-button" onClick={() => setIsOpen(true)}>
        <span className="ama-icon">🤖</span>
        <span className="ama-label">Chat with Ama</span>
      </button>
    );
  }

  return (
    <div className={`ama-chat-widget ${isMinimized ? 'minimized' : ''}`}>
      <div className="ama-chat-header">
        <div className="ama-header-info">
          <div className="ama-avatar">🤖</div>
          <div className="ama-header-text">
            <h3>Ama</h3>
            <span className="ama-status">● Online</span>
          </div>
        </div>
        <div className="ama-header-actions">
          <button 
            className="ama-minimize-btn" 
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? '□' : '―'}
          </button>
          <button 
            className="ama-close-btn" 
            onClick={() => setIsOpen(false)}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="ama-chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`ama-message ${msg.sender}`}>
                <div className="ama-message-content">
                  <p>{msg.text}</p>
                  
                  {msg.data?.products && (
                    <div className="ama-products-list">
                      {msg.data.products.slice(0, 5).map(product => (
                        <div key={product.id} className="ama-product-card">
                          <div className="ama-product-image">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} />
                            ) : (
                              <div className="ama-product-placeholder">📦</div>
                            )}
                          </div>
                          <div className="ama-product-info">
                            <h4>{product.name}</h4>
                            <p className="ama-product-price">₵{product.price.toLocaleString()}</p>
                            <span className="ama-product-seller">by {product.seller_name}</span>
                            <div className="ama-product-actions">
                              <button
                                className="ama-product-btn view"
                                onClick={() => handleAction({
                                  type: 'view_product',
                                  productSlug: product.slug
                                })}
                              >
                                👁️ View
                              </button>
                              {msg.data.isLoggedIn && (
                                <button
                                  className="ama-product-btn add"
                                  onClick={() => handleAction({
                                    type: 'add_to_cart',
                                    productId: product.id,
                                    productName: product.name
                                  })}
                                >
                                  🛒 Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.actions && msg.actions.length > 0 && (
                    <div className="ama-actions">
                      {msg.actions.slice(0, 6).map((action, idx) => (
                        <button
                          key={idx}
                          className="ama-action-btn"
                          onClick={() => handleAction(action)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="ama-message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            
            {isLoading && (
              <div className="ama-message ama">
                <div className="ama-message-content">
                  <div className="ama-typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="ama-quick-actions">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                className="ama-quick-action"
                onClick={() => handleQuickAction(action.query)}
              >
                {action.label}
              </button>
            ))}
          </div>

          <form className="ama-chat-input" onSubmit={handleSendMessage}>
            <input
              id="ama-input"
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask Ama anything..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !inputMessage.trim()}>
              <span className="ama-send-icon">➤</span>
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default AmaChat;
