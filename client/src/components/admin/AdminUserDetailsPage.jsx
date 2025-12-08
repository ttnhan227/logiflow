import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../../services';
import './admin.css';

const AdminUserDetailsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await userService.getUserById(parseInt(userId));
        setUser(data);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Failed to load user details');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadUserDetails();
    }
  }, [userId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>👤 User Details</h1>
        </div>
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading user details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>👤 User Details</h1>
        </div>
        <div className="error-banner">{error}</div>
        <div style={{ padding: '20px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/users')}>
            ← Back to Users
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>👤 User Details</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <div className="empty-state-title">User Not Found</div>
          <div className="empty-state-description">The user you're looking for doesn't exist.</div>
        </div>
        <div style={{ padding: '20px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/users')}>
            ← Back to Users
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadgeColor = (isActive) => {
    return isActive ? '#dcfce7' : '#fee2e2';
  };

  const getStatusTextColor = (isActive) => {
    return isActive ? '#166534' : '#991b1b';
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>👤 User Details</h1>
            <p>Viewing details for {user.username}</p>
          </div>
          <button 
            className="btn"
            onClick={() => navigate(`/admin/users/${userId}/edit`)}
          >
            ✏️ Edit User
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-details-container">
        {/* Personal Information Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>Personal Information</h2>
          </div>
          <div className="card-content">
            <div className="details-grid">
              <div className="detail-item">
                <label>Username</label>
                <div className="detail-value">{user.username}</div>
              </div>
              <div className="detail-item">
                <label>Full Name</label>
                <div className="detail-value">{user.fullName || '—'}</div>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <div className="detail-value">{user.email}</div>
              </div>
              <div className="detail-item">
                <label>Phone</label>
                <div className="detail-value">{user.phone || '—'}</div>
              </div>
              <div className="detail-item">
                <label>Role</label>
                <div className="detail-value">
                  <span className={`role-badge ${user.role?.toLowerCase()}`}>
                    {user.role || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <label>Status</label>
                <div className="detail-value">
                  <span 
                    style={{
                      display: 'inline-block',
                      padding: '6px 14px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: getStatusBadgeColor(user.active),
                      color: getStatusTextColor(user.active),
                    }}
                  >
                    {user.active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Picture Card (if available) */}
        {user.profilePictureUrl && (
          <div className="details-card">
            <div className="card-header">
              <h2>Profile Picture</h2>
            </div>
            <div className="card-content profile-picture-container">
              <img 
                src={user.profilePictureUrl} 
                alt="Profile" 
                className="profile-picture-img"
              />
            </div>
          </div>
        )}

        {/* Account Activity Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>Account Activity</h2>
          </div>
          <div className="card-content">
            <div className="details-grid">
              <div className="detail-item">
                <label>Created At</label>
                <div className="detail-value detail-date">
                  {formatDate(user.createdAt)}
                </div>
              </div>
              <div className="detail-item">
                <label>Last Login</label>
                <div className="detail-value detail-date">
                  {user.lastLogin ? formatDate(user.lastLogin) : 'Never logged in'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="admin-details-actions">
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/admin/users')}
        >
          ← Back to Users
        </button>
      </div>
    </div>
  );
};

export default AdminUserDetailsPage;
