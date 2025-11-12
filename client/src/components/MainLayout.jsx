import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { authService } from '../services';
import './layout.css';

const MainLayout = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            <Link to="/about" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            {user && user.role === 'ADMIN' && (
              <Link to="/admin/dashboard" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>Admin Panel</Link>
            )}
            {user ? (
              <>
                <div className="nav-user">
                  {user.profilePictureUrl ? (
                    <img 
                      src={user.profilePictureUrl} 
                      alt={user.username}
                      className="avatar-image-small"
                      title={user.username}
                    />
                  ) : (
                    <div className="avatar">{getInitials(user)}</div>
                  )}
                  <span className="greeting">Hi, {user.username || user.email || 'User'}</span>
                </div>
                <button onClick={handleLogout} className="nav-link logout-button">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
