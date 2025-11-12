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
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  const fetchSettings = async (pageNum = 0, searchTerm = '') => {
    setLoading(true);
    try {
      let data;
      if (searchTerm) {
        data = await settingsService.searchSettings(searchTerm, pageNum, PAGE_SIZE);
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

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleInputChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
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
      fetchSettings(page, search);
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
      fetchSettings(page, search);
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

  const handleSearch = e => {
    e.preventDefault();
    fetchSettings(0, search);
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
          onSubmit={handleSearch}
        >
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search settings..."
          />
          <button type="submit" className="btn btn-small">
            Search
          </button>
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
            {search ? 'Try adjusting your search' : 'Get started by adding your first setting'}
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
                  onClick={() => fetchSettings(page - 1, search)}
                >
                  ← Previous
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  disabled={(page + 1) * PAGE_SIZE >= totalElements}
                  onClick={() => fetchSettings(page + 1, search)}
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
