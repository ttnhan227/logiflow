import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { Row, Col } from 'antd';
import './home.css';

const ServicesPage = () => {
  return (
    <div className="home-container">
      <div className="content-wrapper">
        <h1 className="page-title">
          Our Services
        </h1>
        <p className="page-subtitle" style={{ maxWidth: '800px', margin: '0 auto 3rem' }}>
          Comprehensive delivery and logistics solutions for individuals and businesses across Vietnam.
        </p>

        {/* Individual Services with Material-UI Cards */}
        <section style={{ marginBottom: '4rem' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              fontSize: '2.5rem',
              color: 'var(--text-color)',
              marginBottom: '2rem',
              textAlign: 'center'
            }}
          >
            For Individuals
          </motion.h2>

          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} sm={12} md={8}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                    <Box sx={{ fontSize: '3rem', mb: 2 }}>📦</Box>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ color: 'text.primary' }}>
                      Standard Delivery
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                      Affordable same-city delivery for documents and small packages.
                      Perfect for everyday shipping needs.
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1 }}>
                      From 25,000 VND
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      1-3 business days
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    border: '2px solid',
                    borderColor: 'warning.main',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)',
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      backgroundColor: 'warning.main',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      zIndex: 1
                    }}
                  >
                    MOST POPULAR
                  </Box>
                  <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                    <Box sx={{ fontSize: '3rem', mb: 2 }}>⚡</Box>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ color: 'text.primary' }}>
                      Express Delivery
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                      Fast same-day delivery for urgent documents and packages.
                      When speed matters most.
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1 }}>
                      From 50,000 VND
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Same day delivery
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                    <Box sx={{ fontSize: '3rem', mb: 2 }}>🛒</Box>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ color: 'text.primary' }}>
                      Inter-Province
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                      Nationwide shipping between cities like Hanoi, Da Nang, and HCMC.
                      Reliable transport across Vietnam.
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', mb: 1 }}>
                      From 100,000 VND
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      2-5 business days
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </section>

        {/* Business Services */}
        <section style={{ marginBottom: '4rem' }}>
          <h2 style={{
            fontSize: '2.5rem',
            color: 'var(--text-color)',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            For Businesses
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
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>E-commerce Shipping</h3>
              <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Complete shipping solutions for online businesses with inventory
                management and automated dispatch.
              </p>
              <Link to="/business" style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: 'var(--primary-color)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600'
              }}>
                Learn More
              </Link>
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
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Logistics Analytics</h3>
              <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Advanced reporting and analytics for delivery performance,
                cost optimization, and operations insight.
              </p>
              <Link to="/business" style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: 'var(--primary-color)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600'
              }}>
                Learn More
              </Link>
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
              <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Fleet Management</h3>
              <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                Professional fleet coordination and management for transportation
                companies with driver oversight and vehicle tracking.
              </p>
              <Link to="/business" style={{
                display: 'inline-block',
                padding: '0.75rem 1.5rem',
                background: 'var(--primary-color)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600'
              }}>
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Service Features */}
        <section style={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))',
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
            Why Choose LogiFlow Services?
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
              <p style={{ color: '#666' }}>Real-time location tracking for all deliveries</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Secure Transport</h4>
              <p style={{ color: '#666' }}>Fully insured and secure package handling</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📱</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Mobile Updates</h4>
              <p style={{ color: '#666' }}>Delivery status notifications via app</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-color)' }}>Flexible Options</h4>
              <p style={{ color: '#666' }}>Customizable delivery preferences</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <div style={{
          background: 'var(--primary-color)',
          color: 'white',
          padding: '3rem 1rem',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '1rem' }}>Ready to Ship with LogiFlow?</h2>
          <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
            Download our mobile app or contact us to get started with reliable delivery services.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/track" style={{
              padding: '1rem 2rem',
              background: 'white',
              color: 'var(--primary-color)',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Track Delivery
            </Link>
            <Link to="/contact" style={{
              padding: '1rem 2rem',
              background: 'transparent',
              color: 'white',
              border: '2px solid white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
