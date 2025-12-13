import React from 'react';
import { Link } from 'react-router-dom';

const PricingPage = () => {
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
          Transparent Pricing
        </h1>
        <p style={{
          textAlign: 'center',
          fontSize: '1.25rem',
          color: '#556',
          marginBottom: '3rem'
        }}>
          Fair, transparent pricing for all your delivery needs across Vietnam.
          No hidden fees, just reliable service.
        </p>

        {/* Individual Pricing */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{
            fontSize: '2.5rem',
            color: 'var(--text-color)',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            Individual Customers
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
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Standard Delivery</h3>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '1rem' }}>
                From 25,000 VND
              </div>
              <ul style={{
                textAlign: 'left',
                color: '#666',
                marginBottom: '1.5rem',
                paddingLeft: '1.5rem'
              }}>
                <li>Same-city deliveries</li>
                <li>Documents and small packages</li>
                <li>1-3 business days</li>
                <li>GPS tracking included</li>
                <li>Basic insurance coverage</li>
              </ul>
            </div>

            <div style={{
              padding: '2rem',
              border: '2px solid var(--accent)',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02))',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'var(--accent)',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                MOST POPULAR
              </div>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Express Same-Day</h3>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '1rem' }}>
                From 50,000 VND
              </div>
              <ul style={{
                textAlign: 'left',
                color: '#666',
                marginBottom: '1.5rem',
                paddingLeft: '1.5rem'
              }}>
                <li>Same-day delivery in select cities</li>
                <li>Urgent documents and packages</li>
                <li>Priority dispatching</li>
                <li>Real-time status updates</li>
                <li>Enhanced insurance</li>
              </ul>
            </div>

            <div style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              background: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚚</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Inter-Province</h3>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '1rem' }}>
                From 100,000 VND
              </div>
              <ul style={{
                textAlign: 'left',
                color: '#666',
                marginBottom: '1.5rem',
                paddingLeft: '1.5rem'
              }}>
                <li>Nationwide shipping between cities</li>
                <li>Hanoi, HCMC, Da Nang networks</li>
                <li>2-5 business days</li>
                <li>Dedicated logistics handling</li>
                <li>Full insurance coverage</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Additional Costs */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))',
          padding: '4rem 2rem',
          borderRadius: '12px',
          marginBottom: '4rem'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            color: 'var(--text-color)',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            Additional Service Fees
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '2rem',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Return Services</h4>
              <p style={{ color: '#666', marginBottom: '1rem' }}>Failed delivery returns</p>
              <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                Additional 50% of shipping cost
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏔️</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Remote Areas</h4>
              <p style={{ color: '#666', marginBottom: '1rem' }}>Difficult-to-reach locations</p>
              <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                +15,000 VND surcharge
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚖️</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Heavy Packages</h4>
              <p style={{ color: '#666', marginBottom: '1rem' }}>Over 30kg or special handling</p>
              <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                Weight-based pricing
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💎</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>High-Value Items</h4>
              <p style={{ color: '#666', marginBottom: '1rem' }}>Premium insurance options</p>
              <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--primary-color)' }}>
                0.5% of declared value
              </div>
            </div>
          </div>
        </section>

        {/* Business Pricing */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{
            textAlign: 'center',
            fontSize: '2.5rem',
            color: 'var(--text-color)',
            marginBottom: '3rem'
          }}>
            Volume Discounts for Businesses
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: '#f8fafc',
              borderRadius: '12px'
            }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Monthly Volume</h3>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)', marginBottom: '1rem' }}>
                100-500 deliveries
              </div>
              <div style={{ color: '#666', marginBottom: '1rem' }}>10-15% discount on standard rates</div>
              <div style={{ color: '#888', fontSize: '0.9rem' }}>Dedicated account manager included</div>
            </div>

            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: 'var(--primary-color)',
              color: 'white',
              borderRadius: '12px',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                background: 'var(--accent)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                POPULAR
              </div>
              <h3 style={{ marginBottom: '1rem' }}>High Volume</h3>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
                500-2000 deliveries
              </div>
              <div style={{ marginBottom: '1rem', opacity: 0.9 }}>20-25% discount on standard rates</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Priority dispatching + API access</div>
            </div>

            <div style={{
              padding: '2rem',
              textAlign: 'center',
              background: 'linear-gradient(135deg, var(--accent), var(--primary-color))',
              color: 'white',
              borderRadius: '12px'
            }}>
              <h3 style={{ marginBottom: '1rem' }}>Enterprise</h3>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
                2000+ deliveries
              </div>
              <div style={{ marginBottom: '1rem', opacity: 0.9 }}>Custom pricing + SLA guarantees</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>White-label solutions available</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link to="/business" style={{
              display: 'inline-block',
              padding: '1rem 2rem',
              background: 'var(--primary-color)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}>
              View Enterprise Solutions
            </Link>
          </div>
        </section>

        {/* Payment & Terms */}
        <section style={{
          background: 'var(--primary-color)',
          color: 'white',
          padding: '4rem 2rem',
          borderRadius: '12px',
          marginBottom: '4rem',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '2rem', fontSize: '2.5rem' }}>
            Payment Terms & Conditions
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            maxWidth: '1000px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💳</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Payment Methods</h4>
              <p>Cash on delivery, bank transfer, mobile payment, credit/debit cards</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📄</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Invoicing</h4>
              <p>Detailed receipts, tax invoices available, electronic invoicing options</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🗓️</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Billing Cycle</h4>
              <p>Individual shipments billed immediately, business accounts monthly</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Refunds</h4>
              <p>Fair refund policies for service failures, quick processing within 48 hours</p>
            </div>
          </div>
        </section>

        {/* Get a Quote CTA */}
        <div style={{
          background: 'linear-gradient(135deg, var(--accent), var(--primary-color))',
          color: 'white',
          padding: '4rem 2rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Get Accurate Pricing for Your Needs</h2>
          <p style={{
            marginBottom: '2rem',
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            Our pricing depends on package size, weight, distance, and service level.
            Contact our team for a personalized quote.
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
              Request Quote
            </Link>
            <Link to="/services" style={{
              padding: '1rem 2rem',
              background: 'transparent',
              color: 'white',
              border: '2px solid white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              View All Services
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
