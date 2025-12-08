import React from 'react';
import { Link } from 'react-router-dom';

const DriversPage = () => {
  return (
    <div className="home-container">
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '4rem'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            color: 'var(--text-color)',
            marginBottom: '1rem',
            background: 'linear-gradient(90deg, var(--primary-color), var(--accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Drive with LogiFlow
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#556',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Join Vietnam's largest driver network and earn more with flexible hours,
            modern technology, and reliable platforms.
          </p>
        </div>

        {/* Why Drive with Us */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            color: 'var(--text-color)',
            marginBottom: '3rem'
          }}>
            Why Choose LogiFlow Drivers?
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.1)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Competitive Earnings</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Earn 150,000 - 800,000 VND daily based on your hours, vehicle type, and performance.
                Weekly payments directly to your account.
              </p>
            </div>

            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02))',
              borderRadius: '12px',
              border: '1px solid rgba(16, 185, 129, 0.1)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗓️</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Flexible Schedule</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Work when you want, as much as you want. Pick up deliveries that fit your schedule,
                from part-time to full-time opportunities.
              </p>
            </div>

            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02))',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.1)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Smart Technology</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Modern driver app with GPS navigation, real-time dispatch, and automated route optimization.
                No more paper manifests or confusing directions.
              </p>
            </div>

            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(139, 92, 246, 0.02))',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Complete Support</h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                24/7 driver support, accident coverage, training programs, and performance bonuses.
                We invest in your success as a driver.
              </p>
            </div>
          </div>
        </section>

        {/* Driver Opportunities */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            color: 'var(--text-color)',
            marginBottom: '3rem'
          }}>
            Driving Opportunities
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏍️</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Motorbike Courier</h3>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1rem' }}>
                Perfect for navigating busy city traffic. Deliver documents and small packages
                quickly and efficiently across urban areas.
              </p>
              <div style={{ color: 'var(--primary-color)', fontWeight: '600' }}>
                Earnings: 150,000 - 400,000 VND/day
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                Requires: Vietnamese motorcycle license (A1/A2)
              </div>
            </div>

            <div style={{
              padding: '2rem',
              border: '2px solid var(--primary-color)',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚐</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Van Delivery Driver</h3>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1rem' }}>
                Great earning potential with larger capacity for commercial deliveries and
                business shipments across provinces.
              </p>
              <div style={{ color: 'var(--primary-color)', fontWeight: '600' }}>
                Earnings: 250,000 - 600,000 VND/day
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                Requires: Vietnamese car license (B1 minimum)
              </div>
            </div>

            <div style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚚</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Truck Driver</h3>
              <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '1rem' }}>
                High-demand specialty driving with premium compensation for heavy cargo
                and inter-province transport services.
              </p>
              <div style={{ color: 'var(--primary-color)', fontWeight: '600' }}>
                Earnings: 300,000 - 800,000 VND/day
              </div>
              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                Requires: Vietnamese truck license (C or higher)
              </div>
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))',
          padding: '4rem 2rem',
          borderRadius: '12px',
          marginBottom: '4rem'
        }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            color: 'var(--text-color)',
            marginBottom: '3rem'
          }}>
            Driver Requirements
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🆔</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Valid License</h4>
              <p style={{ color: '#666' }}>Current Vietnamese driver's license appropriate for your vehicle type</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎂</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Age 18+</h4>
              <p style={{ color: '#666' }}>Must be at least 18 years old with valid identification</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>☎️</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Smartphone</h4>
              <p style={{ color: '#666' }}>Android smartphone for using our driver application</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚗</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Own Vehicle</h4>
              <p style={{ color: '#666' }}>Well-maintained vehicle that meets our safety standards</p>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section style={{
          background: 'var(--primary-color)',
          color: 'white',
          padding: '4rem 2rem',
          borderRadius: '12px',
          marginBottom: '4rem',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>
            Driver Success Stories
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div style={{
              padding: '2rem',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚗</div>
              <h4 style={{ marginBottom: '1rem' }}>Minh from Hanoi</h4>
              <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                "Started with a 50cc motorbike in 2023. Now driving a van and earn
                400,000 VND daily. Technology makes everything so much easier!"
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
                ⭐⭐⭐⭐⭐ Top 10% Performer
              </div>
            </div>

            <div style={{
              padding: '2rem',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏍️</div>
              <h4 style={{ marginBottom: '1rem' }}>Lan from Ho Chi Minh City</h4>
              <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                "Perfect flexibility for my university schedule. Part-time driving gives
                me extra income without interfering with classes."
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
                ⭐⭐⭐⭐⭐ 2 Years with LogiFlow
              </div>
            </div>

            <div style={{
              padding: '2rem',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '12px'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚐</div>
              <h4 style={{ marginBottom: '1rem' }}>Tuấn from Da Nang</h4>
              <p style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
                "Full-time driver supporting my family. Reliable income, great support,
                and the GPS system saves me hours each week."
              </p>
              <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>
                ⭐⭐⭐⭐⭐ 200+ Successful Deliveries
              </div>
            </div>
          </div>
        </section>

        {/* Application Process */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            color: 'var(--text-color)',
            marginBottom: '3rem'
          }}>
            How to Get Started
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--primary-color)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: '0 auto 1rem'
              }}>
                1
              </div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Apply Online</h4>
              <p style={{ color: '#666' }}>Fill out our driver application form with your information</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--primary-color)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: '0 auto 1rem'
              }}>
                2
              </div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Verify Documents</h4>
              <p style={{ color: '#666' }}>Submit license copies and undergo background verification</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--primary-color)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                margin: '0 auto 1rem'
              }}>
                3
              </div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Training & Vehicle Check</h4>
              <p style={{ color: '#666' }}>Complete orientation and vehicle safety inspection</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--accent)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                margin: '0 auto 1rem'
              }}>
                🚀
              </div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Start Delivering</h4>
              <p style={{ color: '#666' }}>Download app and begin receiving delivery requests</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div style={{
          background: 'linear-gradient(135deg, var(--accent), var(--primary-color))',
          color: 'white',
          padding: '4rem 2rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Ready to Start Driving?</h2>
          <p style={{
            marginBottom: '2rem',
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            Join thousands of successful drivers earning with LogiFlow.
            Apply now and get approved in as little as 48 hours.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register/driver" style={{
              padding: '1rem 2rem',
              background: 'white',
              color: 'var(--primary-color)',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>
              Apply Now 🚗
            </Link>
            <a href="tel:+8419001234" style={{
              padding: '1rem 2rem',
              background: 'transparent',
              color: 'white',
              border: '2px solid white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>
              Call Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriversPage;
