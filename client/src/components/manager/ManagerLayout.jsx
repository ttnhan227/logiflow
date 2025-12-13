import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import './manager.css';

const ManagerLayout = () => {
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
    <div className="dispatch-app-container">
      <header className="dispatch-header">
        <div className="dispatch-header-container">
          <div className="dispatch-logo">
            <span className="dispatch-logo-text">🚛 Dispatch Center</span>
          </div>

          <nav className="dispatch-nav-links">
            <Link to="/manager/drivers" className="dispatch-nav-link">📦 Driver</Link>
            <Link to="/manager/issues" className="dispatch-nav-link">🚐 Issues and Report</Link>
            <Link to="/manager/compliance" className="dispatch-nav-link">👥 Compliance</Link>
            <Link to="/manager/analytics/routes" className="dispatch-nav-link">👥 Route analytics</Link>
            <Link to="/manager/alerts" className="dispatch-nav-link">👥 Alerts</Link>
            <Link to="/manager/activities" className="dispatch-nav-link">📊 Activities</Link>
          </nav>

          {user && (
            <div className="dispatch-user-section">
              <span className="dispatch-greeting">Hi, {user.username}</span>
              <button onClick={handleLogout} className="dispatch-logout-btn">🚪 Logout</button>
            </div>
          )}
        </div>
      </header>

      <main className="dispatch-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default ManagerLayout;