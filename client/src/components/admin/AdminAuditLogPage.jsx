import React, { useEffect, useState } from 'react';
import auditLogService from '../../services/admin/auditLogService';
import './admin.css';

const AdminAuditLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ username: '', role: '', action: '', from: '', to: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="admin-main-inner">
      <h2>Audit Logs</h2>
      <form className="admin-form" onSubmit={handleSearch}>
        <input name="username" value={filters.username} onChange={handleInputChange} placeholder="Username" />
        <input name="role" value={filters.role} onChange={handleInputChange} placeholder="Role" />
        <input name="action" value={filters.action} onChange={handleInputChange} placeholder="Action" />
        <input name="from" type="datetime-local" value={filters.from} onChange={handleInputChange} />
        <input name="to" type="datetime-local" value={filters.to} onChange={handleInputChange} />
        <button className="btn" type="submit">Search</button>
      </form>
      {error && <div className="error-banner">{error}</div>}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Username</th>
              <th>Role</th>
              <th>Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id}>
                <td>{log.timestamp?.replace('T',' ').slice(0,19)}</td>
                <td>{log.username}</td>
                <td>{log.role}</td>
                <td>{log.action}</td>
                <td>{log.details}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} style={{textAlign:'center'}}>No logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminAuditLogPage;
