import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import './admin.css';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen for user updates (e.g., from profile edit or admin user management)
  React.useEffect(() => {
    const handleUserUpdated = (e) => {
      try {
        setUser(e?.detail || authService.getCurrentUser());
      } catch (ex) {
        setUser(authService.getCurrentUser());
      }
    };
    window.addEventListener('userUpdated', handleUserUpdated);
    return () => window.removeEventListener('userUpdated', handleUserUpdated);
  }, []);

  const menuItems = [
  { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
  { path: '/admin/users', icon: '👥', label: 'User Management' },
  { path: '/admin/audit-logs', icon: '📝', label: 'Audit Logs' },
  { path: '/admin/routes', icon: '📦', label: 'Routes', disabled: true },
  { path: '/admin/drivers', icon: '🚗', label: 'Drivers', disabled: true },
  { path: '/admin/settings', icon: '⚙️', label: 'Settings' },
  ];

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getProfilePictureUrl = (u) => {
    if (!u?.profilePictureUrl) return null;
    if (u.profilePictureUrl.startsWith('http://') || u.profilePictureUrl.startsWith('https://')) {
      return u.profilePictureUrl;
    }
    const baseUrl = authService.getBaseUrl();
    return `${baseUrl}${u.profilePictureUrl.startsWith('/') ? '' : '/'}${u.profilePictureUrl}`;
  };

  return (
    <div className={`admin-layout ${isScrolled ? 'scrolled' : ''}`}>
      <div className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Logo/Brand - matching MainLayout */}
        <div className="brand">
          {!sidebarCollapsed ? (
            <Link to="/admin/dashboard" className="brand-link">
              <img 
                src="/logiflow-smarter_logistics-seamless_flow.png" 
                alt="LogiFlow"
                className="brand-logo"
              />
            </Link>
          ) : (
            <Link to="/admin/dashboard" className="brand-link">
              <div className="brand-icon" aria-hidden>🚚</div>
            </Link>
          )}
        </div>

        {/* Menu Items */}
        <nav className="admin-nav" role="navigation" aria-label="Admin navigation">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isDisabled = item.disabled;
            return (
              <Link
                key={item.path}
                to={isDisabled ? '#' : item.path}
                className={`nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                aria-disabled={isDisabled}
                tabIndex={isDisabled ? -1 : 0}
              >
                <span className="nav-icon" aria-hidden>{item.icon}</span>
                {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div className="profile-area">
          {!sidebarCollapsed ? (
            <>
              <div className="profile-row">
                {user?.profilePictureUrl && getProfilePictureUrl(user) ? (
                  <img 
                    src={getProfilePictureUrl(user)} 
                    alt={user?.username}
                    className="avatar-image"
                    title={user?.username}
                  />
                ) : (
                  <div className="avatar">
                    {user?.username?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                <div className="profile-info">
                  <div className="profile-name">{user?.username || 'Admin'}</div>
                  <div className="profile-role">{user?.role || 'ADMIN'}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn logout-btn"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={handleLogout}
              title="Logout"
              className="icon-btn logout-icon"
            >
              🚪
            </button>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
          className="collapse-toggle"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!sidebarCollapsed}
        >
          {sidebarCollapsed ? '›' : '‹'}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="admin-main">
        <div className="admin-main-inner">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
