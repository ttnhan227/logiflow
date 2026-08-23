import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../../services';
import NotificationBell from '../common/NotificationBell';
import {
  LuPackage,
  LuBoxes,
  LuUsers,
  LuChartColumn,
  LuCloudUpload,
  LuTruck,
  LuChevronDown,
  LuUser,
  LuLogOut,
  LuExternalLink,
} from 'react-icons/lu';

export const DispatchLayout = () => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const navLinks = [
    { path: '/dispatch/orders', label: 'Orders', icon: <LuPackage size={16} /> },
    { path: '/dispatch/orders/import', label: 'Import Orders', icon: <LuCloudUpload size={16} /> },
    { path: '/dispatch/trips', label: 'Trips & Dispatch', icon: <LuBoxes size={16} /> },
    { path: '/dispatch/drivers', label: 'Active Drivers', icon: <LuUsers size={16} /> },
    { path: '/dispatch/reports', label: 'Performance', icon: <LuChartColumn size={16} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Top Tactical Dispatch Header */}
      <header
        style={{
          height: 'var(--header-height)',
          backgroundColor: 'var(--color-slate-900)',
          color: 'var(--color-white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 28px',
          position: 'sticky',
          top: 0,
          zIndex: 900,
          borderBottom: '1px solid #1e293b',
        }}
      >
        {/* Left Brand / Center Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/dispatch/orders" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
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

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(37, 99, 235, 0.25)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: 'var(--color-brand-200)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <LuTruck size={13} /> Dispatch Operations
          </span>

          {/* Desktop Nav Items */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px' }} className="dispatch-nav">
            {navLinks.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--color-white)' : 'var(--color-slate-300)',
                    backgroundColor: isActive ? 'var(--color-brand-600)' : 'transparent',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.8 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Public Site"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: 'var(--text-xs)',
              fontWeight: 500,
              color: 'var(--color-slate-300)',
              padding: '5px 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #334155',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
            }}
          >
            Public Site <LuExternalLink size={12} />
          </Link>

          {user && <NotificationBell />}

          {user && (
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 10px 4px 4px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid #334155',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                  color: 'var(--color-white)',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--color-brand-600)',
                    color: 'var(--color-white)',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {user.username?.charAt(0).toUpperCase() || 'D'}
                </div>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                  {user.username || 'Dispatcher'}
                </span>
                <LuChevronDown size={14} color="var(--color-slate-400)" />
              </button>

              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '180px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-default)',
                    boxShadow: 'var(--shadow-dropdown)',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    zIndex: 1000,
                  }}
                >
                  <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {user.username}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Role: {user.role}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-primary)',
                    }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    <LuUser size={15} /> My Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--color-danger-600)',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'left',
                    }}
                  >
                    <LuLogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
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
  );
};

export default DispatchLayout;
