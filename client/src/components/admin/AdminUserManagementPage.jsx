import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services';
import Modal from './Modal';
import './admin.css';
import './modal.css';

// Role color mapping
const ROLE_COLORS = {
  ADMIN: '#9333ea',      // purple
  MANAGER: '#3b82f6',    // blue
  DISPATCHER: '#22c55e', // green
  DRIVER: '#f97316',     // orange
  CUSTOMER: '#64748b',   // gray
};

const ROLE_IDS = { ADMIN: 1, MANAGER: 2, DISPATCHER: 3, DRIVER: 4, CUSTOMER: 5 };

// Format date utility
const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Check if today
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  // Check if yesterday
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  // Otherwise show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
};

// Role icon mapping
const ROLE_ICONS = {
  ADMIN: '👨‍💼',
  MANAGER: '📊',
  DISPATCHER: '📦',
  DRIVER: '🚗',
  CUSTOMER: '👤',
};

// Avatar component with profile picture or initials
const Avatar = ({ name, profilePictureUrl }) => {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  
  if (profilePictureUrl) {
    return (
      <img 
        src={profilePictureUrl} 
        alt={name}
        className="avatar-image"
        title={name}
      />
    );
  }
  
  return (
    <div className="avatar">
      {initials}
    </div>
  );
};

// Role badge with color and icon
const RoleBadge = ({ role }) => {
  const cls = `role-badge ${role ? role.toLowerCase() : ''}`;
  const icon = ROLE_ICONS[role] || '❓';
  return (
    <span className={cls}>
      <span style={{ marginRight: '4px' }}>{icon}</span>
      {role || 'N/A'}
    </span>
  );
};

// Status toggle (styled switch)
const StatusToggle = ({ active, onChange, disabled, title }) => {
  return (
    <label 
      className={`status-toggle ${disabled ? 'disabled' : ''}`} 
      aria-checked={!!active} 
      role="switch"
      title={title}
    >
      <input
        type="checkbox"
        checked={!!active}
        onChange={onChange}
        disabled={disabled}
        aria-label={active ? 'Deactivate user' : 'Activate user'}
      />
      <span className="slider" />
    </label>
  );
};

