import React, { useEffect, useState } from 'react';
import auditLogService from '../../services/admin/auditLogService';
import './admin.css';

const AdminAuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ username: '', role: '', action: '', from: '', to: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const data = await auditLogService.searchLogs(params);
      setLogs(data);
    } catch {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  const handleSearch = e => {
    e.preventDefault();
    fetchLogs();
  };

  const handleClearFilters = () => {
    setFilters({ username: '', role: '', action: '', from: '', to: '' });
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <h1>📝 Audit Logs</h1>
        <p>Track system activities and user actions</p>
      </div>

      {/* Error Banner */}
      {error && <div className="error-banner">{error}</div>}

      {/* Filters (Collapsible) */}
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
          <div className="filters-grid">
            <input
              name="username"
              value={filters.username}
              onChange={handleInputChange}
              placeholder="🧑 Username"
            />
            <input
              name="role"
              value={filters.role}
              onChange={handleInputChange}
              placeholder="👔 Role"
            />
            <input
              name="action"
              value={filters.action}
              onChange={handleInputChange}
              placeholder="⚡ Action"
            />
            <input
              name="from"
              type="datetime-local"
              value={filters.from}
              onChange={handleInputChange}
              title="From date"
            />
            <input
              name="to"
              type="datetime-local"
              value={filters.to}
              onChange={handleInputChange}
              title="To date"
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button type="submit" className="btn btn-small">
              🔍 Search
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={handleClearFilters}
            >
              ✕ Clear
            </button>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading audit logs...
        </div>
      ) : logs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">No audit logs found</div>
          <div className="empty-state-description">
            {Object.values(filters).some(v => v) ? 'Try adjusting your filters' : 'No activity recorded yet'}
          </div>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Username</th>
                <th>Role</th>
                <th>Action</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td>
                    <code style={{ fontSize: '12px' }}>
                      {log.timestamp?.replace('T', ' ').slice(0, 19)}
                    </code>
                  </td>
                  <td>{log.username}</td>
                  <td>
                    <span style={{ fontWeight: '600', color: '#64748b' }}>
                      {log.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>{log.details}</td>
                  <td>
                    <span
                      className={`status ${log.success ? 'success' : 'error'}`}
                    >
                      {log.success ? '✓ Success' : '✗ Failed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogPage;
