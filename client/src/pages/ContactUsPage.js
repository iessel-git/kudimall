import React, { useState } from 'react';
import '../styles/SupportPage.css';

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! Our support team will respond within 24 hours.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="support-page">
      <div className="container">
        <div className="support-header">
          <h1>Contact Us</h1>
          <p>Get in touch with our support team</p>
        </div>

        <div className="contact-layout">
          <div className="contact-info">
            <h2>How can we help?</h2>
            <p>
              Our dedicated support team is here to assist you with any questions 
              or concerns you may have about KudiMall.
            </p>

            <div className="contact-methods">
              <div className="contact-method">
                <span className="method-icon">📧</span>
                <div>
                  <h3>Email Support</h3>
                  <p>support@kudimall.com</p>
                  <small>Response time: 24 hours</small>
                </div>
              </div>

              <div className="contact-method">
                <span className="method-icon">💬</span>
                <div>
                  <h3>Live Chat</h3>
                  <p>Available 9 AM - 6 PM EST</p>
                  <small>Monday to Friday</small>
                </div>
              </div>

              <div className="contact-method">
                <span className="method-icon">📞</span>
                <div>
                  <h3>Phone Support</h3>
                  <p>1-800-KUDIMALL</p>
                  <small>9 AM - 6 PM EST</small>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form-section">
            <h2>Send us a message</h2>
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn-submit">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
