import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Card, CardContent, Input, Alert, Badge } from '@/components/ui';
import { LuUser, LuLock, LuArrowRight, LuShieldCheck } from 'react-icons/lu';
import { authService } from '../../services';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await authService.login(username, password);
      // Trigger user update event
      window.dispatchEvent(new Event('userUpdated'));

      if (response.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (response.role === 'DISPATCHER') {
        navigate('/dispatch/orders');
      } else if (response.role === 'CUSTOMER') {
        navigate('/track');
      } else {
        navigate('/');
      }
    } catch (err) {
      if (!err.response) {
        setError('Network error. Unable to reach authentication server.');
      } else if (err.response?.status === 401 || err.response?.status === 400) {
        setError('Invalid username or password. Please verify your credentials.');
      } else {
        setError(err.response?.data?.error || err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 72px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        padding: '32px 16px',
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <Card style={{ padding: '36px 32px', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <Link to="/" style={{ display: 'inline-block', marginBottom: '16px', textDecoration: 'none' }}>
              <span
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  color: 'var(--color-slate-900)',
                  letterSpacing: '-0.6px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                Logi<span style={{ color: 'var(--color-brand-600)' }}>Flow</span>
              </span>
            </Link>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Sign in to LogiFlow
            </h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
              Access the unified freight management & dispatch portal
            </p>
          </div>

          {error && (
            <div style={{ marginBottom: '20px' }}>
              <Alert variant="danger" onClose={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin or dispatcher_01"
              leftIcon={<LuUser size={16} />}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter account password"
              leftIcon={<LuLock size={16} />}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              rightIcon={<LuArrowRight size={16} />}
              style={{ width: '100%', marginTop: '8px' }}
            >
              Sign In to Control Tower
            </Button>
          </form>

          {/* Registration Options */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Need an account?
            </span>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register/customer">
                <Button variant="outline" size="sm">
                  Register as Shipper / Customer
                </Button>
              </Link>
              <Link to="/register/driver">
                <Button variant="outline" size="sm">
                  Apply as Driver Partner
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
