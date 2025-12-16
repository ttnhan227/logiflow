import React from 'react';
import { Link } from 'react-router-dom';
import './home.css';

const FleetPage = () => {
  return (
    <div className="home-container">
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '700',
          color: 'var(--text-color)',
          marginBottom: '1rem',
          textAlign: 'center',
          background: 'linear-gradient(90deg, var(--primary-color), var(--accent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Our Fleet
        </h1>
        <p style={{
          textAlign: 'center',
          fontSize: '1.25rem',
          color: '#556',
          marginBottom: '3rem'
        }}>
          Professional vehicles and equipment serving all your transportation needs across Vietnam.
        </p>

        {/* Fleet Types */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '4rem'
        }}>
          <div style={{
            padding: '2rem',
            border: '2px solid var(--primary-color)',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚐</div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Vans & Trucks</h3>
            <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Professional delivery vehicles for larger shipments and business logistics.
              Perfect for inter-province and commercial deliveries.
            </p>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)' }}>
              Capacity: 500kg - 2 tons
            </div>
          </div>

          <div style={{
            padding: '2rem',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            background: 'white',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📦</div>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Container Services</h3>
            <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              Heavy cargo and containerized shipping for industrial and commercial needs.
              Specialized handling for oversized items.
            </p>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary-color)' }}>
              Capacity: 5+ tons
            </div>
          </div>
        </div>

        {/* Technology Features */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02))',
          padding: '4rem 1rem',
          borderRadius: '12px',
          marginBottom: '4rem'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            color: 'var(--text-color)',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            Fleet Technology
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>GPS Tracking</h4>
              <p style={{ color: '#666' }}>Real-time location monitoring and route optimization</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Maintenance</h4>
              <p style={{ color: '#666' }}>Regular vehicle inspections and preventive maintenance</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>♻️</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Eco-Friendly</h4>
              <p style={{ color: '#666' }}>Fuel-efficient vehicles and low-emission options</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Insurance</h4>
              <p style={{ color: '#666' }}>Comprehensive coverage for cargo and vehicles</p>
            </div>
          </div>
        </section>

        {/* Fleet Stats */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{
            fontSize: '2.5rem',
            color: 'var(--text-color)',
            marginBottom: '3rem',
            textAlign: 'center'
          }}>
            Fleet Overview
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚐</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>80+</div>
              <div style={{ color: '#666' }}>Vans & Trucks</div>
            </div>
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>👨‍✈️</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>150+</div>
              <div style={{ color: '#666' }}>Licensed Drivers</div>
            </div>
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🌍</div>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>63</div>
              <div style={{ color: '#666' }}>Cities Covered</div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div style={{
          background: 'var(--primary-color)',
          color: 'white',
          padding: '3rem 1rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Partner with LogiFlow Fleet</h2>
          <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
            Business customers can access our full fleet services with dedicated account management.
          </p>
          <Link to="/business" style={{
            padding: '1rem 2rem',
            background: 'white',
            color: 'var(--primary-color)',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600'
          }}>
            Learn More About Business Services
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FleetPage;
