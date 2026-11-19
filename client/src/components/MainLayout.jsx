import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services';
import FooterLayout from './FooterLayout';
import {
  LuChevronDown,
  LuMenu,
  LuX,
  LuPackage,
  LuSearch,
  LuMapPin,
  LuUser,
  LuLogOut,
  LuTruck,
  LuLayoutDashboard,
  LuBuilding,
  LuUserPlus,
} from 'react-icons/lu';

export const MainLayout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [servicesDropdownOpen, setServicesDropdownOpen] = useState(false);
  const [joinDropdownOpen, setJoinDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const servicesRef = useRef(null);
  const joinRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, [location]);

  useEffect(() => {
    const onUserUpdated = (e) => {
      try {
        setUser(e?.detail || authService.getCurrentUser());
      } catch {
        setUser(authService.getCurrentUser());
      }
    };
    window.addEventListener('userUpdated', onUserUpdated);
    return () => window.removeEventListener('userUpdated', onUserUpdated);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setServicesDropdownOpen(false);
    setJoinDropdownOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Click outside or Escape key to close dropdowns / mobile drawer
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target)) {
        setServicesDropdownOpen(false);
      }
      if (joinRef.current && !joinRef.current.contains(event.target)) {
        setJoinDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setServicesDropdownOpen(false);
        setJoinDropdownOpen(false);
        setUserDropdownOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
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

  const getInitials = (u) => {
    if (!u) return '';
    const name = u.username || u.name || u.email || '';
    return name
      .split(' ')
      .map((n) => n && n[0])
      .filter(Boolean)
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getProfilePictureUrl = (u) => {
    if (!u?.profilePictureUrl) return null;
    if (u.profilePictureUrl.startsWith('http://') || u.profilePictureUrl.startsWith('https://')) {
      return u.profilePictureUrl;
    }
    const baseUrl = authService.getBaseUrl();
    return `${baseUrl}${u.profilePictureUrl.startsWith('/') ? '' : '/'}${u.profilePictureUrl}`;
  };

  const navLinkStyle = (path) => {
    const isActive = location.pathname === path;
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 12px',
      fontSize: 'var(--text-sm)',
      fontWeight: isActive ? 600 : 500,
      color: isActive ? '#ff8547' : '#d7e7f3',
      backgroundColor: isActive ? 'rgba(255, 103, 20, 0.14)' : 'transparent',
      borderRadius: 'var(--radius-md)',
      transition: 'background-color var(--transition-fast), color var(--transition-fast)',
      cursor: 'pointer',
    };
  };

  const navLinkProps = (path) => ({
    style: navLinkStyle(path),
    'aria-current': location.pathname === path ? 'page' : undefined,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      {/* Sticky Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 900,
          backgroundColor: 'rgba(7, 26, 46, 0.97)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${isScrolled ? 'rgba(68, 197, 225, 0.45)' : 'rgba(68, 197, 225, 0.2)'}`,
          boxShadow: isScrolled ? '0 12px 28px -20px rgba(3, 17, 31, 0.9)' : 'none',
          transition: 'all var(--transition-base)',
        }}
      >
        <div
          className="container"
          style={{
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          {/* Brand Logo */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: '36px',
                height: '36px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-route-orange)',
                border: '1px solid rgba(255, 103, 20, 0.35)',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 103, 20, 0.08)',
              }}
            >
              <LuTruck size={20} />
            </span>
            <span style={{ marginLeft: '9px', color: 'var(--color-white)', fontSize: '20px', fontWeight: 800, letterSpacing: '-0.04em' }}>
              LOGI<span style={{ color: 'var(--color-route-orange)' }}>FLOW</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            aria-label="Primary navigation"
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '4px',
            }}
            className="desktop-nav"
          >
            <Link to="/" {...navLinkProps('/')}>
              Home
            </Link>

            {/* Services Dropdown */}
            <div style={{ position: 'relative' }} ref={servicesRef}>
              <button
                type="button"
                onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                aria-expanded={servicesDropdownOpen}
                aria-controls="services-dropdown-panel"
                style={{
                  ...navLinkStyle('/services'),
                  color: servicesDropdownOpen ? '#ff8547' : '#d7e7f3',
                  backgroundColor: servicesDropdownOpen ? 'rgba(255, 103, 20, 0.14)' : 'transparent',
                }}
              >
                Services <LuChevronDown size={14} aria-hidden="true" style={{ transform: servicesDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
              </button>

              {servicesDropdownOpen && (
                <div
                  id="services-dropdown-panel"
                  aria-label="Services navigation"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: '220px',
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
                  <Link
                    to="/services"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-primary)',
                    }}
                    onClick={() => setServicesDropdownOpen(false)}
                  >
                    <LuPackage size={16} color="var(--color-brand-600)" aria-hidden="true" />
                    Delivery Services
                  </Link>
                  <Link
                    to="/track"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-primary)',
                    }}
                    onClick={() => setServicesDropdownOpen(false)}
                  >
                    <LuSearch size={16} color="var(--color-brand-600)" aria-hidden="true" />
                    Track Shipment
                  </Link>
                  <Link
                    to="/coverage"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-primary)',
                    }}
                    onClick={() => setServicesDropdownOpen(false)}
                  >
                    <LuMapPin size={16} color="var(--color-brand-600)" aria-hidden="true" />
                    Coverage Map
                  </Link>
                </div>
              )}
            </div>

            <Link to="/fleet" {...navLinkProps('/fleet')}>
              Fleet
            </Link>
            <Link to="/about" {...navLinkProps('/about')}>
              About
            </Link>
            <Link to="/contact" {...navLinkProps('/contact')}>
              Contact
            </Link>
            <Link to="/business" {...navLinkProps('/business')}>
              For Business
            </Link>

            {/* Role Links */}
            {user?.role === 'DISPATCHER' && (
              <Link
                to="/dispatch/orders"
                aria-current={location.pathname === '/dispatch/orders' ? 'page' : undefined}
                style={{
                  ...navLinkStyle('/dispatch/orders'),
                  color: '#7dd3fc',
                  fontWeight: 600,
                }}
              >
                <LuTruck size={15} aria-hidden="true" /> Dispatch
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                aria-current={location.pathname === '/admin/dashboard' ? 'page' : undefined}
                style={{
                  ...navLinkStyle('/admin/dashboard'),
                  color: '#7dd3fc',
                  fontWeight: 600,
                }}
              >
                <LuLayoutDashboard size={15} aria-hidden="true" /> Admin Portal
              </Link>
            )}
          </nav>

          {/* Right Action / Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user ? (
              <div style={{ position: 'relative' }} ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-expanded={userDropdownOpen}
                  aria-controls="user-dropdown-panel"
                  aria-label={`User account options for ${user.username || 'User'}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 10px 4px 4px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--color-white)',
                    cursor: 'pointer',
                  }}
                >
                  {user.profilePictureUrl && getProfilePictureUrl(user) ? (
                    <img
                      src={getProfilePictureUrl(user)}
                      alt={user.username}
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
                      {getInitials(user)}
                    </div>
                  )}
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.username || user.email || 'User'}
                  </span>
                  <LuChevronDown size={14} color="var(--color-slate-600)" aria-hidden="true" />
                </button>

                {userDropdownOpen && (
                  <div
                    id="user-dropdown-panel"
                    aria-label="User account navigation"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      width: '200px',
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
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '4px' }}>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {user.username}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Role: {user.role}
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-primary)',
                      }}
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <LuUser size={15} aria-hidden="true" /> My Profile
                    </Link>

                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin/dashboard"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-primary)',
                        }}
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <LuLayoutDashboard size={15} aria-hidden="true" /> Admin Dashboard
                      </Link>
                    )}

                    {user.role === 'DISPATCHER' && (
                      <Link
                        to="/dispatch/orders"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-primary)',
                        }}
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <LuTruck size={15} aria-hidden="true" /> Dispatch Center
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
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
                      <LuLogOut size={15} aria-hidden="true" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Join Us Dropdown */}
                <div className="join-menu" style={{ position: 'relative' }} ref={joinRef}>
                  <button
                    type="button"
                    onClick={() => setJoinDropdownOpen(!joinDropdownOpen)}
                    aria-expanded={joinDropdownOpen}
                    aria-controls="join-dropdown-panel"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '7px 12px',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 600,
                      color: joinDropdownOpen ? '#ff8547' : '#d7e7f3',
                      backgroundColor: joinDropdownOpen ? 'rgba(255, 103, 20, 0.14)' : 'transparent',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast), color var(--transition-fast)',
                    }}
                  >
                    Join Us <LuChevronDown size={14} aria-hidden="true" style={{ transform: joinDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
                  </button>

                  {joinDropdownOpen && (
                    <div
                      id="join-dropdown-panel"
                      aria-label="Registration options"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        width: '200px',
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
                      <Link
                        to="/register/driver"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-primary)',
                        }}
                        onClick={() => setJoinDropdownOpen(false)}
                      >
                        <LuTruck size={15} color="var(--color-brand-600)" aria-hidden="true" />
                        Apply as Driver
                      </Link>
                      <Link
                        to="/register/customer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-md)',
                          fontSize: 'var(--text-sm)',
                          color: 'var(--text-primary)',
                        }}
                        onClick={() => setJoinDropdownOpen(false)}
                      >
                        <LuBuilding size={15} color="var(--color-brand-600)" aria-hidden="true" />
                        Register Company
                      </Link>
                    </div>
                  )}
                </div>

                <Link
                  to="/login"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '7px 14px',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    backgroundColor: 'var(--color-brand-600)',
                    color: 'var(--color-white)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-btn"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                minHeight: '40px',
                padding: '6px 8px',
                color: 'var(--color-white)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(68, 197, 225, 0.35)',
                backgroundColor: 'rgba(68, 197, 225, 0.08)',
                cursor: 'pointer',
              }}
            >
              {isMobileMenuOpen ? <LuX size={20} aria-hidden="true" /> : <LuMenu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <nav
            id="mobile-nav-drawer"
            aria-label="Mobile navigation"
            style={{
              padding: '16px',
              borderTop: '1px solid rgba(68, 197, 225, 0.25)',
              backgroundColor: 'var(--bg-sidebar)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <Link to="/" {...navLinkProps('/')}>Home</Link>
            <Link to="/services" {...navLinkProps('/services')}>Delivery Services</Link>
            <Link to="/track" {...navLinkProps('/track')}>Track Shipment</Link>
            <Link to="/coverage" {...navLinkProps('/coverage')}>Coverage Map</Link>
            <Link to="/fleet" {...navLinkProps('/fleet')}>Fleet</Link>
            <Link to="/business" {...navLinkProps('/business')}>For Business</Link>
            <Link to="/about" {...navLinkProps('/about')}>About</Link>
            <Link to="/contact" {...navLinkProps('/contact')}>Contact</Link>
            <Link to="/faq" {...navLinkProps('/faq')}>FAQ</Link>
            <Link to="/drivers" {...navLinkProps('/drivers')}>Driver Opportunities</Link>
            <Link to="/mobile-app" {...navLinkProps('/mobile-app')}>Mobile Apps</Link>

            {!user && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link
                  to="/login"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px',
                    backgroundColor: 'var(--color-brand-600)',
                    color: 'var(--color-white)',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                  }}
                >
                  Sign In
                </Link>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link
                    to="/register/driver"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px',
                      border: '1px solid rgba(255,255,255,0.28)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: '#e2eff9',
                    }}
                  >
                    Apply Driver
                  </Link>
                  <Link
                    to="/register/customer"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px',
                      border: '1px solid rgba(255,255,255,0.28)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: '#e2eff9',
                    }}
                  >
                    Register Biz
                  </Link>
                </div>
              </div>
            )}
          </nav>
        )}
      </header>

      {/* Main Outlet */}
      <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Enterprise Footer */}
      <FooterLayout />

      <style>{`
        @media (min-width: 900px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 899px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: inline-flex !important; }
          .join-menu { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
