import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services";
import './admin.css';

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

const StatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    if (status === 'APPROVED') {
      return { backgroundColor: '#dcfce7', color: '#166534' };
    }
    if (status === 'REJECTED') {
      return { backgroundColor: '#fee2e2', color: '#991b1b' };
    }
    return { backgroundColor: '#fef3c7', color: '#854d0e' };
  };

  return (
    <span 
      style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        ...getStatusStyle(),
      }}
    >
      {status || 'PENDING'}
    </span>
  );
};

const AdminRegistrationRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const loadRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/registration-requests");
      const data = Array.isArray(res.data) ? res.data : [];
      setRequests(data);
      setFilteredRequests(data);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load requests");
      setRequests([]);
      setFilteredRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    let result = requests;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          r.fullName?.toLowerCase().includes(term) ||
          r.email?.toLowerCase().includes(term) ||
          r.phone?.toLowerCase().includes(term)
      );
    }
    setFilteredRequests(result);
    setPage(0);
  }, [searchTerm, requests]);

  const handleViewDetails = (request) => {
    navigate(`/admin/registration-requests/${request.requestId}`);
  };

  const paginatedRequests = filteredRequests.slice(page * size, (page + 1) * size);
  const totalPages = Math.ceil(filteredRequests.length / size);

  if (loading) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>📋 Driver Registration Requests</h1>
        </div>
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading registration requests...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>📋 Driver Registration Requests</h1>
        </div>
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <h1>📋 Driver Registration Requests</h1>
        <p>Review and approve driver registration applications</p>
      </div>

      {/* Error banner */}
      {error && <div className="error-banner">{error}</div>}

      {/* Toolbar */}
      <div className="admin-page-toolbar">
        <input
          type="text"
          placeholder="🔍 Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table or Empty State */}
      {loading ? (
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading registration requests...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No requests found</div>
          <div className="empty-state-description">
            {searchTerm ? 'Try adjusting your search' : 'There are no driver registration requests at this time'}
          </div>
        </div>
      ) : (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Requested</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((req) => (
                  <tr key={req.requestId}>
                    <td>
                      <div className="user-row">
                        <div className="avatar">
                          {(req.fullName || req.email || '?')
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div className="user-info">
                          <div className="user-name">{req.fullName || 'Unknown'}</div>
                          <div className="user-id">{req.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{req.email}</td>
                    <td>{req.phone || '—'}</td>
                    <td>
                      <span className="table-date">{formatDate(req.createdAt)}</span>
                    </td>
                    <td>
                      <StatusBadge status={req.status} />
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="action-btn"
                          title="View details"
                          onClick={() => handleViewDetails(req)}
                        >
                          👁️
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
                Showing {page * size + 1} to {Math.min((page + 1) * size, filteredRequests.length)} of{' '}
                {filteredRequests.length} requests
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
    </div>
  );
};

export default AdminRegistrationRequestsPage;
