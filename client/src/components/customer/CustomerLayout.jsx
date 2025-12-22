import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import NotificationBell from '../common/NotificationBell';
import './customer.css';

const CustomerLayout = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  return (
    <div className="customer-app-container">
      <header className="customer-header">
        <div className="customer-header-container">
          <div className="customer-logo">
            <span className="customer-logo-text">🛒 Customer Portal</span>
          </div>

          <nav className="customer-nav-links">
            <Link to="/customer/orders" className="customer-nav-link">📦 My Orders</Link>
            <Link to="/customer/track" className="customer-nav-link">🚚 Track Shipment</Link>
            <Link to="/customer/notifications" className="customer-nav-link">🔔 Notifications</Link>
          </nav>

          {user && (
            <div className="customer-notifications-section">
              <NotificationBell />
            </div>
          )}

          {user && (
            <div className="customer-user-section">
              <span className="customer-greeting">Hi, {user.username}</span>
              <button onClick={handleLogout} className="customer-logout-btn">🚪 Logout</button>
            </div>
          )}
        </div>
      </header>

      <main className="customer-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default CustomerLayout;
