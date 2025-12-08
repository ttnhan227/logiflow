import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, Typography, Button, Box, Grid, Paper } from '@mui/material';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  StarOutlined,
  DownloadOutlined,
  PhoneOutlined,
  TruckOutlined,
  BellOutlined,
  CreditCardOutlined,
  MessageOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import './home.css';

const MobileAppPage = () => {
  const features = [
    {
      icon: <EnvironmentOutlined style={{ fontSize: '2rem', color: '#3b82f6' }} />,
      title: 'Live GPS Tracking',
      description: 'Track your deliveries in real-time with precise GPS location updates'
    },
    {
      icon: <BellOutlined style={{ fontSize: '2rem', color: '#10b981' }} />,
      title: 'Smart Notifications',
      description: 'Instant push notifications for all delivery status changes'
    },
    {
      icon: <StarOutlined style={{ fontSize: '2rem', color: '#f59e0b' }} />,
      title: 'Driver Ratings',
      description: 'Rate and review delivery drivers for quality assurance'
    },
    {
      icon: <CreditCardOutlined style={{ fontSize: '2rem', color: '#8b5cf6' }} />,
      title: 'Secure Payments',
      description: 'Multiple payment options with bank-grade security'
    },
    {
      icon: <MessageOutlined style={{ fontSize: '2rem', color: '#ef4444' }} />,
      title: 'Direct Communication',
      description: 'Chat directly with drivers and customer support'
    },
    {
      icon: <TruckOutlined style={{ fontSize: '2rem', color: '#06b6d4' }} />,
      title: 'Fleet Overview',
      description: 'Comprehensive delivery history and fleet management'
    }
  ];

  const screenshots = [
    { emoji: '📱', label: 'Dashboard', desc: 'Overview of active deliveries' },
    { emoji: '📦', label: 'Tracking', desc: 'Real-time package monitoring' },
    { emoji: '💬', label: 'Chat', desc: 'Direct driver communication' },
    { emoji: '⭐', label: 'Reviews', desc: 'Rate your delivery experience' }
  ];

  return (
    <div className="home-container">
      {/* Background Elements */}
      <div className="float-animation" style={{
        position: 'absolute',
        top: '15%',
        left: '5%',
        width: '80px',
        height: '80px',
        background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.2))',
        borderRadius: '50%',
        animationDelay: '2s'
      }} />
      <div className="float-animation" style={{
        position: 'absolute',
        top: '60%',
        right: '10%',
        width: '60px',
        height: '60px',
        background: 'linear-gradient(45deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.2))',
        borderRadius: '20px',
        animationDelay: '4s'
      }} />
      <div className="float-animation" style={{
        position: 'absolute',
        top: '80%',
        left: '15%',
        width: '40px',
        height: '40px',
        background: 'linear-gradient(45deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.2))',
        borderRadius: '8px',
        transform: 'rotate(45deg)'
      }} />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="hero-section"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          style={{ marginBottom: '1rem' }}
        >
          <PhoneOutlined style={{ fontSize: '5rem', color: 'white' }} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          style={{
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '1rem'
          }}
        >
          LogiFlow Mobile App
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{
            fontSize: '1.3rem',
            marginBottom: '2rem',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          Take your logistics experience to the next level with our powerful mobile app.
          Track deliveries, communicate with drivers, and manage your shipments on the go.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<DownloadOutlined />}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid white',
                '&:hover': {
                  backgroundColor: 'white',
                  color: 'var(--primary-color)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                fontSize: '1.1rem',
                fontWeight: '600',
                textTransform: 'none'
              }}
            >
              Download for Android
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outlined"
              size="large"
              startIcon={<PlayCircleOutlined />}
              sx={{
                py: 1.5,
                px: 4,
                borderRadius: '12px',
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderColor: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                fontSize: '1.1rem',
                fontWeight: '600',
                textTransform: 'none'
              }}
            >
              Watch Demo Video
            </Button>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Screenshot Showcase */}
      <section style={{ padding: '4rem 1rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            style={{
              textAlign: 'center',
              fontSize: '2.5rem',
              marginBottom: '3rem',
              color: 'var(--text-color)'
            }}
          >
            App Preview
          </motion.h2>

          <Grid container spacing={4} justifyContent="center">
            {screenshots.map((screenshot, index) => (
              <Grid item xs={6} sm={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      textAlign: 'center',
                      p: 2,
                      height: '100%',
                      borderRadius: '16px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <CardContent>
                      <motion.div
                        animate={{
                          rotate: index % 2 === 0 ? [-5, 5, -5] : [5, -5, 5],
                          scale: [1, 1.05, 1]
                        }}
                        transition={{
                          duration: 4 + index,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        style={{
                          fontSize: '4rem',
                          marginBottom: '1rem',
                          display: 'inline-block'
                        }}
                      >
                        {screenshot.emoji}
                      </motion.div>
                      <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                        {screenshot.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {screenshot.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            style={{
              textAlign: 'center',
              fontSize: '2.5rem',
              marginBottom: '3rem',
              color: 'var(--text-color)'
            }}
          >
            Powerful Features
          </motion.h2>

          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      p: 3,
                      borderRadius: '12px',
                      border: '1px solid rgba(59, 130, 246, 0.1)',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                        borderColor: 'var(--primary-color)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', height: '100%' }}>
                      <div style={{ marginBottom: '1.5rem' }}>
                        {feature.icon}
                      </div>
                      <Typography variant="h6" component="h3" gutterBottom sx={{ color: 'text.primary' }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                        {feature.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </div>
      </section>

      {/* Download Section */}
      <section style={{
        background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--accent) 100%)',
        color: 'white',
        padding: '4rem 1rem',
        textAlign: 'center'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{ marginBottom: '2rem' }}
          >
            <PhoneOutlined style={{ fontSize: '6rem', color: 'white' }} />
          </motion.div>

          <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: '700' }}>
            Ready to Get Started?
          </Typography>

          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Download LogiFlow now and transform your logistics experience
          </Typography>

          {/* Ratings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem',
              flexWrap: 'wrap'
            }}
          >
            {[...Array(5)].map((_, i) => (
              <StarOutlined key={i} style={{ color: '#ffd700', fontSize: '1.5rem' }} />
            ))}
            <span style={{ marginLeft: '0.5rem' }}>4.8 ★ (10,000+ downloads)</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<DownloadOutlined />}
              sx={{
                py: 2,
                px: 6,
                borderRadius: '12px',
                backgroundColor: 'white',
                color: 'var(--primary-color)',
                fontSize: '1.2rem',
                fontWeight: '700',
                '&:hover': {
                  backgroundColor: '#f8fafc',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.3)'
                },
                textTransform: 'none'
              }}
            >
              Download LogiFlow App
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '4rem 1rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            style={{
              textAlign: 'center',
              fontSize: '2.5rem',
              marginBottom: '3rem',
              color: 'var(--text-color)'
            }}
          >
            Mobile App FAQ
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Paper
              sx={{
                p: 3,
                mb: 2,
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                <CheckCircleOutlined style={{ color: '#10b981', marginRight: '8px' }} />
                Is the app free to download?
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Yes! LogiFlow mobile app is completely free to download and use. Delivery fees apply only when using our services.
              </Typography>
            </Paper>

            <Paper
              sx={{
                p: 3,
                mb: 2,
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                <CheckCircleOutlined style={{ color: '#10b981', marginRight: '8px' }} />
                What features are available?
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Track deliveries, communicate with drivers, view delivery history, rate drivers, and manage payment methods.
              </Typography>
            </Paper>

            <Paper
              sx={{
                p: 3,
                mb: 2,
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.1)'
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
                <CheckCircleOutlined style={{ color: '#10b981', marginRight: '8px' }} />
                Is my data secure?
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Absolutely. All data is encrypted and we follow strict privacy protocols to protect your information.
              </Typography>
            </Paper>
          </motion.div>
        </div>
      </section>

      {/* Navigation Footer */}
      <section style={{
        background: '#f8fafc',
        padding: '2rem 1rem',
        textAlign: 'center',
        borderTop: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap'
        }}>
          <Link
            to="/"
            style={{
              color: 'var(--primary-color)',
              textDecoration: 'none',
              fontWeight: '600',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            ← Back to Home
          </Link>
          <Link
            to="/contact"
            style={{
              color: 'var(--primary-color)',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Contact Support →
          </Link>
        </div>
      </section>
    </div>
  );
};

export default MobileAppPage;
