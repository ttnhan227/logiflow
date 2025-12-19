import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services';
import './manager.css';

const ManagerLayout = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <div className="manager-layout">
      {/* Top Header */}
      <header className="manager-topbar">
        <div className="manager-topbar-left">
          <Link to="/" className="manager-home-link">
            ← Home
          </Link>
          <span className="manager-app-name">Manager Panel</span>
        </div>

        {user && (
          <div className="manager-topbar-right">
            <span className="manager-user-name">{user.username}</span>
            <button className="manager-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="manager-body">
        {/* Sidebar */}
        <aside className="manager-sidebar">
            {/*tổng quan quản lý (KPI + cảnh báo chính)*/}
            <NavLink to="/manager/dashboard" className="manager-menu-item">
                Dashboard Overview
            </NavLink>
            <NavLink
                to="/manager/recommendations"
                className={({ isActive }) => (isActive ? "active" : "")}
            >
                Recommendations
            </NavLink>
            {/*theo dõi vận hành tổng thể (drivers + fleet + operations)*/}
          <NavLink to="/manager/monitor-operations" className="manager-menu-item">
              Monitor Operations
          </NavLink>
          <NavLink to="/manager/issues" className="manager-menu-item">
            Issues & Reports
          </NavLink>
          <NavLink to="/manager/compliance" className="manager-menu-item">
            Compliance
          </NavLink>
          <NavLink to="/manager/analytics/routes" className="manager-menu-item">
            Route Analytics
          </NavLink>
          <NavLink to="/manager/alerts" className="manager-menu-item">
            Alerts
          </NavLink>
          <NavLink to="/manager/activities" className="manager-menu-item">
            Activities
          </NavLink>
        </aside>

        {/* Content */}
        <main className="manager-main">
          <div className="manager-page-header">
            <h1 className="manager-page-title">Manager Content</h1>
            <p className="manager-page-subtitle">
              Operational overview and management tools
            </p>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagerLayout;
