import React from 'react';
import '../styles/SupportPage.css';

const SellerDashboardPage = () => {
  return (
    <div className="support-page">
      <div className="container">
        <div className="support-header">
          <h1>Seller Dashboard</h1>
          <p>Manage your store, track sales, and grow your business</p>
        </div>

        <div className="support-content">
          <section className="faq-section">
            <h2>Your Command Center</h2>
            <p style={{ fontSize: '16px', color: 'var(--lux-slate)', marginBottom: '30px', lineHeight: '1.8' }}>
              The KudiMall Seller Dashboard is your central hub for managing every aspect of your 
              online business. From listing products to tracking performance, fulfilling orders to 
              analyzing sales data—everything you need is in one intuitive interface.
            </p>

            <div className="protection-grid">
              <div className="protection-card">
                <span className="protection-icon">📦</span>
                <h3>Product Management</h3>
                <p>
                  Create, edit, and organize your product listings. Upload photos, set prices, manage 
                  inventory levels, and control which items are active or paused.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">📋</span>
                <h3>Order Processing</h3>
                <p>
                  View new orders in real-time, print shipping labels, update tracking information, 
                  and communicate with buyers through integrated messaging.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">💰</span>
                <h3>Financial Overview</h3>
                <p>
                  Track earnings, pending payments in escrow, completed transactions, and available 
                  balance for withdrawal. Export financial reports for accounting.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">📊</span>
                <h3>Analytics & Insights</h3>
                <p>
                  Monitor sales trends, best-selling products, traffic sources, conversion rates, 
                  and social commerce performance with detailed charts and metrics.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">⭐</span>
                <h3>Reviews & Ratings</h3>
                <p>
                  View customer feedback, respond to reviews, track your seller rating, and identify 
                  areas for improvement based on buyer comments.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">🔗</span>
                <h3>Social Commerce Tools</h3>
                <p>
                  Generate shareable product links, track social media performance, see which platforms 
                  drive sales, and optimize your social strategy.
                </p>
              </div>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>Key Dashboard Features</h2>
            
            <div className="faq-item">
              <h3>Overview Dashboard</h3>
              <p>
                Your home screen provides at-a-glance metrics: today's sales, pending orders, messages 
                requiring response, available balance, and recent customer reviews. Customizable widgets 
                let you prioritize the information most important to your business. Quick action buttons 
                for common tasks like adding products or processing orders.
              </p>
            </div>

            <div className="faq-item">
              <h3>Product Listings Manager</h3>
              <p>
                Bulk upload products via CSV or add items individually. Rich text editor for descriptions 
                with formatting options. Image uploader supporting multiple photos per product (up to 10 
                images). Variant management for products with different sizes, colors, or options. Inventory 
                tracking with low-stock alerts. SEO optimization tools to improve product visibility.
              </p>
            </div>

            <div className="faq-item">
              <h3>Order Management System</h3>
              <p>
                Organized view of all orders by status: new, processing, shipped, delivered, disputed. 
                One-click access to buyer information, order details, and shipping addresses. Integrated 
                shipping label printing for major carriers. Tracking number input with automatic buyer 
                notifications. Order history and search functionality. Bulk actions for processing 
                multiple orders efficiently.
              </p>
            </div>

            <div className="faq-item">
              <h3>Messaging Center</h3>
              <p>
                Communicate directly with buyers through secure in-platform messaging. Receive notifications 
                for new messages. Maintain conversation history for reference. Professional response 
                templates for common inquiries. Attach images to clarify product questions or resolve 
                issues. All communications monitored for security and dispute resolution purposes.
              </p>
            </div>

            <div className="faq-item">
              <h3>Financial Dashboard</h3>
              <p>
                Real-time earnings display showing total revenue, pending in escrow, available for 
                withdrawal, and withdrawn amounts. Transaction history with detailed breakdowns of each 
                sale including item price, shipping, fees, and net earnings. Payout schedule calendar. 
                Downloadable financial reports for tax purposes or accounting. Multiple currency support 
                for international sellers.
              </p>
            </div>

            <div className="faq-item">
              <h3>Analytics Suite</h3>
              <p>
                <strong>Sales Analytics:</strong> Daily, weekly, monthly, and yearly sales trends. Revenue 
                charts and growth comparisons. Best-selling products and categories.<br/><br/>
                <strong>Traffic Analysis:</strong> Visitor counts, page views, and bounce rates. Traffic 
                sources breakdown (direct, search, social, referral).<br/><br/>
                <strong>Conversion Metrics:</strong> View-to-purchase conversion rates. Average order value. 
                Cart abandonment rates.<br/><br/>
                <strong>Social Commerce Data:</strong> Clicks and sales by social platform. Top-performing 
                social posts. Social engagement metrics.
              </p>
            </div>

            <div className="faq-item">
              <h3>Inventory Management</h3>
              <p>
                Track stock levels across all products and variants. Automatic low-stock alerts via email. 
                Inventory adjustment tools for returns, damages, or restocking. Sale history to inform 
                reorder decisions. Option to set products as "made-to-order" with custom handling times. 
                Inventory reports exportable to spreadsheets.
              </p>
            </div>

            <div className="faq-item">
              <h3>Promotion Tools</h3>
              <p>
                Create discount codes (percentage or fixed amount). Set promotion periods with automatic 
                start/end dates. Featured product promotion opportunities. Bundle pricing for multiple 
                items. Flash sale capabilities. Free shipping offers. Track promotion performance and ROI.
              </p>
            </div>

            <div className="faq-item">
              <h3>Social Sharing Manager</h3>
              <p>
                Generate trackable links for any product. One-click sharing to major social platforms. 
                Pre-formatted posts optimized for each platform. UTM parameter tracking for analytics. 
                Performance dashboard showing which social channels drive the most traffic and conversions. 
                Social post scheduling (coming soon).
              </p>
            </div>

            <div className="faq-item">
              <h3>Store Customization</h3>
              <p>
                Customize your seller profile with logo, banner image, and brand colors. Write your store 
                description and policies. Set shipping rates and handling times. Configure payment and 
                payout preferences. Manage return and refund policies. Add social media links to your 
                store page.
              </p>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>Mobile Dashboard Access</h2>
            
            <div className="faq-item">
              <h3>Manage On-the-Go</h3>
              <p>
                The KudiMall Seller Dashboard is fully responsive and mobile-optimized. Check orders, 
                respond to messages, update tracking information, and monitor sales from your smartphone 
                or tablet. Never miss an important notification or time-sensitive order while away from 
                your computer.
              </p>
            </div>

            <div className="faq-item">
              <h3>Push Notifications</h3>
              <p>
                Enable push notifications to receive instant alerts for new orders, buyer messages, 
                reviews, low inventory, and payout availability. Customize notification preferences to 
                receive only what matters most to you.
              </p>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>Performance Monitoring</h2>
            
            <div className="faq-item">
              <h3>Seller Scorecard</h3>
              <p>
                Your dashboard displays key performance indicators that affect your store's visibility 
                and reputation: <br/><br/>
                • Order fulfillment rate (on-time shipping)<br/>
                • Response time to buyer inquiries<br/>
                • Customer satisfaction rating<br/>
                • Order cancellation rate<br/>
                • Dispute resolution record
              </p>
            </div>

            <div className="faq-item">
              <h3>Verified Seller Status</h3>
              <p>
                Track your progress toward earning or maintaining verified seller status. See requirements, 
                your current standing, and areas for improvement. Verified sellers receive priority placement 
                in search results and inspire greater buyer confidence.
              </p>
            </div>

            <div className="faq-item">
              <h3>Growth Recommendations</h3>
              <p>
                The dashboard provides personalized suggestions based on your store's performance: optimize 
                product titles for search, adjust pricing strategy, improve product photos, respond faster 
                to messages, or expand into trending categories. Let data guide your growth strategy.
              </p>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>Support & Resources</h2>
            
            <div className="faq-item">
              <h3>In-Dashboard Help Center</h3>
              <p>
                Access contextual help articles and video tutorials directly within the dashboard. Each 
                section includes relevant help documentation. Search the knowledge base for specific 
                questions. Live chat support available during business hours.
              </p>
            </div>

            <div className="faq-item">
              <h3>Seller Community</h3>
              <p>
                Connect with other KudiMall sellers through our community forums. Share tips, ask questions, 
                showcase products, and learn from experienced sellers. Participate in monthly seller webinars 
                and Q&A sessions with our team.
              </p>
            </div>

            <div className="faq-item">
              <h3>Dedicated Account Manager</h3>
              <p>
                High-volume sellers (over $10,000 monthly sales) receive a dedicated account manager. Get 
                personalized support, priority issue resolution, strategic guidance, and early access to 
                new features. Apply through your dashboard settings.
              </p>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>Security & Data Protection</h2>
            
            <div className="faq-item">
              <h3>Secure Access</h3>
              <p>
                Your dashboard requires secure login with optional two-factor authentication. All data 
                transmitted is encrypted. Session timeouts protect against unauthorized access. Review 
                login history and device management in security settings.
              </p>
            </div>

            <div className="faq-item">
              <h3>Data Backup & Recovery</h3>
              <p>
                All your seller data is automatically backed up daily. Product listings, order history, 
                customer communications, and financial records are securely stored and recoverable. Export 
                your data anytime for external backups or records.
              </p>
            </div>

            <div className="faq-item">
              <h3>Privacy Compliance</h3>
              <p>
                The dashboard complies with international data protection regulations including GDPR and 
                CCPA. Buyer personal information is protected and only accessible for order fulfillment 
                purposes. Your business data remains confidential and is never shared with third parties.
              </p>
            </div>
          </section>

          <div className="trust-guarantee">
            <div className="guarantee-badge">
              <span className="badge-icon">💼</span>
              <h3>Everything You Need to Succeed</h3>
            </div>
            <p>
              The KudiMall Seller Dashboard puts powerful business tools at your fingertips. Whether 
              you're managing a small boutique or scaling a high-volume operation, our dashboard adapts 
              to your needs. Focus on growing your business—we'll handle the technology.
            </p>
          </div>

          <div className="cta-section">
            <h2>Experience the Dashboard</h2>
            <p>See how easy it is to manage your online business with KudiMall</p>
            <div className="cta-buttons">
              <a href="/start-selling" className="btn-primary">Create Seller Account</a>
              <a href="/contact-us" className="btn-secondary">Schedule a Demo</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardPage;
