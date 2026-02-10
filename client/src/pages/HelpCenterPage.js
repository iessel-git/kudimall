import React from 'react';
import '../styles/SupportPage.css';

const HelpCenterPage = () => {
  return (
    <div className="support-page">
      <div className="container">
        <div className="support-header">
          <h1>Help Center</h1>
          <p>Find answers to common questions and get the help you need</p>
        </div>

        <div className="support-content">
          <section className="faq-section">
            <h2>Frequently Asked Questions</h2>
            
            <div className="faq-item">
              <h3>How does escrow protection work?</h3>
              <p>
                When you make a purchase on KudiMall, your payment is held securely in escrow. 
                The seller only receives payment once you confirm that you've received the product 
                and are satisfied with it. This ensures both buyers and sellers are protected.
              </p>
            </div>

            <div className="faq-item">
              <h3>How do I track my order?</h3>
              <p>
                After your purchase is confirmed, you'll receive tracking information via email. 
                You can also view your order status by visiting your account dashboard.
              </p>
            </div>

            <div className="faq-item">
              <h3>What if I receive a damaged or incorrect item?</h3>
              <p>
                Contact us immediately through our support team. Do not confirm receipt of the item. 
                Our escrow system keeps your funds protected until the issue is resolved.
              </p>
            </div>

            <div className="faq-item">
              <h3>Can I buy through social media links?</h3>
              <p>
                Yes! KudiMall sellers can share product links on social media platforms. 
                When you click these links and make a purchase, you'll still enjoy the same 
                escrow protection and buyer guarantees as shopping directly on our site.
              </p>
            </div>

            <div className="faq-item">
              <h3>How do I contact a seller?</h3>
              <p>
                Visit the seller's store page and use the contact button. All communications 
                are monitored to ensure safe and professional interactions.
              </p>
            </div>

            <div className="faq-item">
              <h3>What payment methods do you accept?</h3>
              <p>
                We accept major credit cards, debit cards, and various digital payment methods. 
                All payments are processed securely through our escrow system.
              </p>
            </div>
          </section>

          <section className="help-categories">
            <h2>Browse Help Topics</h2>
            <div className="help-grid">
              <div className="help-card">
                <span className="help-icon">🛒</span>
                <h3>Buying on KudiMall</h3>
                <p>Learn how to shop safely and make the most of your purchases</p>
              </div>
              <div className="help-card">
                <span className="help-icon">🔒</span>
                <h3>Security & Safety</h3>
                <p>Understand our escrow system and buyer protection policies</p>
              </div>
              <div className="help-card">
                <span className="help-icon">📦</span>
                <h3>Shipping & Delivery</h3>
                <p>Track orders, delivery times, and shipping costs</p>
              </div>
              <div className="help-card">
                <span className="help-icon">💳</span>
                <h3>Payments & Refunds</h3>
                <p>Payment methods, refund policies, and transaction details</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
