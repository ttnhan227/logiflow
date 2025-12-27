import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { userService } from '../../services';
import './admin.css';

const AdminUserDetailsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [roleSpecificData, setRoleSpecificData] = useState(null);

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // First get basic user data
        const data = await userService.getUserById(parseInt(userId));
        setUser(data);

        // Load role-specific extended data
        if (data && data.role) {
          try {
            let extendedData = null;
            if (data.role === 'DRIVER') {
              // Search for this specific driver to get extended data
              const driversResult = await userService.searchDrivers(data.username, 0, 1);
              extendedData = driversResult.content.find(d => d.id === parseInt(userId));
            } else if (data.role === 'CUSTOMER') {
              // Search for this specific customer to get extended data
              const customersResult = await userService.searchCustomers(data.username, 0, 1);
              extendedData = customersResult.content.find(c => c.id === parseInt(userId));
            } else if (data.role === 'DISPATCHER') {
              // Search for this specific dispatcher to get extended data
              const dispatchersResult = await userService.searchDispatchers(data.username, 0, 1);
              extendedData = dispatchersResult.content.find(d => d.id === parseInt(userId));
            }

            if (extendedData) {
              setRoleSpecificData(extendedData);
            } else {
              // Fallback to basic user data
              setRoleSpecificData(data);
            }
          } catch (roleErr) {
            // If extended data fetch fails, use basic data
            console.warn('Could not load role-specific data:', roleErr);
            setRoleSpecificData(data);
          }
        }
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
          <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
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
          <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
            ← Back to Dashboard
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

        {/* Role-Specific Information Cards */}
        {user.role === 'DRIVER' && roleSpecificData && (
          <div className="details-card">
            <div className="card-header">
              <h2>🚗 Driver Information</h2>
            </div>
            <div className="card-content">
              <div className="details-grid">
                <div className="detail-item">
                  <label>License Type</label>
                  <div className="detail-value">{roleSpecificData.licenseType || 'N/A'}</div>
                </div>
                <div className="detail-item">
                  <label>License Number</label>
                  <div className="detail-value">{roleSpecificData.licenseNumber || 'N/A'}</div>
                </div>
                <div className="detail-item">
                  <label>License Issue Date</label>
                  <div className="detail-value detail-date">{roleSpecificData.licenseIssueDate ? formatDate(roleSpecificData.licenseIssueDate) : 'N/A'}</div>
                </div>
                <div className="detail-item">
                  <label>License Expiry Date</label>
                  <div className="detail-value detail-date">{roleSpecificData.licenseExpiryDate ? formatDate(roleSpecificData.licenseExpiryDate) : 'N/A'}</div>
                </div>
                <div className="detail-item">
                  <label>Years Experience</label>
                  <div className="detail-value">{roleSpecificData.yearsExperience || 0}</div>
                </div>
                <div className="detail-item">
                  <label>Health Status</label>
                  <div className="detail-value">
                    <span className={`status-badge ${roleSpecificData.healthStatus?.toLowerCase()}`}>
                      {roleSpecificData.healthStatus || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <label>Current Status</label>
                  <div className="detail-value">
                    <span className={`status-badge ${roleSpecificData.status?.toLowerCase()}`}>
                      {roleSpecificData.status || 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <label>Rating</label>
                  <div className="detail-value">{roleSpecificData.rating ? `${roleSpecificData.rating}/5.0` : 'Not rated'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {user.role === 'CUSTOMER' && roleSpecificData && (
          <div className="details-card">
            <div className="card-header">
              <h2>👤 Customer Information</h2>
            </div>
            <div className="card-content">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Company Name</label>
                  <div className="detail-value">{roleSpecificData.companyName || 'Individual Customer'}</div>
                </div>
                <div className="detail-item">
                  <label>Company Code</label>
                  <div className="detail-value">{roleSpecificData.companyCode || 'N/A'}</div>
                </div>
                <div className="detail-item">
                  <label>Preferred Payment Method</label>
                  <div className="detail-value">{roleSpecificData.preferredPaymentMethod?.replace('_', ' ') || 'Not specified'}</div>
                </div>
                <div className="detail-item">
                  <label>Total Orders</label>
                  <div className="detail-value">{roleSpecificData.totalOrders || 0}</div>
                </div>
                <div className="detail-item">
                  <label>Total Spent</label>
                  <div className="detail-value">${(roleSpecificData.totalSpent || 0).toFixed(2)}</div>
                </div>
                <div className="detail-item">
                  <label>Last Order Date</label>
                  <div className="detail-value detail-date">{roleSpecificData.lastOrderDate ? formatDate(roleSpecificData.lastOrderDate) : 'Never'}</div>
                </div>
              </div>
              {roleSpecificData.defaultDeliveryAddress && (
                <div className="detail-item" style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                  <label>Default Delivery Address</label>
                  <div className="detail-value" style={{ whiteSpace: 'pre-wrap', minHeight: '60px' }}>
                    {roleSpecificData.defaultDeliveryAddress}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {user.role === 'DISPATCHER' && (
          <div className="details-card">
            <div className="card-header">
              <h2>📦 Dispatcher Permissions</h2>
            </div>
            <div className="card-content">
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <label>Role Capabilities</label>
                <div className="detail-value" style={{ background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                  <ul style={{ margin: 0, paddingLeft: '20px', listStyle: 'none', color: '#16a34a' }}>
                    <li style={{ marginBottom: '8px' }}>• Create and manage delivery routes</li>
                    <li style={{ marginBottom: '8px' }}>• Assign orders to drivers</li>
                    <li style={{ marginBottom: '8px' }}>• Track delivery progress in real-time</li>
                    <li style={{ marginBottom: '8px' }}>• Handle customer service inquiries</li>
                    <li style={{ marginBottom: '8px' }}>• Generate delivery reports</li>
                    <li style={{ marginBottom: '8px' }}>• Monitor fleet performance</li>
                    <li>• Manage trip assignments</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="admin-details-actions">
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/admin/users/' + user.role.toLowerCase() + 's')}
        >
          ← Back to Users
        </button>
      </div>
    </div>
  );
};

export default AdminUserDetailsPage;