// Three-dot menu
const ActionsMenu = ({ user, onEdit, onDelete, onViewDetails }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="actions-menu">
      <button
        className="actions-menu-btn"
        onClick={() => setOpen(!open)}
        title="More actions"
      >
        ⋮
      </button>
      {open && (
        <>
          <div
            className="actions-overlay"
            onClick={() => setOpen(false)}
          />
          <div className="actions-popover">
            <button
              onClick={() => {
                onViewDetails(user);
                setOpen(false);
              }}
            >
              👁️ View Details
            </button>
            <button
              onClick={() => {
                onEdit(user);
                setOpen(false);
              }}
            >
              ✉️ Send Email
            </button>
            <div style={{ margin: '4px 0', borderTop: '1px solid rgba(0,0,0,0.06)' }} />
            <button
              className="danger"
              onClick={() => {
                onDelete(user);
                setOpen(false);
              }}
            >
              🗑️ Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Modal for Add/Edit
const UserModal = ({ user, onClose, onSave, roles }) => {
  const [form, setForm] = useState({
    id: user?.id || null,
    username: user?.username || '',
    email: user?.email || '',
    phone: '',
    role: user?.role || 'DISPATCHER',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const rolePermissions = {
    ADMIN: ['Full system access', 'User management', 'System configuration'],
    MANAGER: ['View all routes', 'Assign drivers', 'Generate reports'],
    DISPATCHER: ['Create routes', 'Assign orders', 'Track drivers'],
    DRIVER: ['View assigned routes', 'Update delivery status', 'Upload photos'],
    CUSTOMER: ['Place orders', 'Track deliveries', 'View history'],
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (form.id) {
        await onSave({ ...form });
      } else {
        const roleId = ROLE_IDS[form.role];
        if (!roleId) throw new Error('Invalid role selected');
        if (!form.password || form.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await onSave({ ...form, roleId });
      }
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={form.id ? '✏️ Edit User' : '➕ Add New User'}
      size="medium"
      isLoading={submitting}
    >
      {error && <div className="modal-error">{error}</div>}
      
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-row full">
          <div className="form-group">
            <label>
              Name <span className="required">*</span>
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Enter user's full name"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(123) 456-7890"
            />
          </div>
        </div>

        <div className="form-row full">
          <div className="form-group">
            <label>
              Role <span className="required">*</span>
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!form.id && (
          <div className="form-row full">
            <div className="form-group">
              <label>
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
                required={!form.id}
              />
              <div className="form-help">Minimum 6 characters</div>
            </div>
          </div>
        )}

        {form.role && rolePermissions[form.role] && (
          <div className="form-row full" style={{ marginTop: '8px' }}>
            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
              <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '13px' }}>
                Role Permissions:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
                {rolePermissions[form.role].map((perm, idx) => (
                  <li key={idx}>{perm}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </form>

      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '⏳ Saving...' : form.id ? '💾 Save Changes' : '➕ Add User'}
        </button>
      </div>
    </Modal>
  );
};

// Main component
const UserManagementPage = () => {
  const navigate = useNavigate();
  // Available roles for creating/editing users (ADMIN excluded)
  const roles = ['MANAGER', 'DISPATCHER', 'DRIVER', 'CUSTOMER'];
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getUsers(0, 1000);
      const list = (data.content || []).filter((u) => u.role !== 'ADMIN');
      setUsers(list);
      setFilteredUsers(list);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    let result = users;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.username?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
      );
    }
    setFilteredUsers(result);
    setPage(0);
  }, [searchTerm, users]);

  const handleToggleStatus = async (user) => {
    try {
      await userService.toggleUserStatus(user.id);
      await loadUsers();
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to toggle status');
    }
  };

  const handleSave = async (formData) => {
    if (formData.id) {
      await userService.updateUser(formData);
    } else {
      await userService.createUser(formData);
    }
    await loadUsers();
  };

  const paginatedUsers = filteredUsers.slice(page * size, (page + 1) * size);
  const totalPages = Math.ceil(filteredUsers.length / size);

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <h1>👥 User Management</h1>
        <p>Manage your team members and their permissions</p>
      </div>

      {/* Error banner */}
      {error && <div className="error-banner">{error}</div>}

      {/* Toolbar */}
      <div className="admin-page-toolbar">
        <input
          type="text"
          placeholder="🔍 Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="btn"
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
        >
          ➕ Add User
        </button>
      </div>

      {/* Table or Empty State */}
      {loading ? (
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading users...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">No users found</div>
          <div className="empty-state-description">
            {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first user'}
          </div>
        </div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-row">
                        <Avatar name={user.username} profilePictureUrl={user.profilePictureUrl} />
                        <div className="user-info">
                          <div className="user-name">{user.username}</div>
                          <div className="user-id">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <RoleBadge role={user.role} />
                    </td>
                    <td>
                      <span className="table-date">{formatDate(user.createdAt)}</span>
                    </td>
                    <td>
                      <span className="table-date">{formatDate(user.lastLogin)}</span>
                    </td>
                    <td>
                      <StatusToggle
                        active={user.active}
                        onChange={() => handleToggleStatus(user)}
                        disabled={user.role === 'ADMIN'}
                        title={user.role === 'ADMIN' ? 'Cannot deactivate admin users' : 'Toggle user status'}
                      />
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="action-btn"
                          title="View details"
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                        >
                          👁️
                        </button>
                        <button
                          className="action-btn"
                          title="Edit user"
                          onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                        >
                          ✏️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {page * size + 1} to {Math.min((page + 1) * size, filteredUsers.length)} of{' '}
                {filteredUsers.length} users
              </div>
              <div className="pagination-controls">
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  ← Previous
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setPage(page + 1)}
                  disabled={page + 1 >= totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={handleSave}
          roles={roles}
        />
      )}
    </div>
  );
};

export default UserManagementPage;
