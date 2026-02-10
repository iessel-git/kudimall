import React from 'react';
import '../styles/SupportPage.css';

const HowItWorksPage = () => {
  return (
    <div className="support-page">
      <div className="container">
        <div className="support-header">
          <h1>How KudiMall Works</h1>
          <p>Your guide to safe and confident shopping on our platform</p>
        </div>

        <div className="support-content">
          <section className="faq-section">
            <h2>Shopping Made Simple & Secure</h2>
            <p style={{ fontSize: '16px', color: 'var(--lux-slate)', marginBottom: '30px', lineHeight: '1.8' }}>
              KudiMall combines the convenience of traditional online shopping with the reach of 
              social commerce, all protected by our secure escrow system. Whether you discover 
              products directly on our marketplace or through social media links, every transaction 
              is safe and protected.
            </p>

            <div className="process-steps">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Discover Products</h3>
                <p>
                  Browse our marketplace directly or click on product links shared by sellers 
                  on social media platforms. All products go through our verification process 
                  to ensure quality and authenticity.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Shop with Confidence</h3>
                <p>
                  Add items to your cart and proceed to checkout. You can shop from multiple 
                  verified sellers in a single transaction. Read reviews, check seller ratings, 
                  and view detailed product information before making your decision.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Secure Payment</h3>
                <p>
                  Your payment is held securely in escrow - not released to the seller until 
                  you confirm receipt and satisfaction. We accept all major payment methods, 
                  processed through encrypted, PCI-compliant gateways.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">4</div>
                <h3>Receive Your Order</h3>
                <p>
                  Track your shipment in real-time. Sellers are required to ship promptly with 
                  tracking information. You'll receive updates at every stage of delivery.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">5</div>
                <h3>Confirm & Review</h3>
                <p>
                  Inspect your items within the review period. If satisfied, confirm receipt 
                  and the payment is released to the seller. If there's an issue, our support 
                  team will step in to resolve it before any funds are transferred.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">6</div>
                <h3>Leave Feedback</h3>
                <p>
                  Share your experience by leaving a review. Your feedback helps the community 
                  and ensures sellers maintain high standards. Verified purchase reviews build 
                  trust across our marketplace.
                </p>
              </div>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>Social Commerce Features</h2>
            <div className="faq-item">
              <h3>What is Social Commerce?</h3>
              <p>
                Social commerce allows verified sellers to share product links on platforms like 
                Instagram, Facebook, Twitter, and more. When you click these links and make a 
                purchase, you're still buying through KudiMall's secure platform with full escrow 
                protection - it's just a different entry point.
              </p>
            </div>

            <div className="faq-item">
              <h3>How Does Social Shopping Work?</h3>
              <p>
                When a seller shares a product on social media, the link directs you to that 
                specific product on KudiMall. You checkout through our platform, your payment 
                is held in escrow, and you receive the same protections as any other purchase. 
                The seller never handles your payment directly.
              </p>
            </div>

            <div className="faq-item">
              <h3>Is Social Commerce Safe?</h3>
              <p>
                Absolutely. Whether you find us through social media or browse our marketplace 
                directly, every transaction goes through the same secure escrow system. Verify 
                that you're on kudimall.com before entering any payment information, and you'll 
                always be protected.
              </p>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>For Sellers</h2>
            <div className="faq-item">
              <h3>How to Start Selling</h3>
              <p>
                Create a seller account, complete our verification process, and set up your store. 
                You can list products, set prices, manage inventory, and share product links on 
                your social media channels to reach more customers.
              </p>
            </div>

            <div className="faq-item">
              <h3>Payment & Payouts</h3>
              <p>
                When a customer confirms receipt and satisfaction, payment is released from escrow 
                to your account. Payouts are processed within 3-5 business days. Our escrow system 
                protects both you and your customers from disputes.
              </p>
            </div>

            <div className="faq-item">
              <h3>Seller Verification</h3>
              <p>
                All sellers must complete identity verification, provide business information, and 
                agree to our seller standards. Verified sellers receive a badge that builds trust 
                with buyers and can access social commerce features.
              </p>
            </div>
          </section>

          <div className="cta-section">
            <h2>Ready to Start Shopping?</h2>
            <p>Join thousands of satisfied customers shopping with confidence on KudiMall</p>
            <div className="cta-buttons">
              <a href="/" className="btn-primary">Browse Products</a>
              <a href="/search?type=sellers" className="btn-secondary">Explore Sellers</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksPage;
