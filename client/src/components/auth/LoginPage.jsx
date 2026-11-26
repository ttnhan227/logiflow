import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button, Input, Alert } from '@/components/ui';
import { LuUser, LuLock, LuArrowRight } from 'react-icons/lu';
import { authService } from '../../services';
import BrandMark from '../common/BrandMark';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

      const requestedPath = location.state?.from?.pathname;
      if (requestedPath) {
        navigate(requestedPath, { replace: true });
      } else if (response.role === 'ADMIN') {
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
    <main id="main-content" className="logiflow-login-page">
      <div className="logiflow-login-shell">
        <aside className="logiflow-login-aside">
          <div>
            <Link to="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
              <BrandMark theme="dark" size="lg" />
            </Link>
            <div className="logiflow-login-kicker">CONTROL TOWER // FREIGHT PORTAL</div>
            <h2 className="logiflow-login-headline">
              Unified dispatch, live GPS telemetry, and digital e-POD.
            </h2>
            <p className="logiflow-login-copy">
              Role-scoped access for dispatchers, fleet administrators, and enterprise shippers across the Pan-Vietnam corridor.
            </p>
          </div>
          <div className="logiflow-login-specs">
            <div className="logiflow-login-spec-row">
              <span className="logiflow-login-spec-key">CORRIDOR</span>
              <span className="logiflow-login-spec-val">HCMC ↔ Hanoi Linehaul</span>
            </div>
            <div className="logiflow-login-spec-row">
              <span className="logiflow-login-spec-key">TELEMETRY</span>
              <span className="logiflow-login-spec-val">STOMP WebSocket GPS</span>
            </div>
            <div className="logiflow-login-spec-row">
              <span className="logiflow-login-spec-key">AUTH</span>
              <span className="logiflow-login-spec-val">Stateless JWT + RBAC</span>
            </div>
          </div>
        </aside>

        <div className="logiflow-login-form-pane">
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Sign in to LogiFlow
            </h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
              Access the unified freight management &amp; dispatch portal
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
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. admin or john.dispatcher"
              leftIcon={<LuUser size={16} aria-hidden="true" />}
              required
              autoFocus
              error={error && !username.trim() ? 'Username is required' : undefined}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
              placeholder="Enter account password"
              leftIcon={<LuLock size={16} aria-hidden="true" />}
              required
              error={error && !password.trim() ? 'Password is required' : undefined}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              rightIcon={<LuArrowRight size={16} aria-hidden="true" />}
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
              <Button as={Link} to="/register/customer" variant="outline" size="sm">
                Register as Shipper / Customer
              </Button>
              <Button as={Link} to="/register/driver" variant="outline" size="sm">
                Apply as Driver Partner
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
