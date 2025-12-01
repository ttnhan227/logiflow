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
  const [systemMenuOpen, setSystemMenuOpen] = useState(false);

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
    {
      label: 'System',
      icon: '🛠️',
      children: [
        { path: '/admin/system/overview', icon: '📈', label: 'System Overview' },
        { path: '/admin/system/configuration', icon: '⚙️', label: 'Configuration' },
      ]
    }
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
            if (item.children) {
              // Render parent with children (System)
              const isParentActive = item.children.some(child => location.pathname.startsWith(child.path));
              return (
                <div key={item.label} className={`nav-parent ${isParentActive ? 'active' : ''}`}> 
                  <div
                    className={`nav-item nav-parent-label${systemMenuOpen ? ' open' : ''}`}
                    onClick={() => setSystemMenuOpen((open) => !open)}
                    tabIndex={0}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSystemMenuOpen((open) => !open);
                      }
                    }}
                    aria-expanded={systemMenuOpen}
                    aria-haspopup="true"
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                  >
                    <span className="nav-icon" aria-hidden>{item.icon}</span>
                    {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
                    {!sidebarCollapsed && (
                      <span className="dropdown-arrow" aria-hidden>{systemMenuOpen ? '▲' : '▼'}</span>
                    )}
                  </div>
                  {!sidebarCollapsed && systemMenuOpen && (
                    <div className="nav-children" style={{ transition: 'max-height 0.2s', overflow: 'hidden' }}>
                      {item.children.map(child => {
                        const isActive = location.pathname === child.path;
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`nav-item nav-child ${isActive ? 'active' : ''}`}
                            style={{ paddingLeft: 32, fontSize: '0.97em' }}
                          >
                            <span className="nav-icon" aria-hidden>{child.icon}</span>
                            <span className="nav-label">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            } else {
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
            }
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
