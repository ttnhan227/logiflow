import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, TextField, Button, Typography, Box, Alert, InputAdornment } from '@mui/material';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { authService } from '../../services';
import './auth.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(username, password);
      // Redirect based on user role
      if (response.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (response.role === 'CUSTOMER') {
        navigate('/customer/orders');
      } else if (response.role === 'DISPATCHER') {
        navigate('/dispatch/orders');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem 1rem'
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{ maxWidth: '400px', width: '100%' }}
      >
        <Card
          sx={{
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            borderRadius: '16px',
            border: '1px solid rgba(59, 130, 246, 0.1)',
            overflow: 'hidden'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ textAlign: 'center', marginBottom: '2rem' }}
            >
              <img
                src="/logiflow-smarter_logistics-seamless_flow.png"
                alt="LogiFlow - Smarter Logistics. Seamless Flow."
                style={{
                  width: '200px',
                  height: 'auto',
                  marginBottom: '1rem'
                }}
              />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{ textAlign: 'center', marginBottom: '2rem' }}
            >
              <Typography variant="h4" component="h1" gutterBottom sx={{
                color: 'text.primary',
                fontWeight: '700'
              }}>
                Welcome Back
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Sign in to your LogiFlow account
              </Typography>
            </motion.div>

            {/* Error Alert */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                style={{ marginBottom: '1.5rem' }}
              >
                <Alert severity="error" sx={{ borderRadius: '8px' }}>
                  {error}
                </Alert>
              </motion.div>
            )}

            {/* Login Form */}
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onSubmit={handleSubmit}
              noValidate
            >
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserOutlined style={{ color: '#6b7280' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />

              <TextField
                fullWidth
                type="password"
                label="Password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined style={{ color: '#6b7280' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  }
                }}
              />

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  startIcon={loading ? null : <LoginOutlined />}
                  sx={{
                    py: 1.5,
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-color)',
                    '&:hover': {
                      backgroundColor: '#1d4ed8',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 8px 25px rgba(37, 99, 235, 0.3)',
                    },
                    fontSize: '1rem',
                    fontWeight: '600',
                    textTransform: 'none'
                  }}
                >
                  {loading ? 'Signing In...' : 'Sign In to LogiFlow'}
                </Button>
              </motion.div>
            </motion.form>

            {/* Footer Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e5e7eb',
                textAlign: 'center'
              }}
            >
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                New to LogiFlow?
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Contact your administrator or visit our public site for more information.
              </Typography>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};


export default LoginPage;
