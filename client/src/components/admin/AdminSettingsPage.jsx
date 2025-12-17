import React, { useEffect, useState } from 'react';
import settingsService from '../../services/admin/settingsService';
import Modal from './Modal';
import './admin.css';
import './modal.css';

const PAGE_SIZE = 10;

const emptyForm = {
  category: '',
  key: '',
  value: '',
  isEncrypted: false,
  description: '',
};

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({ category: '', key: '', description: '', isEncrypted: '' });
  const [categories, setCategories] = useState([]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await settingsService.getAvailableCategories();
        // Add default logistics categories if not present
        const logisticsCategories = ['compliance', 'routing', 'work-rest', 'notifications'];
        const allCategories = [...new Set([...(data || []), ...logisticsCategories])];
        setCategories(allCategories);
      } catch (err) {
        console.error('Failed to load categories:', err);
        // Fallback to logistics categories
        setCategories(['compliance', 'routing', 'work-rest', 'notifications', 'integration', 'security']);
      }
    };
    fetchCategories();
  }, []);

  const fetchSettings = async (pageNum = 0, filterObj = filters) => {
    setLoading(true);
    try {
      const hasFilters = filterObj.category || filterObj.key || filterObj.description || filterObj.isEncrypted;
      
      let data;
      if (hasFilters) {
        data = await settingsService.advancedSearch(
          filterObj.category || null,
          filterObj.key || null,
          filterObj.description || null,
          filterObj.isEncrypted ? filterObj.isEncrypted === 'true' : null,
          pageNum,
          PAGE_SIZE
        );
      } else {
        data = await settingsService.getSettings(pageNum, PAGE_SIZE);
      }
      setSettings(data.content);
      setTotalElements(data.totalElements);
      setPage(data.number);
    } catch (e) {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSettings(0, filters);
  }, []);

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    const updatedFilters = { ...filters, [name]: value };
    setFilters(updatedFilters);
    setPage(0);
    fetchSettings(0, updatedFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = { category: '', key: '', description: '', isEncrypted: '' };
    setFilters(clearedFilters);
    setPage(0);
    fetchSettings(0, clearedFilters);
  };

  const handleEdit = setting => {
    setEditingId(setting.settingId);
    setForm({
      category: setting.category,
      key: setting.key,
      value: setting.value === '***ENCRYPTED***' ? '' : setting.value,
      isEncrypted: setting.isEncrypted,
      description: setting.description || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this setting?')) return;
    try {
      await settingsService.deleteSetting(id);
      fetchSettings(page, filters);
    } catch {
      setError('Delete failed');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editingId) {
        await settingsService.updateSetting({ settingId: editingId, ...form });
      } else {
        await settingsService.createSetting(form);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowModal(false);
      fetchSettings(page, filters);
    } catch {
      setError('Save failed. Check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowModal(false);
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <h1>⚙️ System Settings</h1>
        <p>Manage system configuration and properties</p>
      </div>

      {/* Error Banner */}
      {error && <div className="error-banner">{error}</div>}

      {/* Add Button */}
      <button
        className="btn"
        onClick={() => {
          setShowModal(true);
          setEditingId(null);
          setForm(emptyForm);
        }}
      >
        ➕ Add Setting
      </button>

      {/* Filters Section (Collapsible) */}
      <div className="admin-page-filters">
        <button
          className={`admin-filters-toggle ${filtersCollapsed ? 'collapsed' : ''}`}
          onClick={() => setFiltersCollapsed(!filtersCollapsed)}
        >
          🔍 Filters & Search
        </button>
        <form
          className={`admin-filters-content ${filtersCollapsed ? 'collapsed' : ''}`}
        >
          <div className="filters-grid">
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">📁 All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <input
              name="key"
              value={filters.key}
              onChange={handleFilterChange}
              placeholder="🔑 Search by key"
            />
            <input
              name="description"
              value={filters.description}
              onChange={handleFilterChange}
              placeholder="� Search description"
            />
            <select
              name="isEncrypted"
              value={filters.isEncrypted}
              onChange={handleFilterChange}
            >
              <option value="">🔓 All Settings</option>
              <option value="true">🔒 Encrypted Only</option>
              <option value="false">🔓 Not Encrypted</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={handleClearFilters}
            >
              ✕ Clear All Filters
            </button>
          </div>
        </form>
      </div>

      {/* Settings Table */}
      {loading ? (
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading settings...
        </div>
      ) : settings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚙️</div>
          <div className="empty-state-title">No settings found</div>
          <div className="empty-state-description">
            {Object.values(filters).some(v => v) ? 'Try adjusting your filters' : 'Get started by adding your first setting'}
          </div>
        </div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Key</th>
                  <th>Value</th>
                  <th>Encrypted</th>
                  <th>Description</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {settings.map(setting => (
                  <tr key={setting.settingId}>
                    <td>{setting.category}</td>
                    <td>
                      <code style={{ background: 'rgba(0,0,0,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                        {setting.key}
                      </code>
                    </td>
                    <td>
                      {setting.value.length > 50
                        ? setting.value.slice(0, 47) + '...'
                        : setting.value}
                    </td>
                    <td>
                      {setting.isEncrypted ? (
                        <span style={{ color: '#10b981', fontWeight: '600' }}>🔒 Yes</span>
                      ) : (
                        <span style={{ color: '#64748b' }}>No</span>
                      )}
                    </td>
                    <td>{setting.description}</td>
                    <td>{setting.updatedAt?.slice(0, 19).replace('T', ' ')}</td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="action-btn"
                          title="Edit setting"
                          onClick={() => handleEdit(setting)}
                        >
                          ✏️
                        </button>
                        <button
                          className="action-btn danger"
                          title="Delete setting"
                          onClick={() => handleDelete(setting.settingId)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalElements > PAGE_SIZE && (
            <div className="pagination">
              <div className="pagination-info">
                Showing page {page + 1} of {Math.ceil(totalElements / PAGE_SIZE)} ({totalElements} total)
              </div>
              <div className="pagination-controls">
                <button
                  className="btn btn-secondary btn-small"
                  disabled={page === 0}
                  onClick={() => fetchSettings(page - 1, filters)}
                >
                  ← Previous
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  disabled={(page + 1) * PAGE_SIZE >= totalElements}
                  onClick={() => fetchSettings(page + 1, filters)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Settings Form Modal */}
      {showModal && (
        <Modal
          title={editingId ? '✏️ Edit Setting' : '➕ Add New Setting'}
          onClose={handleCancel}
          size="medium"
          isLoading={submitting}
        >
          {error && <div className="modal-error">{error}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-row">
              <div className="form-group">
                <label>
                  Category <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Email, Database"
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Key <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="key"
                  value={form.key}
                  onChange={handleInputChange}
                  placeholder="e.g., smtp_host"
                  maxLength={100}
                  required
                />
              </div>
            </div>

            <div className="form-row full">
              <div className="form-group">
                <label>
                  Value <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="value"
                  value={form.value}
                  onChange={handleInputChange}
                  placeholder="Setting value"
                  required
                />
              </div>
            </div>

            <div className="form-row full">
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Optional description"
                  maxLength={255}
                />
              </div>
            </div>

            <div className="form-row full">
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="isEncrypted"
                  name="isEncrypted"
                  checked={form.isEncrypted}
                  onChange={handleInputChange}
                />
                <label htmlFor="isEncrypted" style={{ margin: 0 }}>
                  🔒 Encrypt this value
                </label>
              </div>
            </div>
          </form>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleCancel}
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
              {submitting ? '⏳ Saving...' : editingId ? '💾 Update' : '➕ Add'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminSettingsPage;
