import React from 'react';
import { Link } from 'react-router-dom';
import './home.css';

const AboutPage = () => {
  return (
    <div className="home-container">
      <div className="content-wrapper text-center">
        <h1 className="page-title">
          About LogiFlow
        </h1>
        <p className="page-subtitle" style={{ maxWidth: '800px', margin: '0 auto 2rem' }}>
          Vietnam's premier logistics and delivery platform, connecting customers with verified
          drivers for reliable transportation services across all regions.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="feature-section">
        <div className="card-grid text-center">
          <div className="card">
            <div className="card-icon">🎯</div>
            <h2 className="card-title">Our Mission</h2>
            <p className="body-text">
              To revolutionize logistics in Vietnam by providing reliable, technology-driven delivery
              services that connect local businesses with licensed, professional drivers.
            </p>
          </div>

          <div className="card">
            <div className="card-icon">👁️</div>
            <h2 className="card-title">Our Vision</h2>
            <p className="body-text">
              To be Vietnam's most trusted logistics platform, known for innovation, reliability, and
              creating opportunities for local transportation workers.
            </p>
          </div>
        </div>
      </div>

      {/* What We Do */}
      <div className="content-wrapper">
        <h2 className="section-title">
          What We Do
        </h2>

        <div className="card-grid">
          <div className="card">
            <div className="card-icon">🚚</div>
            <h3 className="card-title">
              Package Delivery
            </h3>
            <p className="body-text">
              Express document and package delivery services within cities and between provinces.
              From same-day delivery to scheduled shipments.
            </p>
          </div>

          <div className="card">
            <div className="card-icon">🏢</div>
            <h3 className="card-title">
              Business Logistics
            </h3>
            <p className="body-text">
              Comprehensive logistics management for businesses, including fleet coordination,
              analytics, and dedicated account management.
            </p>
          </div>

          <div className="card">
            <div className="card-icon">👨‍✈️</div>
            <h3 className="card-title">
              Driver Network
            </h3>
            <p className="body-text">
              Professional driver community with verified licenses, trained personnel, and
              commitment to quality service across all regions.
            </p>
          </div>
        </div>
      </div>

      {/* Coverage Areas */}
      <div className="coverage-section">
        <h2 className="cta-title">Serving All Vietnam Regions</h2>
        <div className="region-grid">
          <div className="region-card">
            <div className="region-emoji">🌆</div>
            <h3>Northern Vietnam</h3>
            <p>Hanoi, Hai Phong, Quang Ninh, and surrounding areas</p>
          </div>
          <div className="region-card">
            <div className="region-emoji">🏖️</div>
            <h3>Central Vietnam</h3>
            <p>Da Nang, Hue, Nha Trang, and coastal provinces</p>
          </div>
          <div className="region-card">
            <div className="region-emoji">🌴</div>
            <h3>Southern Vietnam</h3>
            <p>Ho Chi Minh City, Can Tho, Vung Tau, and Mekong Delta</p>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="content-wrapper">
        <h2 className="section-title">
          Why Choose LogiFlow?
        </h2>

        <div className="card-grid">
          <div className="text-center">
            <div className="card-icon">🔒</div>
            <h4 className="card-title">Secure & Verified</h4>
            <p className="body-text">All drivers are licensed and background-checked</p>
          </div>
          <div className="text-center">
            <div className="card-icon">📱</div>
            <h4 className="card-title">Mobile Apps</h4>
            <p className="body-text">Native Android app for customers and drivers</p>
          </div>
          <div className="text-center">
            <div className="card-icon">📊</div>
            <h4 className="card-title">Real-Time Tracking</h4>
            <p className="body-text">GPS tracking with delivery status updates</p>
          </div>
          <div className="text-center">
            <div className="card-icon">🏆</div>
            <h4 className="card-title">Reliable Service</h4>
            <p className="body-text">99% delivery success rate nationwide</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="cta-section">
        <h2 className="cta-title">Join Vietnam's Leading Logistics Network</h2>
        <p className="cta-description">
          Whether you're a customer needing delivery services or a driver looking to earn,
          LogiFlow connects you with opportunities.
        </p>
        <div className="btn-group">
          <Link to="/register/driver" className="btn btn-ghost">
            Join as Driver
          </Link>
          <Link to="/contact" className="btn btn-ghost">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
