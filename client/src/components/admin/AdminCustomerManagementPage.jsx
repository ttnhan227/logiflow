import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services';
import Modal from './Modal';
import './admin.css';
import './modal.css';

// Role color mapping
const ROLE_COLORS = {
  CUSTOMER: '#64748b', // gray
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
        aria-label={active ? 'Deactivate customer' : 'Activate customer'}
      />
      <span className="slider" />
    </label>
  );
};

// Modal for Add/Edit
const CustomerModal = ({ customer, onClose, onSave }) => {
  const [form, setForm] = useState({
    id: customer?.id || null,
    username: customer?.username || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    role: 'CUSTOMER',
    password: '',
    // Customer-specific fields
    companyName: customer?.companyName || '',
    companyCode: customer?.companyCode || '',
    defaultDeliveryAddress: customer?.defaultDeliveryAddress || '',
    preferredPaymentMethod: customer?.preferredPaymentMethod || 'CASH',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const paymentMethods = ['CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (form.id) {
        await onSave({ ...form });
      } else {
        const roleId = 5; // CUSTOMER role ID
        if (!form.password || form.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
        await onSave({ ...form, roleId });
      }
      onClose();
    } catch (err) {
      setError(typeof err === 'string' ? err : err.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={form.id ? '✏️ Edit Customer' : '➕ Add New Customer'}
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
              placeholder="Enter customer's full name"
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
              placeholder="customer@example.com"
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
            <label>Company Name</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="ABC Corporation"
            />
          </div>

          <div className="form-group">
            <label>Company Code</label>
            <input
              type="text"
              value={form.companyCode}
              onChange={(e) => setForm({ ...form, companyCode: e.target.value })}
              placeholder="ABC001"
            />
          </div>
        </div>

        <div className="form-row full">
          <div className="form-group">
            <label>Default Delivery Address</label>
            <textarea
              value={form.defaultDeliveryAddress}
              onChange={(e) => setForm({ ...form, defaultDeliveryAddress: e.target.value })}
              placeholder="123 Main St, City, State 12345"
              rows={3}
            />
          </div>
        </div>

        <div className="form-row full">
          <div className="form-group">
            <label>Preferred Payment Method</label>
            <select
              value={form.preferredPaymentMethod}
              onChange={(e) => setForm({ ...form, preferredPaymentMethod: e.target.value })}
            >
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method.replace('_', ' ')}
                </option>
              ))}
            </select>
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
          {submitting ? '⏳ Saving...' : form.id ? '💾 Save Changes' : '➕ Add Customer'}
        </button>
      </div>
    </Modal>
  );
};

// Main component
const AdminCustomerManagementPage = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getCustomers(0, 1000);
      setCustomers(data.content);
      setFilteredCustomers(data.content);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    let result = customers;
    // Filter by search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.username?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.companyName?.toLowerCase().includes(term) ||
          c.companyCode?.toLowerCase().includes(term)
      );
    }
    setFilteredCustomers(result);
    setPage(0);
  }, [searchTerm, customers]);

  const handleToggleStatus = async (customer) => {
    try {
      await userService.toggleUserStatus(customer.id);
      await loadCustomers();
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
    await loadCustomers();
  };

  const paginatedCustomers = filteredCustomers.slice(page * size, (page + 1) * size);
  const totalPages = Math.ceil(filteredCustomers.length / size);

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <h1>👤 Customer Management</h1>
        <p>Manage your customer accounts and their preferences</p>
      </div>

      {/* Error banner */}
      {error && <div className="error-banner">{error}</div>}

      {/* Toolbar */}
      <div className="admin-page-toolbar">
        <input
          type="text"
          placeholder="🔍 Search by name, email, company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="btn"
          onClick={() => {
            setEditingCustomer(null);
            setShowModal(true);
          }}
        >
          ➕ Add Customer
        </button>
      </div>

      {/* Table or Empty State */}
      {loading ? (
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading customers...
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👤</div>
          <div className="empty-state-title">No customers found</div>
          <div className="empty-state-description">
            {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first customer'}
          </div>
        </div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>CUSTOMER</th>
                  <th>EMAIL</th>
                  <th>COMPANY</th>
                  <th>PAYMENT METHOD</th>
                  <th>TOTAL ORDERS</th>
                  <th>TOTAL SPENT</th>
                  <th>LAST ORDER</th>
                  <th>LAST LOGIN</th>
                  <th>ACTIVE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="user-row">
                        <Avatar name={customer.username} profilePictureUrl={customer.profilePictureUrl} />
                        <div className="user-info">
                          <div className="user-name">{customer.username}</div>
                          <div className="user-id">ID: {customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{customer.email}</td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        {customer.companyName ? (
                          <>
                            <div style={{ fontWeight: '600' }}>{customer.companyName}</div>
                            {customer.companyCode && (
                              <div style={{ color: '#666' }}>Code: {customer.companyCode}</div>
                            )}
                          </>
                        ) : (
                          <span style={{ color: '#999' }}>Individual</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${customer.preferredPaymentMethod?.toLowerCase().replace('_', '-')}`} style={{ color: customer.preferredPaymentMethod?.toLowerCase() === 'digital_wallet' ? '#92400e' : undefined }}>
                        {customer.preferredPaymentMethod?.replace('_', ' ') || 'Not Set'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>
                      {customer.totalOrders || 0}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>
                      ${(customer.totalSpent || 0).toFixed(2)}
                    </td>
                    <td>
                      <span className="table-date">
                        {customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Never'}
                      </span>
                    </td>
                    <td>
                      <span className="table-date">{formatDate(customer.lastLogin)}</span>
                    </td>
                    <td>
                      <StatusToggle
                        active={customer.active}
                        onChange={() => handleToggleStatus(customer)}
                        title="Toggle customer status"
                      />
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="action-btn"
                          title="View details"
                          onClick={() => navigate(`/admin/users/customers/${customer.id}`)}
                        >
                          👁️
                        </button>
                        <button
                          className="action-btn"
                          title="Edit customer"
                          onClick={() => {
                            setEditingCustomer(customer);
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
                Showing {page * size + 1} to {Math.min((page + 1) * size, filteredCustomers.length)} of{' '}
                {filteredCustomers.length} customers
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
        <CustomerModal
          customer={editingCustomer}
          onClose={() => {
            setShowModal(false);
            setEditingCustomer(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default AdminCustomerManagementPage;
