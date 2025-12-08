import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMapMarkedAlt, FaUserCheck, FaBuilding, FaChartLine } from 'react-icons/fa';
import './home.css';

const HomePage = () => {
  return (
    <div className="home-container">
      {/* Background Elements */}
      <div className="float-animation" style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '60px',
        height: '60px',
        background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.2))',
        borderRadius: '50%'
      }} />
      <div className="float-animation" style={{
        position: 'absolute',
        top: '30%',
        right: '15%',
        width: '40px',
        height: '40px',
        background: 'linear-gradient(45deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.2))',
        borderRadius: '8px',
        transform: 'rotate(45deg)',
        animationDelay: '2s'
      }} />
      <div className="float-animation" style={{
        position: 'absolute',
        bottom: '20%',
        left: '20%',
        width: '80px',
        height: '80px',
        background: 'linear-gradient(45deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.2))',
        borderRadius: '20px',
        animationDelay: '4s'
      }} />

      {/* Hero Section with Motion Animations */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="text-center"
        style={{ padding: '3rem 1rem' }}
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="page-title"
        >
          Smarter Logistics.<br />Seamless Flow.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="page-subtitle"
          style={{ maxWidth: '600px', margin: '0 auto 2rem' }}
        >
          LogiFlow connects customers with reliable delivery services through GPS tracking,
          automated dispatch, and comprehensive logistics management across Vietnam.
        </motion.p>

        {/* Key Features Grid */}
        <div className="feature-grid">
          <div className="feature-card">
            <FaMapMarkedAlt size={48} color="#3b82f6" className="feature-icon" />
            <h3 className="feature-title">Real-Time Tracking</h3>
            <p className="feature-description">Track deliveries live with GPS integration and instant notifications</p>
          </div>

          <div className="feature-card">
            <FaUserCheck size={48} color="#10b981" className="feature-icon" />
            <h3 className="feature-title">Verified Drivers</h3>
            <p className="feature-description">Licensed and trained delivery professionals in your area</p>
          </div>

          <div className="feature-card">
            <FaBuilding size={48} color="#f59e0b" className="feature-icon" />
            <h3 className="feature-title">Business Solutions</h3>
            <p className="feature-description">Enterprise logistics management and fleet oversight</p>
          </div>

          <div className="feature-card">
            <FaChartLine size={48} color="#8b5cf6" className="feature-icon" />
            <h3 className="feature-title">Analytics & Reporting</h3>
            <p className="feature-description">Performance insights and delivery analytics</p>
          </div>
        </div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="btn-group"
          style={{ marginBottom: '3rem' }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/track" className="btn btn-primary">
              Track Delivery 🔍
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/drivers" className="btn btn-outline">
              Become a Driver 🚗
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Coverage Overview */}
      <div className="coverage-section">
        <h2 className="cta-title">Vietnam Coverage</h2>
        <div className="region-grid">
          <div className="region-card">
            <div className="region-emoji">🌆</div>
            <h3>Northern Region</h3>
            <p>Hanoi · Hai Phong · Quang Ninh</p>
          </div>
          <div className="region-card">
            <div className="region-emoji">🏖️</div>
            <h3>Central Region</h3>
            <p>Da Nang · Hue · Nha Trang</p>
          </div>
          <div className="region-card">
            <div className="region-emoji">🌴</div>
            <h3>Southern Region</h3>
            <p>Ho Chi Minh · Can Tho · Vung Tau</p>
          </div>
        </div>
        <Link to="/coverage" className="btn btn-ghost" style={{ marginTop: '2rem' }}>
          View Coverage Map 🗺️
        </Link>
      </div>

      {/* Mobile App Section */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="app-showcase"
      >
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="section-title"
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            📱 LogiFlow Mobile App
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut"
              }}
              style={{ display: 'inline-block' }}
            >
              🚛
            </motion.div>
          </span>
        </motion.h2>

        <div className="app-features">
          {/* Phone mockup */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              style={{
                display: 'inline-block',
                fontSize: '8rem',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.1))'
              }}
            >
              📱
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              viewport={{ once: true }}
              style={{
                marginTop: '1rem',
                fontSize: '1.2rem',
                color: '#666',
                fontStyle: 'italic'
              }}
            >
              Available on Google Play Store
            </motion.div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <h3 className="section-subtitle">
                Track Deliveries on the Go
              </h3>
              <p className="section-description">
                Download our mobile app for real-time delivery tracking, instant notifications,
                and easy order management from anywhere in Vietnam.
              </p>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              viewport={{ once: true }}
              style={{
                listStyle: 'none',
                padding: 0,
                marginBottom: '2rem'
              }}
            >
              {[
                { icon: '📍', text: 'GPS tracking in real-time' },
                { icon: '🔔', text: 'Instant delivery notifications' },
                { icon: '⭐', text: 'Rate and review drivers' },
                { icon: '💳', text: 'Secure payment integration' },
                { icon: '🚚', text: 'Driver communication tools' }
              ].map((feature, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + (index * 0.1) }}
                  viewport={{ once: true }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    marginBottom: '1rem',
                    color: 'var(--text-color)'
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{feature.icon}</span>
                  <span>{feature.text}</span>
                </motion.li>
              ))}
            </motion.ul>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/mobile-app"
                className="btn btn-primary"
                style={{ boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}
              >
                📥 Check it out
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Call to Action */}
      <div className="cta-section">
        <h2 className="cta-title">Ready to Experience Smart Logistics?</h2>
        <p className="cta-description">
          Join thousands of customers who trust LogiFlow for reliable delivery services.
        </p>
        <p style={{ marginBottom: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
          📱 Also available in our mobile app for Android! Download for enhanced tracking on the go.
        </p>
        <div className="btn-group">
          <Link to="/services" className="btn btn-primary">
            Explore Services
          </Link>
          <Link to="/contact" className="btn btn-ghost">
            Contact Us
          </Link>
          <Link to="/business" className="btn btn-primary">
            Business Solutions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
