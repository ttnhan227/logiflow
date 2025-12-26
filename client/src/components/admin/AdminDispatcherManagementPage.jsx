import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services';
import Modal from './Modal';
import './admin.css';
import './modal.css';

// Role color mapping
const ROLE_COLORS = {
  DISPATCHER: '#22c55e', // green
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
  DISPATCHER: '📦',
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
        aria-label={active ? 'Deactivate dispatcher' : 'Activate dispatcher'}
      />
      <span className="slider" />
    </label>
  );
};

// Modal for Add/Edit
const DispatcherModal = ({ dispatcher, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: dispatcher?.id || null,
    username: dispatcher?.username || '',
    email: dispatcher?.email || '',
    phone: dispatcher?.phone || '',
    role: 'DISPATCHER',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (form.id) {
        await onSave({ ...form });
      } else {
        const roleId = 3; // DISPATCHER role ID
        if (!form.password || form.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await onSave({ ...form, roleId });
      }
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to save dispatcher');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={form.id ? '✏️ Edit Dispatcher' : '➕ Add New Dispatcher'}
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
              placeholder="Enter dispatcher's full name"
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
              placeholder="dispatcher@example.com"
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

        <div className="form-row full" style={{ marginTop: '16px' }}>
          <div style={{ padding: '12px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            <div style={{ fontWeight: '600', marginBottom: '8px', fontSize: '13px', color: '#16a34a' }}>
              Dispatcher Permissions:
            </div>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#374151' }}>
              <li>Create and manage delivery routes</li>
              <li>Assign orders to drivers</li>
              <li>Track delivery progress in real-time</li>
              <li>Handle customer service inquiries</li>
              <li>Generate delivery reports</li>
            </ul>
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
          {submitting ? '⏳ Saving...' : form.id ? '💾 Save Changes' : '➕ Add Dispatcher'}
        </button>
      </div>
    </Modal>
  );
};

// Main component
const AdminDispatcherManagementPage = () => {
  const navigate = useNavigate();
  const [dispatchers, setDispatchers] = useState([]);
  const [filteredDispatchers, setFilteredDispatchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDispatcher, setEditingDispatcher] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const loadDispatchers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getDispatchers(0, 1000);
      setDispatchers(data.content);
      setFilteredDispatchers(data.content);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load dispatchers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDispatchers();
  }, []);

  useEffect(() => {
    let result = dispatchers;
    // Filter by search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (d) =>
          d.username?.toLowerCase().includes(term) ||
          d.email?.toLowerCase().includes(term)
      );
    }
    setFilteredDispatchers(result);
    setPage(0);
  }, [searchTerm, dispatchers]);

  const handleToggleStatus = async (dispatcher) => {
    try {
      await userService.toggleUserStatus(dispatcher.id);
      await loadDispatchers();
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
    await loadDispatchers();
  };

  const paginatedDispatchers = filteredDispatchers.slice(page * size, (page + 1) * size);
  const totalPages = Math.ceil(filteredDispatchers.length / size);

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <h1>📦 Dispatcher Management</h1>
        <p>Manage your dispatch team members and their operations access</p>
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
            setEditingDispatcher(null);
            setShowModal(true);
          }}
        >
          ➕ Add Dispatcher
        </button>
      </div>

      {/* Table or Empty State */}
      {loading ? (
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading dispatchers...
        </div>
      ) : filteredDispatchers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <div className="empty-state-title">No dispatchers found</div>
          <div className="empty-state-description">
            {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first dispatcher'}
          </div>
        </div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>DISPATCHER</th>
                  <th>EMAIL</th>
                  <th>PHONE</th>
                  <th>CREATED</th>
                  <th>LAST LOGIN</th>
                  <th>ACTIVE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDispatchers.map((dispatcher) => (
                  <tr key={dispatcher.id}>
                    <td>
                      <div className="user-row">
                        <Avatar name={dispatcher.username} profilePictureUrl={dispatcher.profilePictureUrl} />
                        <div className="user-info">
                          <div className="user-name">{dispatcher.username}</div>
                          <div className="user-id">ID: {dispatcher.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{dispatcher.email}</td>
                    <td>{dispatcher.phone || 'Not provided'}</td>
                    <td>
                      <span className="table-date">{formatDate(dispatcher.createdAt)}</span>
                    </td>
                    <td>
                      <span className="table-date">{formatDate(dispatcher.lastLogin)}</span>
                    </td>
                    <td>
                      <StatusToggle
                        active={dispatcher.active}
                        onChange={() => handleToggleStatus(dispatcher)}
                        title="Toggle dispatcher status"
                      />
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="action-btn"
                          title="View details"
                          onClick={() => navigate(`/admin/users/dispatchers/${dispatcher.id}`)}
                        >
                          👁️
                        </button>
                        <button
                          className="action-btn"
                          title="Edit dispatcher"
                          onClick={() => {
                            setEditingDispatcher(dispatcher);
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
                Showing {page * size + 1} to {Math.min((page + 1) * size, filteredDispatchers.length)} of{' '}
                {filteredDispatchers.length} dispatchers
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
        <DispatcherModal
          dispatcher={editingDispatcher}
          onClose={() => {
            setShowModal(false);
            setEditingDispatcher(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default AdminDispatcherManagementPage;
