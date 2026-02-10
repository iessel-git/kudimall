import React from 'react';
import '../styles/SupportPage.css';

const TermsOfServicePage = () => {
  return (
    <div className="support-page">
      <div className="container">
        <div className="support-header">
          <h1>Terms of Service</h1>
          <p>Last updated: February 7, 2026</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Agreement to Terms</h2>
            <p>
              By accessing and using KudiMall, you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>
          </section>

          <section className="legal-section">
            <h2>2. Use of Service</h2>
            <p>
              KudiMall provides an online marketplace platform connecting buyers and sellers. 
              Our platform includes both a destination marketplace and social-commerce checkout 
              capabilities.
            </p>
            <ul>
              <li>You must be at least 18 years old to use this service</li>
              <li>You are responsible for maintaining the confidentiality of your account</li>
              <li>You agree to provide accurate and complete information</li>
              <li>You will not use the service for any illegal or unauthorized purpose</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Escrow Protection</h2>
            <p>
              All transactions on KudiMall are protected by our escrow system. Funds are held 
              securely until the buyer confirms receipt and satisfaction with the product.
            </p>
            <ul>
              <li>Payments are held in escrow until delivery confirmation</li>
              <li>Buyers have a review period to inspect items</li>
              <li>Disputes are mediated by KudiMall support team</li>
              <li>Sellers receive payment only after successful transaction completion</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>4. Buyer Responsibilities</h2>
            <ul>
              <li>Provide accurate shipping and contact information</li>
              <li>Review products upon receipt within specified timeframe</li>
              <li>Communicate issues promptly to support team</li>
              <li>Confirm receipt and satisfaction when applicable</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>5. Seller Responsibilities</h2>
            <ul>
              <li>Provide accurate product descriptions and images</li>
              <li>Honor advertised prices and promotions</li>
              <li>Ship items promptly with tracking information</li>
              <li>Respond to buyer inquiries in a timely manner</li>
              <li>Maintain verified seller status requirements</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>6. Social Commerce</h2>
            <p>
              KudiMall enables sellers to share product links on social media platforms. 
              Purchases made through these links are subject to the same terms and protections 
              as direct marketplace purchases.
            </p>
          </section>

          <section className="legal-section">
            <h2>7. Prohibited Activities</h2>
            <ul>
              <li>Selling counterfeit, illegal, or restricted items</li>
              <li>Manipulating reviews or ratings</li>
              <li>Harassment or abusive behavior toward other users</li>
              <li>Attempting to bypass escrow protection</li>
              <li>Sharing account credentials with others</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>8. Limitation of Liability</h2>
            <p>
              KudiMall acts as a platform connecting buyers and sellers. While we provide 
              escrow protection and verification systems, we are not responsible for the 
              quality, safety, or legality of items listed or sold.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Changes will be 
              effective immediately upon posting. Your continued use of the service 
              constitutes acceptance of modified terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Contact</h2>
            <p>
              Questions about the Terms of Service should be sent to us at 
              legal@kudimall.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
