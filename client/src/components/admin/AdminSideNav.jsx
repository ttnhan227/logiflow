import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import AdminTopNav from './AdminTopNav';
import {
  LuLayoutDashboard,
  LuChartColumn,
  LuBoxes,
  LuUsers,
  LuUserCheck,
  LuFileText,
  LuCreditCard,
  LuTruck,
  LuSlidersHorizontal,
  LuChevronDown,
  LuMenu,
  LuX,
  LuUser,
  LuBuilding2,
  LuHeadphones,
} from 'react-icons/lu';

export const AdminSideNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getCurrentUser());
  const [userMenuOpen, setUserMenuOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, [location]);

  useEffect(() => {
    const handleUserUpdated = (e) => {
      try {
        setUser(e?.detail || authService.getCurrentUser());
      } catch {
        setUser(authService.getCurrentUser());
      }
    };
    window.addEventListener('userUpdated', handleUserUpdated);
    return () => window.removeEventListener('userUpdated', handleUserUpdated);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: <LuLayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/admin/reports', icon: <LuChartColumn size={18} />, label: 'Reports & Analytics' },
    { path: '/admin/trips-oversight', icon: <LuBoxes size={18} />, label: 'Trips Oversight' },
    {
      label: 'User Management',
      icon: <LuUsers size={18} />,
      isParent: true,
      children: [
        { path: '/admin/users/drivers', icon: <LuTruck size={16} />, label: 'Drivers' },
        { path: '/admin/users/customers', icon: <LuBuilding2 size={16} />, label: 'Customers' },
        { path: '/admin/users/dispatchers', icon: <LuHeadphones size={16} />, label: 'Dispatchers' },
      ],
    },
    { path: '/admin/registration-requests', icon: <LuUserCheck size={18} />, label: 'Registration Requests' },
    { path: '/admin/audit-logs', icon: <LuFileText size={18} />, label: 'Audit Logs' },
    { path: '/admin/payment-requests', icon: <LuCreditCard size={18} />, label: 'Payment Requests' },
    { path: '/admin/vehicles', icon: <LuTruck size={18} />, label: 'Fleet Vehicles' },
    { path: '/admin/system/overview', icon: <LuSlidersHorizontal size={18} />, label: 'System Overview' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="admin-mobile-toggle"
        aria-label="Toggle admin sidebar"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 999,
          display: 'none',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-slate-900)',
          color: 'var(--color-white)',
          boxShadow: 'var(--shadow-lg)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        {mobileOpen ? <LuX size={22} /> : <LuMenu size={22} />}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 950,
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`admin-sidebar-shell ${mobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: 'var(--sidebar-width)',
          backgroundColor: 'var(--color-slate-900)',
          color: 'var(--color-slate-300)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 960,
          flexShrink: 0,
          borderRight: '1px solid #1e293b',
          transition: 'transform var(--transition-base)',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            height: 'var(--header-height)',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <Link to="/admin/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.5px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              Logi<span style={{ color: '#38bdf8' }}>Flow</span>
            </span>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav
          style={{
            flex: 1,
            padding: '16px 12px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <span
            style={{
              padding: '0 10px 8px 10px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-slate-400)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Operations & Fleet
          </span>

          {navItems.map((item) => {
            if (item.isParent) {
              const isChildActive = item.children.some((c) => location.pathname.startsWith(c.path));
              return (
                <div key={item.label} style={{ marginBottom: '2px' }}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      color: isChildActive ? 'var(--color-white)' : 'var(--color-slate-300)',
                      backgroundColor: isChildActive ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                      fontSize: 'var(--text-sm)',
                      fontWeight: isChildActive ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: isChildActive ? 'var(--color-brand-500)' : 'var(--color-slate-400)' }}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <LuChevronDown
                      size={14}
                      style={{
                        transform: userMenuOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 150ms',
                        color: 'var(--color-slate-400)',
                      }}
                    />
                  </button>

                  {userMenuOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '28px', marginTop: '2px' }}>
                      {item.children.map((child) => {
                        const active = location.pathname.startsWith(child.path);
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 10px',
                              borderRadius: 'var(--radius-md)',
                              fontSize: 'var(--text-xs)',
                              fontWeight: active ? 600 : 500,
                              color: active ? 'var(--color-white)' : 'var(--color-slate-400)',
                              backgroundColor: active ? 'var(--color-brand-600)' : 'transparent',
                              transition: 'all var(--transition-fast)',
                            }}
                          >
                            <span style={{ color: active ? 'var(--color-white)' : 'inherit' }}>{child.icon}</span>
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--color-white)' : 'var(--color-slate-300)',
                  backgroundColor: isActive ? 'var(--color-brand-600)' : 'transparent',
                  fontSize: 'var(--text-sm)',
                  fontWeight: isActive ? 600 : 500,
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span style={{ color: isActive ? 'var(--color-white)' : 'var(--color-slate-400)' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#090d16',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success-600)',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-white)' }}>
              LogiFlow Engine v2.4
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-slate-400)' }}>
              Pan-Vietnam Node Active
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area with TopNav */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AdminTopNav user={user} onLogout={handleLogout} />
        <main
          style={{
            flex: 1,
            padding: '24px 28px',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 899px) {
          .admin-sidebar-shell {
            position: fixed !important;
            transform: translateX(-100%);
          }
          .admin-sidebar-shell.mobile-open {
            transform: translateX(0) !important;
          }
          .admin-mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminSideNav;
