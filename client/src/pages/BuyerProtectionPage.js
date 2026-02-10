import React from 'react';
import '../styles/SupportPage.css';

const BuyerProtectionPage = () => {
  return (
    <div className="support-page">
      <div className="container">
        <div className="support-header">
          <h1>Buyer Protection</h1>
          <p>Shop with confidence knowing every purchase is protected</p>
        </div>

        <div className="support-content">
          <section className="faq-section">
            <h2>Your Purchase, Fully Protected</h2>
            <p style={{ fontSize: '16px', color: 'var(--lux-slate)', marginBottom: '30px', lineHeight: '1.8' }}>
              At KudiMall, buyer protection isn't just a feature—it's the foundation of our platform. 
              Our escrow system ensures that your money is safe until you're completely satisfied with 
              your purchase. Whether you shop directly or through social media links, you're always protected.
            </p>

            <div className="protection-grid">
              <div className="protection-card">
                <span className="protection-icon">🔒</span>
                <h3>Secure Escrow System</h3>
                <p>
                  Your payment is held in a secure escrow account until you confirm receipt and 
                  satisfaction. Sellers cannot access funds until you approve, giving you complete 
                  control over the transaction.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">✅</span>
                <h3>Verified Sellers Only</h3>
                <p>
                  Every seller on KudiMall undergoes identity verification and background checks. 
                  We maintain strict standards to ensure you're dealing with legitimate, trustworthy 
                  merchants.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">🛡️</span>
                <h3>Dispute Resolution</h3>
                <p>
                  If something goes wrong, our dedicated support team steps in to mediate. Your 
                  funds remain in escrow during dispute resolution, and we work to ensure fair 
                  outcomes for all parties.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">📦</span>
                <h3>Delivery Guarantee</h3>
                <p>
                  If your item doesn't arrive or is significantly different from the description, 
                  you're protected. We'll help resolve the issue and ensure you get what you paid 
                  for—or your money back.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">💳</span>
                <h3>Secure Payments</h3>
                <p>
                  All transactions are encrypted and processed through PCI-compliant payment gateways. 
                  Your financial information is never shared with sellers and remains completely secure.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">🌐</span>
                <h3>Social Commerce Safety</h3>
                <p>
                  Products shared on social media link directly to our secure platform. You get the 
                  convenience of social shopping with the full protection of our escrow system.
                </p>
              </div>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>How Our Escrow System Works</h2>
            
            <div className="faq-item">
              <h3>Step 1: Payment is Secured</h3>
              <p>
                When you complete a purchase, your payment is immediately placed into a secure 
                escrow account. This is a segregated account that neither the seller nor KudiMall 
                can access without proper authorization. Your money is safe and waiting.
              </p>
            </div>

            <div className="faq-item">
              <h3>Step 2: Order Fulfillment</h3>
              <p>
                The seller is notified of the order and must ship the item promptly with tracking 
                information. They know that payment will only be released once you're satisfied, 
                so there's a strong incentive to provide excellent service.
              </p>
            </div>

            <div className="faq-item">
              <h3>Step 3: Delivery & Inspection</h3>
              <p>
                You receive your item and have a review period to inspect it. Check that everything 
                matches the description, is in good condition, and meets your expectations. Take your 
                time—there's no rush.
              </p>
            </div>

            <div className="faq-item">
              <h3>Step 4: Confirmation or Dispute</h3>
              <p>
                If you're satisfied, confirm receipt through your account. The escrow releases payment 
                to the seller, and the transaction is complete. If there's an issue, don't confirm—
                contact our support team immediately. Your funds stay protected while we investigate.
              </p>
            </div>

            <div className="faq-item">
              <h3>Step 5: Resolution</h3>
              <p>
                If a dispute arises, our support team reviews all evidence including order details, 
                communications, tracking information, and photos. We work to reach a fair resolution, 
                which may include refunds, replacements, or partial settlements.
              </p>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>When You're Protected</h2>
            
            <div className="faq-item">
              <h3>Item Not Received</h3>
              <p>
                If your item doesn't arrive by the expected delivery date, don't confirm receipt. 
                Contact our support team with your order details. If the seller cannot provide proof 
                of delivery, you'll receive a full refund from escrow.
              </p>
            </div>

            <div className="faq-item">
              <h3>Item Not as Described</h3>
              <p>
                If the item you receive is significantly different from the listing—wrong color, size, 
                model, or condition—you're protected. Document the discrepancies with photos and contact 
                support. We'll work with the seller to offer a replacement or refund.
              </p>
            </div>

            <div className="faq-item">
              <h3>Damaged or Defective Items</h3>
              <p>
                Items should arrive in the condition advertised. If your purchase arrives damaged or 
                has defects not mentioned in the listing, you're entitled to a resolution. Take photos 
                of the damage and packaging, and contact support before the review period ends.
              </p>
            </div>

            <div className="faq-item">
              <h3>Unauthorized Transactions</h3>
              <p>
                If you notice a charge you didn't authorize, contact us immediately. We'll freeze the 
                escrow, investigate the transaction, and work with you to resolve any fraudulent activity. 
                Your account security is our top priority.
              </p>
            </div>

            <div className="faq-item">
              <h3>Social Media Purchase Issues</h3>
              <p>
                Purchases made through social media links are protected just like marketplace purchases. 
                If you clicked a social link and completed checkout on kudimall.com, all our protection 
                policies apply. Always verify you're on our official domain before paying.
              </p>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>Making a Claim</h2>
            
            <div className="faq-item">
              <h3>Contact Support Immediately</h3>
              <p>
                Don't wait—reach out to our support team as soon as you identify an issue. The sooner 
                we're aware, the faster we can help. You can contact us via email, live chat, or phone.
              </p>
            </div>

            <div className="faq-item">
              <h3>Provide Documentation</h3>
              <p>
                Include your order number, description of the problem, and any supporting evidence like 
                photos, screenshots, or communications with the seller. The more information you provide, 
                the quicker we can resolve your issue.
              </p>
            </div>

            <div className="faq-item">
              <h3>Our Investigation</h3>
              <p>
                Our support team will review your claim, contact the seller, and examine all available 
                evidence. We typically respond to claims within 24-48 hours and work toward resolution 
                within 5-7 business days.
              </p>
            </div>

            <div className="faq-item">
              <h3>Resolution Options</h3>
              <p>
                Depending on the situation, resolutions may include: full refund from escrow, partial 
                refund with item kept, replacement item sent by seller, or return shipping labels for 
                returned items. We ensure fair outcomes based on our policies and evidence.
              </p>
            </div>
          </section>

          <div className="trust-guarantee">
            <div className="guarantee-badge">
              <span className="badge-icon">🛡️</span>
              <h3>KudiMall Guarantee</h3>
            </div>
            <p>
              We stand behind every transaction on our platform. If you follow our guidelines, 
              shop from verified sellers, and communicate issues promptly, you're protected. 
              That's our commitment to you—safe, secure, and confident shopping every time.
            </p>
          </div>

          <div className="cta-section">
            <h2>Questions About Protection?</h2>
            <p>Our support team is here to help you shop with confidence</p>
            <div className="cta-buttons">
              <a href="/help-center" className="btn-primary">Visit Help Center</a>
              <a href="/contact-us" className="btn-secondary">Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerProtectionPage;
