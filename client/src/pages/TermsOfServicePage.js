import React from 'react';
import '../styles/SupportPage.css';

const TermsOfServicePage = () => {
  return (
    <div className="support-page">
      <div className="container">
        <div className="support-header">
          <h1>Terms of Service</h1>
          <p>Last updated: February 13, 2026</p>
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
            <h2>4. Refund and Return Policy</h2>
            <p>
              Buyers are entitled to refunds under the following conditions:
            </p>
            <ul>
              <li><strong>Item not as described:</strong> Full refund if product differs significantly from listing</li>
              <li><strong>Damaged or defective items:</strong> Full refund or replacement within 7 days of delivery</li>
              <li><strong>Non-delivery:</strong> Full refund if item not received within specified timeframe</li>
              <li><strong>Return window:</strong> 7 days from delivery confirmation for inspection</li>
              <li><strong>Return shipping:</strong> Seller responsible for defective items; buyer responsible for preference-based returns (if seller accepts)</li>
            </ul>
            <p>
              <strong>Refund Timeline:</strong> Approved refunds are processed to original payment method within 5-10 business days.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Buyer Responsibilities</h2>
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
              quality, safety, or legality of items listed or sold. KudiMall's liability 
              is limited to the transaction value, and we are not liable for indirect, 
              incidental, or consequential damages.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Dispute Resolution and Governing Law</h2>
            <p>
              <strong>Governing Law:</strong> These Terms shall be governed by and construed in 
              accordance with the laws of the jurisdiction where KudiMall operates, without 
              regard to its conflict of law provisions.
            </p>
            <p>
              <strong>Dispute Resolution Process:</strong>
            </p>
            <ul>
              <li><strong>Step 1 - Direct Resolution:</strong> Contact the other party to resolve the issue</li>
              <li><strong>Step 2 - KudiMall Mediation:</strong> Submit dispute to our support team within 14 days</li>
              <li><strong>Step 3 - Binding Decision:</strong> Our mediation team will review evidence and make a binding decision within 7 business days</li>
              <li><strong>Step 4 - Arbitration:</strong> For disputes exceeding $5,000 USD, parties may pursue binding arbitration</li>
            </ul>
            <p>
              <strong>Escrow Release:</strong> Funds remain in escrow during dispute resolution. Release 
              is determined by mediation outcome or mutual agreement.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. Account Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these terms. 
              Users may close their accounts at any time, subject to completion of pending 
              transactions. Upon termination:
            </p>
            <ul>
              <li>Pending transactions must be completed or refunded</li>
              <li>Escrow funds will be released according to transaction status</li>
              <li>Account data will be retained per our data retention policy</li>
              <li>Access to the platform will be revoked immediately</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Material changes will be 
              notified via email at least 30 days before taking effect. Your continued use of 
              the service after changes take effect constitutes acceptance of modified terms.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Contact</h2>
            <p>
              Questions about the Terms of Service should be sent to us at:<br />
              Email: legal@kudimall.com<br />
              Address: KudiMall Legal Department, 123 Commerce Avenue, Business District, Lagos, Nigeria
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
