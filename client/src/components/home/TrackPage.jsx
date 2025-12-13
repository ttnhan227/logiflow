import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './home.css';

const TrackPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number');
      return;
    }

    setLoading(true);
    setError('');
    setTrackingResult(null);

    // Simulate API call
    setTimeout(() => {
      // Mock tracking result for demo
      if (trackingNumber.toLowerCase().includes('logi')) {
        setTrackingResult({
          trackingNumber: trackingNumber,
          status: 'In Transit',
          location: 'Ho Chi Minh City',
          estimatedDelivery: '2025-12-10',
          statusHistory: [
            { date: '2025-12-08 14:30', status: 'Picked up from sender', location: 'Da Nang' },
            { date: '2025-12-08 16:45', status: 'In transit', location: 'Central Vietnam' },
            { date: '2025-12-09 09:15', status: 'Out for delivery', location: 'Ho Chi Minh City' }
          ]
        });
      } else {
        setError('Tracking number not found. Please check and try again.');
      }
      setLoading(false);
    }, 1500);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '#10b981';
      case 'out for delivery': return '#f59e0b';
      case 'in transit': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '✅';
      case 'out for delivery': return '🚚';
      case 'in transit': return '🚀';
      case 'picked up': return '📦';
      default: return '📋';
    }
  };

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
          Track Your Delivery
        </h1>
        <p style={{
          textAlign: 'center',
          fontSize: '1.25rem',
          color: '#556',
          marginBottom: '3rem'
        }}>
          Real-time tracking for all your LogiFlow shipments across Vietnam.
        </p>

        {/* Tracking Form */}
        <div style={{
          maxWidth: '600px',
          margin: '0 auto 4rem',
          padding: '2rem',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <form onSubmit={handleTrack} style={{ marginBottom: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="trackingNumber"
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  color: 'var(--text-color)'
                }}
              >
                Tracking Number
              </label>
              <input
                id="trackingNumber"
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter your tracking number (e.g., LOGI123456789)"
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary-color)'}
                onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                background: loading ? '#9ca3af' : 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '🔍 Searching...' : '🔍 Track Package'}
            </button>
          </form>

          {error && (
            <div style={{
              padding: '1rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#dc2626',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}
        </div>

        {/* Tracking Result */}
        {trackingResult && (
          <div style={{
            maxWidth: '800px',
            margin: '0 auto 4rem',
            padding: '2rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            {/* Status Overview */}
            <div style={{
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <h3 style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Tracking Number
                  </h3>
                  <p style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-color)' }}>
                    {trackingResult.trackingNumber}
                  </p>
                </div>

                <div>
                  <h3 style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Current Status
                  </h3>
                  <p style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: getStatusColor(trackingResult.status)
                  }}>
                    {getStatusIcon(trackingResult.status)} {trackingResult.status}
                  </p>
                </div>

                <div>
                  <h3 style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Current Location
                  </h3>
                  <p style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-color)' }}>
                    {trackingResult.location}
                  </p>
                </div>

                <div>
                  <h3 style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Est. Delivery
                  </h3>
                  <p style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--accent)' }}>
                    {new Date(trackingResult.estimatedDelivery).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div>
              <h3 style={{
                marginBottom: '1.5rem',
                fontSize: '1.5rem',
                color: 'var(--text-color)'
              }}>
                Shipping Timeline
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {trackingResult.statusHistory.map((statusUpdate, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    position: 'relative'
                  }}>
                    {/* Timeline line */}
                    {index < trackingResult.statusHistory.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '2.5rem',
                        width: '2px',
                        height: 'calc(100% + 2rem)',
                        backgroundColor: '#e5e7eb'
                      }} />
                    )}

                    {/* Status icon */}
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      backgroundColor: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      📍
                    </div>

                    {/* Status details */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'var(--text-color)',
                        marginBottom: '0.25rem'
                      }}>
                        {statusUpdate.status}
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#6b7280',
                        marginBottom: '0.25rem'
                      }}>
                        {statusUpdate.location}
                      </div>
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#9ca3af'
                      }}>
                        {new Date(statusUpdate.date).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div style={{
          maxWidth: '600px',
          margin: '4rem auto 0',
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>Need Help?</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Can't find your tracking number or need assistance with your shipment?
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--primary-color)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Contact Support
            </Link>
            <Link to="/faq" style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: 'var(--primary-color)',
              border: '2px solid var(--primary-color)',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Check FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackPage;
