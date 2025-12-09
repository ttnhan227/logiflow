import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import './dispatch.css';

const DispatchLayout = () => {
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
            <Link to="/dispatch/orders" className="dispatch-nav-link">📦 Orders</Link>
            <Link to="/dispatch/trips" className="dispatch-nav-link">🚐 Trips</Link>
            <Link to="/dispatch/drivers" className="dispatch-nav-link">👥 Drivers</Link>
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

export default DispatchLayout;
