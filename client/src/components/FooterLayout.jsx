import React from 'react';
import './layout.css';

const FooterLayout = ({ showFooter }) => {
  return (
    <footer className={`footer ${showFooter ? 'visible' : ''}`}>
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-logo">
            <img src="/logiflow-smarter_logistics-seamless_flow.png" alt="LogiFlow - Smarter Logistics. Seamless Flow." className="footer-logo-img" />
          </div>
          <p className="footer-tagline">Smarter logistics, seamless flow for your business.</p>
        </div>
        <div className="footer-section">
          <h3 className="footer-heading">Services</h3>
          <ul className="footer-links">
            <li><a href="/services">Delivery Services</a></li>
            <li><a href="/track">Track Package</a></li>
            <li><a href="/coverage">Coverage Map</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3 className="footer-heading">Company</h3>
          <ul className="footer-links">
            <li><a href="/about">About Us</a></li>
            <li><a href="/fleet">Our Fleet</a></li>
            <li><a href="/business">For Businesses</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3 className="footer-heading">Support</h3>
          <ul className="footer-links">
            <li><a href="/faq">FAQ</a></li>
            <li><a href="/drivers">Join as Driver</a></li>
            <li><a href="/mobile-app">Mobile App</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h3 className="footer-heading">Contact</h3>
          <div className="footer-contact">
            <p>📧 support@logiflow.com</p>
            <p>📞 +1 (555) 123-4567</p>
            <p>📍 123 Logistics St, City, State</p>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 LogiFlow - Smarter Logistics. Seamless Flow. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="/privacy">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default FooterLayout;
