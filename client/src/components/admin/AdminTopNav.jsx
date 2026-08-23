import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authService } from '../../services';
import NotificationBell from '../common/NotificationBell';
import { LuChevronDown, LuUser, LuLogOut, LuExternalLink } from 'react-icons/lu';

export const AdminTopNav = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getProfilePictureUrl = (u) => {
    if (!u?.profilePictureUrl) return null;
    if (u.profilePictureUrl.startsWith('http://') || u.profilePictureUrl.startsWith('https://')) {
      return u.profilePictureUrl;
    }
    const baseUrl = authService.getBaseUrl();
    return `${baseUrl}${u.profilePictureUrl.startsWith('/') ? '' : '/'}${u.profilePictureUrl}`;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBreadcrumbTitle = () => {
    const p = location.pathname;
    if (p.includes('dashboard')) return 'Dashboard';
    if (p.includes('reports')) return 'Reports & Analytics';
    if (p.includes('trips-oversight')) return 'Trips Oversight';
    if (p.includes('users/drivers')) return 'Driver Accounts';
    if (p.includes('users/customers')) return 'Customer Accounts';
    if (p.includes('users/dispatchers')) return 'Dispatcher Accounts';
    if (p.includes('registration-requests')) return 'Registration Requests';
    if (p.includes('audit-logs')) return 'Audit Logs';
    if (p.includes('payment-requests')) return 'Payment Requests';
    if (p.includes('vehicles')) return 'Fleet Vehicles';
    if (p.includes('system/overview')) return 'System Overview';
    return 'Admin Management';
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 800,
      }}
    >
      {/* Left Breadcrumb Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Admin Console
        </span>
        <span style={{ color: 'var(--border-strong)', fontSize: '12px' }}>/</span>
        <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
          {getBreadcrumbTitle()}
        </span>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Public Site Link */}
        <Link
          to="/"
          target="_blank"
          rel="noopener noreferrer"
          title="View Public Logistics Portal"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            padding: '6px 10px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--color-white)',
          }}
        >
          Public Site <LuExternalLink size={13} />
        </Link>

        {/* Real-time Notifications */}
        <NotificationBell />

        {/* User Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '4px 10px 4px 4px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--color-white)',
              cursor: 'pointer',
            }}
          >
            {user?.profilePictureUrl && getProfilePictureUrl(user) ? (
              <img
                src={getProfilePictureUrl(user)}
                alt={user?.username}
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '28px',
                  height: '28px',
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
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
            )}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {user?.username || 'Admin'}
              </span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-brand-600)', textTransform: 'uppercase' }}>
                System Admin
              </span>
            </div>
            <LuChevronDown size={14} color="var(--color-slate-400)" />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: '190px',
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
              <button
                onClick={() => {
                  navigate('/profile');
                  setDropdownOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <LuUser size={15} /> My Profile
              </button>

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
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
      </div>
    </header>
  );
};

export default AdminTopNav;
