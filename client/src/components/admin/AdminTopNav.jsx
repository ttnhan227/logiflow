import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import NotificationBell from '../common/NotificationBell';
import './admin.css';

const AdminTopNav = ({ user, onLogout, className = '' }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getProfilePictureUrl = (u) => {
    if (!u?.profilePictureUrl) return null;
    if (u.profilePictureUrl.startsWith('http://') || u.profilePictureUrl.startsWith('https://')) {
      return u.profilePictureUrl;
    }
    const baseUrl = authService.getBaseUrl();
    return `${baseUrl}${u.profilePictureUrl.startsWith('/') ? '' : '/'}${u.profilePictureUrl}`;
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setDropdownOpen(false);
  };

  return (
    <div className={`admin-topnav ${className}`}>
      <div className="admin-topnav-content">
        {/* User Profile Section */}
        <div className="topnav-right">
          {/* Notification Bell */}
          <NotificationBell />

          {/* User Dropdown */}
          <div className="user-dropdown">
            <button 
              className="user-dropdown-trigger"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
            >
              {user?.profilePictureUrl && getProfilePictureUrl(user) ? (
                <img 
                  src={getProfilePictureUrl(user)} 
                  alt={user?.username}
                  className="topnav-avatar-image"
                />
              ) : (
                <div className="topnav-avatar">
                  {user?.username?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}
              <div className="user-info">
                <div className="user-name">{user?.username || 'Admin'}</div>
                <div className="user-role">{user?.role || 'ADMIN'}</div>
              </div>
              <span className="dropdown-chevron">{dropdownOpen ? '▲' : '▼'}</span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div 
                  className="dropdown-overlay" 
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="user-dropdown-menu">
                  <button 
                    className="dropdown-item"
                    onClick={handleProfileClick}
                  >
                    <span className="dropdown-icon">👤</span>
                    My Profile
                  </button>
                  <div className="dropdown-divider" />
                  <button 
                    className="dropdown-item logout-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                  >
                    <span className="dropdown-icon">🚪</span>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTopNav;

