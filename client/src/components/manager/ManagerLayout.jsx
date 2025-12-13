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
    <div className="manager-app">
      <header className="manager-header">
        <div className="manager-header-inner">
          <div className="manager-logo">
            <span className="manager-logo-text">👔 Manager Center</span>
          </div>

          <nav className="manager-nav">
            <Link to="/manager/drivers" className="manager-nav-link">📦 Driver</Link>
            <Link to="/manager/issues" className="manager-nav-link">🚐 Issues & Report</Link>
            <Link to="/manager/compliance" className="manager-nav-link">👥 Compliance</Link>
            <Link to="/manager/analytics/routes" className="manager-nav-link">🗺️ Route Analytics</Link>
            <Link to="/manager/alerts" className="manager-nav-link">🔔 Alerts</Link>
            <Link to="/manager/activities" className="manager-nav-link">📊 Activities</Link>
          </nav>

          {user && (
            <div className="manager-user">
              <span className="manager-greeting">Hi, {user.username}</span>
              <button onClick={handleLogout} className="manager-logout-btn">
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="manager-content">
        <Outlet />
      </main>
    </div>
  );
};

export default ManagerLayout;
