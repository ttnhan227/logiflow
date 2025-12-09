import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../services';
import './layout.css';
import FooterLayout from './FooterLayout';

const MainLayout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [showFooter, setShowFooter] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      setShowFooter(window.scrollY > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  // Listen for global user updates (dispatched by ProfilePage after save)
  useEffect(() => {
    const onUserUpdated = (e) => {
      try {
        setUser(e?.detail || authService.getCurrentUser());
      } catch (ex) {
        setUser(authService.getCurrentUser());
      }
    };
    window.addEventListener('userUpdated', onUserUpdated);
    return () => window.removeEventListener('userUpdated', onUserUpdated);
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

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
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

  return (
    <div className="app-container">
      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        <div className="header-container">
          <div className="logo">
            <Link to="/">
              <img src="/logiflow-smarter_logistics-seamless_flow.png" alt="LogiFlow - Smarter Logistics. Seamless Flow." className="logo-img" />
            </Link>
          </div>
          
          <button className="mobile-menu-button" onClick={toggleMobileMenu}>
            ☰
          </button>
          
          <nav className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
            <Link to="/" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Home</Link>

            {/* Services Dropdown */}
            <div
              className="nav-dropdown"
              style={{ position: 'relative' }}
              onMouseEnter={() => setDropdownOpen('services')}
              onMouseLeave={() => setDropdownOpen(null)}
            >
              <span className="nav-link" style={{ cursor: 'pointer', userSelect: 'none' }}>
                Services ▾
              </span>
              <div
                className="dropdown-menu"
                style={{
                  opacity: dropdownOpen === 'services' ? 1 : 0,
                  visibility: dropdownOpen === 'services' ? 'visible' : 'hidden',
                  transform: dropdownOpen === 'services' ? 'translateY(0)' : 'translateY(-10px)',
                  transition: 'all 0.2s ease',
                  zIndex: 1000,
                }}
              >
                <Link
                  to="/services"
                  className="dropdown-item"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setDropdownOpen(null);
                  }}
                >
                  📦 Delivery Services
                </Link>
                <Link
                  to="/pricing"
                  className="dropdown-item"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setDropdownOpen(null);
                  }}
                >
                  💰 Pricing
                </Link>
                <Link
                  to="/track"
                  className="dropdown-item"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setDropdownOpen(null);
                  }}
                >
                  🔍 Track Package
                </Link>
                <Link
                  to="/coverage"
                  className="dropdown-item"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setDropdownOpen(null);
                  }}
                >
                  🗺️ Coverage Map
                </Link>
              </div>
            </div>

            <Link to="/fleet" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Fleet</Link>
            <Link to="/about" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            <Link to="/contact" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Contact</Link>

            {/* Business Solutions */}
            <Link to="/business" className="nav-link" style={{
              background: 'var(--accent)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontWeight: '600'
            }} onClick={() => setIsMobileMenuOpen(false)}>For Businesses</Link>

            {user && user.role === 'DISPATCHER' && (
              <Link to="/dispatch/orders" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Dispatch</Link>
            )}

            {user && user.role === 'ADMIN' && (
              <Link to="/admin/dashboard" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Admin Dashboard</Link>
            )}
            {user ? (
              <>
                <div 
                  className="nav-user"
                  onMouseEnter={() => setUserDropdownOpen(true)}
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  style={{ position: 'relative' }}
                >
                  {user.profilePictureUrl && getProfilePictureUrl(user) ? (
                    <img
                      src={getProfilePictureUrl(user)}
                      alt={user.username}
                      className="avatar-image-small"
                      title={user.username}
                    />
                  ) : (
                    <div className="avatar">{getInitials(user)}</div>
                  )}
                  <span className="greeting">Hi, {user.username || user.email || 'User'}</span>
                  
                  <div
                    className="user-dropdown-menu"
                    style={{
                      opacity: userDropdownOpen ? 1 : 0,
                      visibility: userDropdownOpen ? 'visible' : 'hidden',
                      transform: userDropdownOpen ? 'translateY(0)' : 'translateY(-10px)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Link
                      to="/profile"
                      className="user-dropdown-item"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setUserDropdownOpen(false);
                      }}
                    >
                      👤 My Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="user-dropdown-item"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link to="/drivers" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Join as Driver
                </Link>
                <Link to="/login" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                  Login
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      {/* Footer outside main-content for full width */}
      <FooterLayout showFooter={showFooter} />
    </div>
  );
};

export default MainLayout;
