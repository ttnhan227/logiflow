import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../../services';
import './admin.css';

const AdminUserEditPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    profilePictureUrl: '',
    role: '',
    active: true,
  });

  const roles = ['ADMIN', 'MANAGER', 'DISPATCHER', 'DRIVER', 'CUSTOMER'];

  const rolePermissions = {
    ADMIN: ['Full system access', 'User management', 'System configuration'],
    MANAGER: ['View all routes', 'Assign drivers', 'Generate reports'],
    DISPATCHER: ['Create routes', 'Assign orders', 'Track drivers'],
    DRIVER: ['View assigned routes', 'Update delivery status', 'Upload photos'],
    CUSTOMER: ['Place orders', 'Track deliveries', 'View history'],
  };

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await userService.getUserById(parseInt(userId));
        setUser(data);
        setForm({
          username: data.username,
          email: data.email,
          fullName: data.fullName || '',
          phone: data.phone || '',
          profilePictureUrl: data.profilePictureUrl || '',
          role: data.role,
          active: data.active,
        });
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.username.trim()) {
      setError('Username is required');
      return;
    }
    if (!form.email.trim()) {
      setError('Email is required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await userService.updateUser({
        id: parseInt(userId),
        username: form.username,
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        profilePictureUrl: form.profilePictureUrl,
        role: form.role,
        active: form.active,
      });
      navigate('/admin/users');
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>✏️ Edit User</h1>
        </div>
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading user details...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>✏️ Edit User</h1>
        </div>
        <div className="error-banner">{error || 'User not found'}</div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <h1>✏️ Edit User</h1>
        <p>Editing {user.username}</p>
      </div>

      {/* Error banner */}
      {error && <div className="error-banner">{error}</div>}

      {/* Main Content */}
      <div className="admin-details-container">
        <form onSubmit={handleSubmit}>
          {/* Personal Information Card */}
          <div className="details-card">
            <div className="card-header">
              <h2>Personal Information</h2>
            </div>
            <div className="card-content">
              <div className="details-grid">
                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="Enter email"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="form-group">
                  <label>Profile Picture URL</label>
                  <input
                    type="text"
                    name="profilePictureUrl"
                    value={form.profilePictureUrl}
                    onChange={handleInputChange}
                    placeholder="Enter profile picture URL"
                  />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <input
                      type="checkbox"
                      name="active"
                      checked={form.active}
                      onChange={handleInputChange}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Card */}
          {form.role && rolePermissions[form.role] && (
            <div className="details-card">
              <div className="card-header">
                <h2>Role Permissions</h2>
              </div>
              <div className="card-content">
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', lineHeight: '1.8' }}>
                  {rolePermissions[form.role].map((perm, idx) => (
                    <li key={idx} style={{ color: 'var(--text-color)' }}>{perm}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="admin-edit-actions">
            <button 
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/admin/users')}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn"
              disabled={submitting}
            >
              {submitting ? '⏳ Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserEditPage;
