import React from 'react';
import { Link } from 'react-router-dom';

const BusinessPage = () => {
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
            Enterprise Solutions
          </h1>
          <p style={{
            fontSize: '1.25rem',
            color: '#556',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            Powerful logistics management tools designed for businesses and organizations
            that need reliable, scalable delivery solutions.
          </p>
        </div>

        {/* Enterprise Features */}
        <section style={{ marginBottom: '4rem' }}>
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
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>
                Dedicated Account Management
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Personalized service with dedicated account representatives and priority support
                for your business needs. Tailored solutions for large operations.
              </p>
            </div>

            <div style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>
                API Integration
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Seamlessly connect with your existing systems. Integrate with WMS, ERP,
                e-commerce platforms, and custom applications.
              </p>
            </div>

            <div style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>
                Advanced Analytics
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Comprehensive reporting and insights on delivery performance,
                costs, and operational efficiency across your entire network.
              </p>
            </div>

            <div style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚛</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>
                Fleet Management
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Professional fleet coordination with dedicated drivers, vehicles,
                and management tools for your transportation operations.
              </p>
            </div>

            <div style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>
                Express Services
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Priority delivery services with guaranteed timeframes for critical
                business shipments and time-sensitive deliveries.
              </p>
            </div>

            <div style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>
                Premium Insurance
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Extended coverage options and priority claims processing for
                high-value shipments and sensitive cargo.
              </p>
            </div>
          </div>
        </section>

        {/* Industry Solutions */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            color: 'var(--text-color)',
            marginBottom: '3rem'
          }}>
            Industry-Specific Solutions
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              padding: '2rem',
              border: '2px solid #3b82f6',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛒</div>
              <h3 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>
                E-commerce Logistics
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Complete fulfillment solutions for online businesses. API integration with
                popular e-commerce platforms, automated order processing, and real-time
                inventory synchronization.
              </p>
              <div style={{ marginTop: '1rem', color: 'var(--primary-color)', fontWeight: '600' }}>
                Perfect for online stores, marketplaces, and retailers
              </div>
            </div>

            <div style={{
              padding: '2rem',
              border: '2px solid #10b981',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02))'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏭</div>
              <h3 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>
                Manufacturing & Distribution
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Streamlined logistics for manufacturers and distributors. Route optimization
                for last-mile delivery, warehouse management integration, and specialized
                handling for industrial goods.
              </p>
              <div style={{ marginTop: '1rem', color: 'var(--accent)', fontWeight: '600' }}>
                Specialized for B2B and industrial supply chains
              </div>
            </div>

            <div style={{
              padding: '2rem',
              border: '2px solid #f59e0b',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02))'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🏪</div>
              <h3 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>
                Food & Perishables
              </h3>
              <p style={{ color: '#666', lineHeight: '1.6' }}>
                Temperature-controlled delivery services for restaurants, food delivery,
                and perishable goods. Specialized vehicles with climate control and
                priority routing for time-sensitive deliveries.
              </p>
              <div style={{ marginTop: '1rem', color: '#f59e0b', fontWeight: '600' }}>
                Certified cold-chain and food-safe delivery
              </div>
            </div>
          </div>
        </section>

        {/* SLA Commitments */}
        <section style={{
          background: 'var(--primary-color)',
          color: 'white',
          padding: '4rem 2rem',
          borderRadius: '12px',
          marginBottom: '4rem',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>
            Enterprise SLA Commitments
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>99.5%</div>
              <div>On-Time Delivery Rate</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>15 min</div>
              <div>Average Response Time</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>24/7</div>
              <div>Dedicated Support</div>
            </div>
            <div>
              <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>100%</div>
              <div>Insurance Coverage</div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            color: 'var(--text-color)',
            marginBottom: '3rem'
          }}>
            Enterprise Pricing Tiers
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
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <h3 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>Starter</h3>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '1rem' }}>
                Contact Us
              </div>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Up to 1,000 deliveries/month with basic enterprise features
              </p>
              <div style={{ color: '#999', fontSize: '0.9rem' }}>
                Volume discounts available
              </div>
            </div>

            <div style={{
              padding: '2rem',
              border: '2px solid var(--primary-color)',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))',
              textAlign: 'center',
              transform: 'scale(1.05)'
            }}>
              <div style={{ color: 'var(--primary-color)', marginBottom: '1rem', fontWeight: '600' }}>MOST POPULAR</div>
              <h3 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>Professional</h3>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '1rem' }}>
                Contact Us
              </div>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                1,001 - 10,000 deliveries/month with full enterprise suite
              </p>
              <div style={{ color: '#999', fontSize: '0.9rem' }}>
                API integration + analytics included
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
              <h3 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>Enterprise</h3>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '1rem' }}>
                Contact Us
              </div>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                10,000+ deliveries/month with custom solutions
              </p>
              <div style={{ color: '#999', fontSize: '0.9rem' }}>
                White-label & custom development
              </div>
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
          <h2 style={{ marginBottom: '1rem' }}>Ready to Scale Your Logistics?</h2>
          <p style={{
            marginBottom: '2rem',
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            Join Vietnam's leading businesses that trust LogiFlow for their enterprise logistics needs.
            Contact our business development team to discuss your specific requirements.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" style={{
              padding: '1rem 2rem',
              background: 'white',
              color: 'var(--primary-color)',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Contact Sales Team
            </Link>
            <a href="mailto:business@logiflow.vn" style={{
              padding: '1rem 2rem',
              background: 'transparent',
              color: 'white',
              border: '2px solid white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Email Business Team
            </a>
            <a href="tel:+8419001234" style={{
              padding: '1rem 2rem',
              background: 'var(--accent)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Call +84 1900-1234
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessPage;
