import React, { useState } from 'react';
import './home.css';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitStatus('loading');
    setTimeout(() => {
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general'
      });
    }, 2000);
  };

  return (
    <div className="home-container">
      <div className="content-wrapper">
        <h1 className="page-title">
          Contact Us
        </h1>
        <p className="page-subtitle">
          Get in touch with the LogiFlow team for support and inquiries.
        </p>

        <div className="contact-grid">
          {/* Contact Form */}
          <div>
            <h2 className="section-subtitle">
              Send us a Message
            </h2>

            <form onSubmit={handleSubmit} className="form-container">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Inquiry Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="general">General Inquiry</option>
                  <option value="support">Delivery Support</option>
                  <option value="business">Business Partnership</option>
                  <option value="driver">Driver Support</option>
                  <option value="technical">Technical Support</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Subject *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="form-textarea"
                />
              </div>

              <button
                type="submit"
                disabled={submitStatus === 'loading'}
                className={`btn btn-primary ${submitStatus === 'loading' ? 'status-loading' : ''}`}
              >
                {submitStatus === 'loading' ? 'Sending...' : 'Send Message'}
              </button>

              {submitStatus === 'success' && (
                <div className="status-success">
                  ✅ Thank you! We'll get back to you within 24 hours.
                </div>
              )}
            </form>
          </div>

          {/* Contact Info */}
          <div>
            <h2 className="section-subtitle">
              Get in Touch
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h3 className="section-subtitle">
                  📞 Customer Support
                </h3>
                <p style={{ marginBottom: '0.5rem', color: '#666' }}>
                  24/7 support for order tracking and delivery inquiries
                </p>
                <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                  +84 1900-1234
                </p>
              </div>

              <div>
                <h3 className="section-subtitle">
                  💼 Business Development
                </h3>
                <p style={{ marginBottom: '0.5rem', color: '#666' }}>
                  Partnership and enterprise solutions
                </p>
                <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>
                  business@logiflow.vn
                </p>
              </div>

              <div>
                <h3 className="section-subtitle">
                  🏢 Headquarters
                </h3>
                <p style={{ color: '#666', lineHeight: '1.6' }}>
                  123 Nguyen Trai Street<br/>
                  District 1, Ho Chi Minh City<br/>
                  Vietnam 70000
                </p>
              </div>

              <div>
                <h3 className="section-subtitle">
                  🕒 Business Hours
                </h3>
                <div style={{ color: '#666' }}>
                  <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p>Saturday: 9:00 AM - 5:00 PM</p>
                  <p>Sunday: Emergency support only</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Support */}
        <div className="support-box">
          <h2 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>Quick Support Options</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Check our resources for instant answers to common questions.
          </p>

          <div className="support-grid">
            <a href="/faq" className="support-link">
              📖 FAQ
            </a>
            <a href="/track" className="support-link">
              🔍 Track Package
            </a>
            <a href="/pricing" className="support-link">
              💰 Pricing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
