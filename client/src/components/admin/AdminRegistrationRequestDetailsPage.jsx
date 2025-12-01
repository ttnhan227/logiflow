import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, authService } from '../../services';
import './admin.css';

const AdminRegistrationRequestDetailsPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [request, setRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadRequestDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/admin/registration-requests/${requestId}`);
        setRequest(res.data);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Failed to load request details');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      loadRequestDetails();
    }
  }, [requestId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const toAbsoluteUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = authService.getBaseUrl();
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const handleAction = async (action) => {
    const actionLabel = action === 'approve' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${actionLabel} this registration request?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/admin/registration-requests/${requestId}/${action}`);
      // Reload the request to show updated status
      const res = await api.get(`/admin/registration-requests/${requestId}`);
      setRequest(res.data);
    } catch (err) {
      console.error(`Error ${actionLabel}ing request:`, err);
      alert(`Failed to ${actionLabel} request. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>📋 Registration Request Details</h1>
        </div>
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading request details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>📋 Registration Request Details</h1>
        </div>
        <div className="error-banner">{error}</div>
        <div style={{ padding: '20px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/registration-requests')}>
            ← Back to Registration Requests
          </button>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>📋 Registration Request Details</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">Request Not Found</div>
          <div className="empty-state-description">The registration request you're looking for doesn't exist.</div>
        </div>
        <div style={{ padding: '20px' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/registration-requests')}>
            ← Back to Registration Requests
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadgeColor = (status) => {
    if (status === 'APPROVED') return '#dcfce7';
    if (status === 'REJECTED') return '#fee2e2';
    return '#fef3c7';
  };

  const getStatusTextColor = (status) => {
    if (status === 'APPROVED') return '#166534';
    if (status === 'REJECTED') return '#991b1b';
    return '#854d0e';
  };

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>📋 Registration Request Details</h1>
            <p>Viewing driver registration for {request.fullName || request.username}</p>
          </div>
          {request.status === 'PENDING' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-success"
                onClick={() => handleAction('approve')}
                disabled={actionLoading}
              >
                {actionLoading ? '⏳ Processing...' : '✓ Approve'}
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleAction('reject')}
                disabled={actionLoading}
              >
                {actionLoading ? '⏳ Processing...' : '✗ Reject'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-details-container">
        {/* Status Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>Request Status</h2>
          </div>
          <div className="card-content">
            <div className="details-grid">
              <div className="detail-item">
                <label>Status</label>
                <div className="detail-value">
                  <span 
                    style={{
                      display: 'inline-block',
                      padding: '6px 14px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: getStatusBadgeColor(request.status),
                      color: getStatusTextColor(request.status),
                    }}
                  >
                    {request.status || 'PENDING'}
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <label>Requested On</label>
                <div className="detail-value detail-date">
                  {formatDate(request.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>Personal Information</h2>
          </div>
          <div className="card-content">
            <div className="details-grid">
              <div className="detail-item">
                <label>Full Name</label>
                <div className="detail-value">{request.fullName || '—'}</div>
              </div>
              <div className="detail-item">
                <label>Date of Birth</label>
                <div className="detail-value">{request.dateOfBirth || '—'}</div>
              </div>
              <div className="detail-item">
                <label>Email</label>
                <div className="detail-value">{request.email}</div>
              </div>
              <div className="detail-item">
                <label>Phone</label>
                <div className="detail-value">{request.phone || '—'}</div>
              </div>
              <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                <label>Address</label>
                <div className="detail-value">{request.address || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Credentials Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>Account Credentials</h2>
          </div>
          <div className="card-content">
            <div className="details-grid">
              <div className="detail-item">
                <label>Username</label>
                <div className="detail-value">{request.username}</div>
              </div>
              <div className="detail-item">
                <label>Password</label>
                <div className="detail-value">
                  <span style={{ color: '#64748b', fontSize: '13px' }}>••••••••</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* License Information Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>Driver's License Information</h2>
          </div>
          <div className="card-content">
            <div className="details-grid">
              <div className="detail-item">
                <label>License Number</label>
                <div className="detail-value">{request.licenseNumber || '—'}</div>
              </div>
              <div className="detail-item">
                <label>License Type</label>
                <div className="detail-value">{request.licenseType || '—'}</div>
              </div>
              <div className="detail-item">
                <label>Expiry Date</label>
                <div className="detail-value">{request.licenseExpiry || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* License Image Card */}
        {request.licenseImageUrl && (
          <div className="details-card">
            <div className="card-header">
              <h2>Driver's License Image</h2>
            </div>
            <div className="card-content profile-picture-container">
              <a href={toAbsoluteUrl(request.licenseImageUrl)} target="_blank" rel="noreferrer">
                <img 
                  src={toAbsoluteUrl(request.licenseImageUrl)} 
                  alt="Driver's License" 
                  className="profile-picture-img"
                  style={{ maxWidth: '600px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
              </a>
            </div>
          </div>
        )}

        {/* CV Document Card */}
        {request.cvUrl && (
          <div className="details-card">
            <div className="card-header">
              <h2>CV / Resume</h2>
            </div>
            <div className="card-content">
              <div style={{ 
                padding: '24px', 
                backgroundColor: '#f9fafb', 
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '48px' }}>📋</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                    CV Document
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {request.cvUrl.split('/').pop()}
                  </div>
                </div>
                <a 
                  href={toAbsoluteUrl(request.cvUrl)} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn btn-primary"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  📥 Download CV
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Contact Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>Emergency Contact</h2>
          </div>
          <div className="card-content">
            <div className="details-grid">
              <div className="detail-item">
                <label>Contact Name</label>
                <div className="detail-value">{request.emergencyContactName || '—'}</div>
              </div>
              <div className="detail-item">
                <label>Contact Phone</label>
                <div className="detail-value">{request.emergencyContactPhone || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="admin-details-actions">
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate('/admin/registration-requests')}
          style={{ whiteSpace: 'nowrap' }}
        >
          ← Back to Requests
        </button>
      </div>
    </div>
  );
};

export default AdminRegistrationRequestDetailsPage;
