import React from 'react';
import '../styles/SupportPage.css';

const PrivacyPolicyPage = () => {
  return (
    <div className="support-page">
      <div className="container">
        <div className="support-header">
          <h1>Privacy Policy</h1>
          <p>Last updated: February 13, 2026</p>
        </div>

        <div className="legal-content">
          <section className="legal-section">
            <h2>1. Information We Collect</h2>
            <p>
              We collect information to provide better services to all our users and to 
              maintain a secure marketplace environment.
            </p>
            
            <h3>Personal Information</h3>
            <ul>
              <li>Name, email address, and contact information</li>
              <li>Shipping and billing addresses</li>
              <li>Payment information (processed securely through our payment partners)</li>
              <li>Account credentials</li>
            </ul>

            <h3>Transaction Information</h3>
            <ul>
              <li>Purchase history and order details</li>
              <li>Communication with sellers and support team</li>
              <li>Reviews and ratings you provide</li>
            </ul>

            <h3>Technical Information</h3>
            <ul>
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>
          
          <section className="legal-section">
            <h2>2. How We Use Your Information</h2>
            <ul>
              <li>Process transactions and manage escrow accounts</li>
              <li>Communicate order status and shipping updates</li>
              <li>Provide customer support</li>
              <li>Prevent fraud and maintain platform security</li>
              <li>Improve our services and user experience</li>
              <li>Send promotional communications (with your consent)</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>3. Data Retention</h2>
            <p>
              We retain your personal information only as long as necessary to fulfill the purposes 
              outlined in this policy:
            </p>
            <ul>
              <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
              <li><strong>Transaction Records:</strong> 7 years for tax and legal compliance</li>
              <li><strong>Closed Accounts:</strong> Personal data deleted within 90 days of account closure (except transaction records)</li>
              <li><strong>Marketing Data:</strong> Deleted within 30 days of opt-out request</li>
              <li><strong>Legal Holds:</strong> Data preserved longer if required by law or ongoing legal proceedings</li>
              <li><strong>Backup Systems:</strong> Deleted data may persist in backups for up to 90 days before permanent deletion</li>
            </ul>
            <p>
              You may request deletion of your data at any time by contacting privacy@kudimall.com, 
              subject to our legal retention requirements.
            </p>
          </section>

          <section className="legal-section">
            <h2>4. Information Sharing</h2>
            <p>We do not sell your personal information. We may share information with:</p>
            
            <h3>Sellers</h3>
            <p>
              When you make a purchase, we share necessary information (name, shipping address) 
              with the seller to fulfill your order.
            </p>

            <h3>Service Providers</h3>
            <p>
              Third-party companies that help us operate our platform, including payment 
              processors, shipping partners, and cloud hosting services.
            </p>

            <h3>Legal Requirements</h3>
            <p>
              When required by law or to protect the rights, property, or safety of KudiMall, 
              our users, or others.
            </p>
          </section>

          <section className="legal-section">
            <h2>5. Escrow and Payment Security</h2>
            <p>
              All payment information is encrypted and processed through secure, PCI-compliant 
              payment gateways. We never store complete credit card information on our servers. 
              Funds held in escrow are maintained in secure, segregated accounts.
            </p>
          </section>

          <section className="legal-section">
            <h2>6. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul>
              <li>SSL/TLS encryption for data transmission</li>
              <li>Encrypted storage of sensitive information</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication requirements</li>
              <li>Monitoring for suspicious activity</li>
            </ul>
          </section>

          <section className="legal-section">
            <h2>7. Your Rights and Choices</h2>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct your information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data (subject to legal retention)</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Object:</strong> Object to processing of your data for specific purposes</li>
              <li><strong>Restrict:</strong> Request restriction of processing in certain circumstances</li>
            </ul>
            <p>
              To exercise these rights, contact privacy@kudimall.com. We will respond within 30 days.
            </p>
          </section>

          <section className="legal-section">
            <h2>8. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to improve your experience, analyze 
              usage patterns, and personalize content. You can control cookies through your 
              browser settings, though some features may not function properly if disabled.
            </p>
          </section>

          <section className="legal-section">
            <h2>9. Social Commerce Privacy</h2>
            <p>
              When you purchase through social media links, we collect the same information 
              as direct marketplace purchases. We do not access your social media accounts 
              or additional social media data beyond what you share during the transaction.
            </p>
          </section>

          <section className="legal-section">
            <h2>10. Children's Privacy</h2>
            <p>
              KudiMall is not intended for users under the age of 18. We do not knowingly 
              collect personal information from children. If you believe we have inadvertently 
              collected such information, please contact us immediately.
            </p>
          </section>

          <section className="legal-section">
            <h2>11. International Users</h2>
            <p>
              Your information may be transferred to and processed in countries other than 
              your own. We ensure appropriate safeguards are in place for international 
              data transfers, including standard contractual clauses and adequacy decisions 
              where applicable.
            </p>
          </section>

          <section className="legal-section">
            <h2>12. Changes to Privacy Policy</h2>
            <p>
              We may update this privacy policy periodically. Material changes will be notified 
              via email at least 30 days before taking effect. We will also update the "Last updated" 
              date at the top of this policy.
            </p>
          </section>

          <section className="legal-section">
            <h2>13. Contact Us</h2>
            <p>
              For questions about this Privacy Policy or to exercise your rights, contact us at:
            </p>
            <p>
              Email: privacy@kudimall.com<br />
              Address: KudiMall Privacy Team, 123 Commerce Avenue, Business District, Lagos, Nigeria<br />
              Response Time: We respond to data requests within 30 days
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
