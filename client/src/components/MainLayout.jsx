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
    window.addEventListener('scroll', handleScroll);
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

  // Click outside to close dropdowns
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
      color: isActive ? 'var(--color-brand-700)' : 'var(--color-slate-700)',
      backgroundColor: isActive ? 'var(--color-brand-50)' : 'transparent',
      borderRadius: 'var(--radius-md)',
      transition: 'all var(--transition-fast)',
      cursor: 'pointer',
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Sticky Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 900,
          backgroundColor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${isScrolled ? 'var(--border-strong)' : 'var(--border-default)'}`,
          boxShadow: isScrolled ? 'var(--shadow-sm)' : 'none',
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
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--color-slate-900)',
                letterSpacing: '-0.6px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              Logi<span style={{ color: 'var(--color-brand-600)' }}>Flow</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '4px',
            }}
            className="desktop-nav"
          >
            <Link to="/" style={navLinkStyle('/')}>
              Home
            </Link>

            {/* Services Dropdown */}
            <div style={{ position: 'relative' }} ref={servicesRef}>
              <button
                onClick={() => setServicesDropdownOpen(!servicesDropdownOpen)}
                style={{
                  ...navLinkStyle('/services'),
                  color: servicesDropdownOpen ? 'var(--color-brand-700)' : 'var(--color-slate-700)',
                  backgroundColor: servicesDropdownOpen ? 'var(--color-brand-50)' : 'transparent',
                }}
              >
                Services <LuChevronDown size={14} style={{ transform: servicesDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
              </button>

              {servicesDropdownOpen && (
                <div
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
                    <LuPackage size={16} color="var(--color-brand-600)" />
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
                    <LuSearch size={16} color="var(--color-brand-600)" />
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
                    <LuMapPin size={16} color="var(--color-brand-600)" />
                    Coverage Map
                  </Link>
                </div>
              )}
            </div>

            <Link to="/fleet" style={navLinkStyle('/fleet')}>
              Fleet
            </Link>
            <Link to="/about" style={navLinkStyle('/about')}>
              About
            </Link>
            <Link to="/contact" style={navLinkStyle('/contact')}>
              Contact
            </Link>
            <Link to="/business" style={navLinkStyle('/business')}>
              For Business
            </Link>

            {/* Role Links */}
            {user?.role === 'DISPATCHER' && (
              <Link
                to="/dispatch/orders"
                style={{
                  ...navLinkStyle('/dispatch/orders'),
                  color: 'var(--color-brand-700)',
                  fontWeight: 600,
                }}
              >
                <LuTruck size={15} /> Dispatch
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                style={{
                  ...navLinkStyle('/admin/dashboard'),
                  color: 'var(--color-brand-700)',
                  fontWeight: 600,
                }}
              >
                <LuLayoutDashboard size={15} /> Admin Portal
              </Link>
            )}
          </nav>

          {/* Right Action / Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {user ? (
              <div style={{ position: 'relative' }} ref={userRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
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
                  <LuChevronDown size={14} color="var(--color-slate-400)" />
                </button>

                {userDropdownOpen && (
                  <div
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
                      <LuUser size={15} /> My Profile
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
                        <LuLayoutDashboard size={15} /> Admin Dashboard
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
                        <LuTruck size={15} /> Dispatch Center
                      </Link>
                    )}

                    <button
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
                      <LuLogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Join Us Dropdown */}
                <div style={{ position: 'relative' }} ref={joinRef}>
                  <button
                    onClick={() => setJoinDropdownOpen(!joinDropdownOpen)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '7px 12px',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 500,
                      color: 'var(--text-secondary)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                    }}
                  >
                    Join Us <LuChevronDown size={14} />
                  </button>

                  {joinDropdownOpen && (
                    <div
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
                        <LuTruck size={15} color="var(--color-brand-600)" />
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
                        <LuBuilding size={15} color="var(--color-brand-600)" />
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
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="mobile-menu-btn"
              aria-label="Toggle navigation menu"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
              }}
            >
              {isMobileMenuOpen ? <LuX size={20} /> : <LuMenu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid var(--border-default)',
              backgroundColor: 'var(--color-white)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <Link to="/" style={navLinkStyle('/')}>Home</Link>
            <Link to="/services" style={navLinkStyle('/services')}>Delivery Services</Link>
            <Link to="/track" style={navLinkStyle('/track')}>Track Shipment</Link>
            <Link to="/coverage" style={navLinkStyle('/coverage')}>Coverage Map</Link>
            <Link to="/fleet" style={navLinkStyle('/fleet')}>Fleet</Link>
            <Link to="/business" style={navLinkStyle('/business')}>For Business</Link>
            <Link to="/about" style={navLinkStyle('/about')}>About</Link>
            <Link to="/contact" style={navLinkStyle('/contact')}>Contact</Link>
            <Link to="/faq" style={navLinkStyle('/faq')}>FAQ</Link>
            <Link to="/drivers" style={navLinkStyle('/drivers')}>Driver Opportunities</Link>
            <Link to="/mobile-app" style={navLinkStyle('/mobile-app')}>Mobile Apps</Link>

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
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
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
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    Register Biz
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Outlet */}
      <main style={{ flex: 1 }}>
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
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
