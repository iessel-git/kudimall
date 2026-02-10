import React from 'react';
import '../styles/SupportPage.css';

const StartSellingPage = () => {
  return (
    <div className="support-page">
      <div className="container">
        <div className="support-header">
          <h1>Start Selling on KudiMall</h1>
          <p>Turn your products into profits with our secure marketplace platform</p>
        </div>

        <div className="support-content">
          <section className="faq-section">
            <h2>Why Sell on KudiMall?</h2>
            <p style={{ fontSize: '16px', color: 'var(--lux-slate)', marginBottom: '30px', lineHeight: '1.8' }}>
              KudiMall offers a unique dual-channel selling approach: reach customers directly through 
              our marketplace and expand your audience through social commerce. Our escrow system 
              protects both you and your buyers, building trust that drives sales.
            </p>

            <div className="protection-grid">
              <div className="protection-card">
                <span className="protection-icon">🛡️</span>
                <h3>Seller Protection</h3>
                <p>
                  Escrow system ensures you receive payment once buyers confirm receipt. Protection 
                  from fraudulent chargebacks and disputes handled fairly by our support team.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">🌐</span>
                <h3>Dual-Channel Sales</h3>
                <p>
                  Sell through our marketplace AND share product links on social media. Reach 
                  customers wherever they browse—Instagram, Facebook, Twitter, and more.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">✅</span>
                <h3>Verified Seller Badge</h3>
                <p>
                  Earn trust with our verification badge. Complete our vetting process and display 
                  your verified status to attract more buyers and boost conversions.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">📊</span>
                <h3>Powerful Analytics</h3>
                <p>
                  Track sales performance, customer behavior, and social commerce metrics. Make 
                  data-driven decisions to grow your business.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">💰</span>
                <h3>Competitive Fees</h3>
                <p>
                  Transparent pricing with no hidden costs. Keep more of what you earn with our 
                  seller-friendly fee structure and fast payouts.
                </p>
              </div>

              <div className="protection-card">
                <span className="protection-icon">🎯</span>
                <h3>Marketing Tools</h3>
                <p>
                  Access promotional features, featured seller opportunities, and shareable product 
                  links optimized for social media engagement.
                </p>
              </div>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>Getting Started in 5 Steps</h2>
            
            <div className="process-steps">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Create Your Account</h3>
                <p>
                  Sign up with your email and create a seller profile. Choose your business name, 
                  describe what you sell, and set your store preferences. This takes just a few 
                  minutes to complete.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Complete Verification</h3>
                <p>
                  Submit identity documents, business information, and banking details for payouts. 
                  Our verification process typically takes 24-48 hours. Once approved, you'll receive 
                  your verified seller badge.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">3</div>
                <h3>List Your Products</h3>
                <p>
                  Add product listings with high-quality photos, detailed descriptions, accurate 
                  pricing, and shipping information. The better your listings, the more you'll sell. 
                  Use our listing guidelines for best results.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">4</div>
                <h3>Share on Social Media</h3>
                <p>
                  Generate shareable links for your products and post them on your social media 
                  channels. Drive traffic from Instagram, Facebook, Twitter, and other platforms 
                  directly to your KudiMall listings.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">5</div>
                <h3>Fulfill Orders & Get Paid</h3>
                <p>
                  When orders come in, ship promptly with tracking numbers. Once buyers confirm 
                  receipt and satisfaction, escrow releases payment to your account. Withdraw 
                  earnings on your schedule.
                </p>
              </div>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>Seller Requirements</h2>
            
            <div className="faq-item">
              <h3>Identity Verification</h3>
              <p>
                All sellers must verify their identity with government-issued ID. This builds buyer 
                trust and ensures marketplace security. We accept driver's licenses, passports, and 
                national ID cards from most countries.
              </p>
            </div>

            <div className="faq-item">
              <h3>Business Information</h3>
              <p>
                Provide your business details including business name, address, and business type 
                (individual, LLC, corporation, etc.). If you're selling as an individual, your 
                personal information serves as your business details.
              </p>
            </div>

            <div className="faq-item">
              <h3>Banking Details</h3>
              <p>
                Link a valid bank account for payouts. We support direct deposit to most banks 
                worldwide. Your banking information is encrypted and securely stored—we never 
                share it with third parties.
              </p>
            </div>

            <div className="faq-item">
              <h3>Product Standards</h3>
              <p>
                Products must comply with our listing policies. No counterfeit items, illegal goods, 
                or prohibited products. Accurate descriptions and honest representations are required. 
                Violations can result in listing removal or account suspension.
              </p>
            </div>

            <div className="faq-item">
              <h3>Shipping Commitment</h3>
              <p>
                Ship orders within your stated handling time (typically 1-3 business days). Provide 
                tracking information for all shipments. Buyers expect reliable fulfillment—consistent 
                shipping performance builds positive reviews.
              </p>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>Pricing & Fees</h2>
            
            <div className="faq-item">
              <h3>Commission Structure</h3>
              <p>
                KudiMall charges a competitive commission on completed sales. Standard rate is 10% 
                of the total transaction value (including item price and shipping). High-volume 
                sellers may qualify for reduced rates. No upfront listing fees or monthly charges.
              </p>
            </div>

            <div className="faq-item">
              <h3>Payment Processing</h3>
              <p>
                Payment processing fees (credit card, digital wallets) are included in our commission. 
                You don't pay separate payment gateway fees. The amount released from escrow to your 
                account already reflects all applicable fees.
              </p>
            </div>

            <div className="faq-item">
              <h3>Payout Schedule</h3>
              <p>
                Once a buyer confirms receipt and satisfaction, escrow holds payment for 3 business 
                days (cooling-off period), then automatically releases it to your account. You can 
                withdraw funds anytime after they're available, typically processed within 3-5 
                business days.
              </p>
            </div>

            <div className="faq-item">
              <h3>Fee Examples</h3>
              <p>
                <strong>Example 1:</strong> $50 item + $5 shipping = $55 total. Commission (10%) = 
                $5.50. You receive: $49.50<br/><br/>
                <strong>Example 2:</strong> $200 item + $15 shipping = $215 total. Commission (10%) = 
                $21.50. You receive: $193.50
              </p>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>Social Commerce Selling</h2>
            
            <div className="faq-item">
              <h3>How It Works</h3>
              <p>
                Every product you list gets a unique shareable link. Post these links on Instagram, 
                Facebook, Twitter, TikTok, Pinterest—wherever your audience hangs out. When someone 
                clicks and buys, the transaction happens through KudiMall with full escrow protection.
              </p>
            </div>

            <div className="faq-item">
              <h3>Track Social Performance</h3>
              <p>
                Your seller dashboard shows which social platforms drive the most traffic and sales. 
                See click-through rates, conversion rates, and revenue by platform. Optimize your 
                social strategy based on real data.
              </p>
            </div>

            <div className="faq-item">
              <h3>Best Practices</h3>
              <p>
                Use high-quality images in posts. Write compelling captions. Include clear calls-to-action. 
                Engage with comments and questions. Post consistently. The more active you are on social 
                media, the more traffic and sales you'll generate.
              </p>
            </div>

            <div className="faq-item">
              <h3>Influencer Partnerships</h3>
              <p>
                Partner with influencers to promote your products. They share your product links with 
                their followers, and you can track which influencer drives the most sales. Consider 
                offering special discount codes or affiliate arrangements for successful partnerships.
              </p>
            </div>
          </section>

          <section className="faq-section" style={{ marginTop: '40px' }}>
            <h2>Seller Success Tips</h2>
            
            <div className="faq-item">
              <h3>Professional Product Photos</h3>
              <p>
                Invest in quality photography. Use good lighting, multiple angles, and accurate colors. 
                Show scale and details. Photos are the most important factor in online sales—they're 
                your product presentation.
              </p>
            </div>

            <div className="faq-item">
              <h3>Detailed Descriptions</h3>
              <p>
                Write comprehensive product descriptions. Include dimensions, materials, features, and 
                benefits. Answer common questions proactively. Use keywords that buyers search for. 
                Clear descriptions reduce returns and disputes.
              </p>
            </div>

            <div className="faq-item">
              <h3>Competitive Pricing</h3>
              <p>
                Research competitor pricing for similar products. Price competitively while maintaining 
                healthy margins. Consider offering free shipping (build cost into price) or bundle deals. 
                Promotions and limited-time offers can boost sales.
              </p>
            </div>

            <div className="faq-item">
              <h3>Excellent Customer Service</h3>
              <p>
                Respond to buyer inquiries within 24 hours. Be professional and helpful. Resolve issues 
                proactively. Ship quickly with tracking. Follow up after delivery. Great service leads 
                to positive reviews, repeat customers, and higher search rankings.
              </p>
            </div>

            <div className="faq-item">
              <h3>Build Your Reputation</h3>
              <p>
                Your seller rating and reviews are crucial. Start with competitive prices and exceptional 
                service to earn your first positive reviews. Maintain consistency as you grow. High ratings 
                increase visibility in search results and buyer confidence.
              </p>
            </div>
          </section>

          <div className="trust-guarantee">
            <div className="guarantee-badge">
              <span className="badge-icon">🚀</span>
              <h3>Ready to Launch Your Store?</h3>
            </div>
            <p>
              Join thousands of successful sellers on KudiMall. Whether you're an established business 
              or starting your first online store, our platform provides everything you need to reach 
              customers, build trust, and grow your sales.
            </p>
          </div>

          <div className="cta-section">
            <h2>Start Selling Today</h2>
            <p>Create your seller account and list your first product in minutes</p>
            <div className="cta-buttons">
              <a href="/seller-application" className="btn-primary">Apply to Become a Seller</a>
              <a href="/contact-us" className="btn-secondary">Talk to Sales</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartSellingPage;
