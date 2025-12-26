import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services';
import Modal from './Modal';
import './admin.css';
import './modal.css';

// Role color mapping
const ROLE_COLORS = {
  DRIVER: '#f97316', // orange
};

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
  DRIVER: '🚗',
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
        aria-label={active ? 'Deactivate driver' : 'Activate driver'}
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
const DriverModal = ({ driver, onClose, onSave, roles }) => {
  const [form, setForm] = useState({
    id: driver?.id || null,
    username: driver?.username || '',
    email: driver?.email || '',
    phone: driver?.phone || '',
    role: 'DRIVER',
    password: '',
    // Driver-specific fields
    licenseType: driver?.licenseType || 'STANDARD',
    licenseNumber: driver?.licenseNumber || '',
    licenseExpiryDate: driver?.licenseExpiryDate || '',
    licenseIssueDate: driver?.licenseIssueDate || '',
    yearsExperience: driver?.yearsExperience || 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const licenseTypes = ['STANDARD', 'COMMERCIAL', 'HEAVY_VEHICLE'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (form.id) {
        await onSave({ ...form });
      } else {
        const roleId = 4; // DRIVER role ID
        if (!form.password || form.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await onSave({ ...form, roleId });
      }
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to save driver');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={form.id ? '✏️ Edit Driver' : '➕ Add New Driver'}
      size="large"
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
              placeholder="Enter driver's full name"
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
              placeholder="driver@example.com"
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

        <div className="form-row">
          <div className="form-group">
            <label>
              License Type <span className="required">*</span>
            </label>
            <select
              value={form.licenseType}
              onChange={(e) => setForm({ ...form, licenseType: e.target.value })}
              required
            >
              {licenseTypes.map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              License Number <span className="required">*</span>
            </label>
            <input
              type="text"
              value={form.licenseNumber}
              onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              placeholder="DL123456789"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>License Issue Date</label>
            <input
              type="date"
              value={form.licenseIssueDate}
              onChange={(e) => setForm({ ...form, licenseIssueDate: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>License Expiry Date</label>
            <input
              type="date"
              value={form.licenseExpiryDate}
              onChange={(e) => setForm({ ...form, licenseExpiryDate: e.target.value })}
            />
          </div>
        </div>

        <div className="form-row full">
          <div className="form-group">
            <label>Years of Experience</label>
            <input
              type="number"
              min="0"
              max="50"
              value={form.yearsExperience}
              onChange={(e) => setForm({ ...form, yearsExperience: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
        </div>
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
          {submitting ? '⏳ Saving...' : form.id ? '💾 Save Changes' : '➕ Add Driver'}
        </button>
      </div>
    </Modal>
  );
};

// Main component
const AdminDriverManagementPage = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const loadDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getDrivers(0, 1000);
      setDrivers(data.content);
      setFilteredDrivers(data.content);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  useEffect(() => {
    let result = drivers;
    // Filter by search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.username?.toLowerCase().includes(term) ||
          d.email?.toLowerCase().includes(term) ||
          d.licenseNumber?.toLowerCase().includes(term)
      );
    }
    setFilteredDrivers(result);
    setPage(0);
  }, [searchTerm, drivers]);

  const handleToggleStatus = async (driver) => {
    try {
      await userService.toggleUserStatus(driver.id);
      await loadDrivers();
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
    await loadDrivers();
  };

  const paginatedDrivers = filteredDrivers.slice(page * size, (page + 1) * size);
  const totalPages = Math.ceil(filteredDrivers.length / size);

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <h1>🚗 Driver Management</h1>
        <p>Manage your driver team members and their credentials</p>
      </div>

      {/* Error banner */}
      {error && <div className="error-banner">{error}</div>}

      {/* Toolbar */}
      <div className="admin-page-toolbar">
        <input
          type="text"
          placeholder="🔍 Search by name, email, or license number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="btn"
          onClick={() => {
            setEditingDriver(null);
            setShowModal(true);
          }}
        >
          ➕ Add Driver
        </button>
      </div>

      {/* Table or Empty State */}
      {loading ? (
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading drivers...
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚗</div>
          <div className="empty-state-title">No drivers found</div>
          <div className="empty-state-description">
            {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first driver'}
          </div>
        </div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>DRIVER</th>
                  <th>EMAIL</th>
                  <th>LICENSE</th>
                  <th>EXPERIENCE</th>
                  <th>STATUS</th>
                  <th>HEALTH</th>
                  <th>LAST LOGIN</th>
                  <th>ACTIVE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDrivers.map((driver) => (
                  <tr key={driver.id}>
                    <td>
                      <div className="user-row">
                        <Avatar name={driver.username} profilePictureUrl={driver.profilePictureUrl} />
                        <div className="user-info">
                          <div className="user-name">{driver.username}</div>
                          <div className="user-id">ID: {driver.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{driver.email}</td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <div style={{ fontWeight: '600' }}>{driver.licenseNumber}</div>
                        <div style={{ color: '#666' }}>{driver.licenseType?.replace('_', ' ')}</div>
                      </div>
                    </td>
                    <td>{driver.yearsExperience} years</td>
                    <td>
                      <span className={`status-badge ${driver.status?.toLowerCase()}`}>
                        {driver.status || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${driver.healthStatus?.toLowerCase()}`}>
                        {driver.healthStatus || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <span className="table-date">{formatDate(driver.lastLogin)}</span>
                    </td>
                    <td>
                      <StatusToggle
                        active={driver.active}
                        onChange={() => handleToggleStatus(driver)}
                        title="Toggle driver status"
                      />
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="action-btn"
                          title="View details"
                          onClick={() => navigate(`/admin/users/drivers/${driver.id}`)}
                        >
                          👁️
                        </button>
                        <button
                          className="action-btn"
                          title="Edit driver"
                          onClick={() => {
                            setEditingDriver(driver);
                            setShowModal(true);
                          }}
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
                Showing {page * size + 1} to {Math.min((page + 1) * size, filteredDrivers.length)} of{' '}
                {filteredDrivers.length} drivers
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
        <DriverModal
          driver={editingDriver}
          onClose={() => {
            setShowModal(false);
            setEditingDriver(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default AdminDriverManagementPage;
