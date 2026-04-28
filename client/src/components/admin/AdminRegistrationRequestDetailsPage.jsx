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
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  const [finalCredentials, setFinalCredentials] = useState(null);
  const [approvalMessage, setApprovalMessage] = useState('');

  // Determine if this is a driver or customer registration
  const isDriverRegistration = request?.role?.roleName === 'DRIVER';
  const isCustomerRegistration = request?.role?.roleName === 'CUSTOMER';

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

  const handleApproveClick = () => {
    if (isDriverRegistration) {
      setGeneratedCredentials(null);
      setShowApprovalModal(true);
      return;
    }

    // Generate preview credentials for review
    const fallbackUsername = isDriverRegistration ? 'driver' : 'customer';
    const baseUsername = (request.email || request.fullName || fallbackUsername)
      .split('@')[0]
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '.')
      .substring(0, 30);
    const previewUsername = baseUsername || fallbackUsername;
    const previewPassword = '••••••••'; // Masked for preview

    setGeneratedCredentials({
      username: previewUsername,
      password: previewPassword
    });
    setShowApprovalModal(true);
  };

  const handleConfirmApproval = async () => {
    setShowApprovalModal(false);
    setActionLoading(true);

    try {
      const response = await api.post(`/admin/registration-requests/${requestId}/approve`);
      const message = response.data || '';

      if (isDriverRegistration) {
        setApprovalMessage(message);
        setApprovalSuccess(true);
        setRequest((prev) => ({ ...prev, status: 'APPROVED' }));
        return;
      }

      // Parse credentials from response message
      // Expected format: "Request approved successfully. Created driver account username='john.doe' with temporary password='AbCdEf123'."
      const usernameMatch = message.match(/username='([^']+)'/);
      const passwordMatch = message.match(/password='([^']+)'/);

      if (usernameMatch && passwordMatch) {
        setFinalCredentials({
          username: usernameMatch[1],
          password: passwordMatch[1]
        });
        setApprovalSuccess(true);
      } else {
        // Fallback: reload the request to show updated status
        const res = await api.get(`/admin/registration-requests/${requestId}`);
        setRequest(res.data);
      }
    } catch (err) {
      console.error('Error approving request:', err);
      alert('Failed to approve request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = async () => {
    if (!window.confirm('Are you sure you want to reject this registration request?')) {
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/admin/registration-requests/${requestId}/reject`);
      // Reload the request to show updated status
      const res = await api.get(`/admin/registration-requests/${requestId}`);
      setRequest(res.data);
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Failed to reject request. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };



  const handleSaveChanges = async () => {
    setActionLoading(true);
    try {
      // Only send the fields that can be edited
      const updateData = {
        fullName: editedData.fullName,
        phone: editedData.phone,
        dateOfBirth: editedData.dateOfBirth,
        address: editedData.address,
        licenseNumber: editedData.licenseNumber,
        licenseType: editedData.licenseType,
        licenseExpiry: editedData.licenseExpiry,
        emergencyContactName: editedData.emergencyContactName,
        emergencyContactPhone: editedData.emergencyContactPhone
      };

      await api.patch(`/admin/registration-requests/${requestId}`, updateData);

      // Reload the request to show updated data
      const res = await api.get(`/admin/registration-requests/${requestId}`);
      setRequest(res.data);
      setEditMode(false);
      setEditedData({});
    } catch (err) {
      console.error('Error saving changes:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditInputChange = (field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
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

  // Show success screen after account creation
  if (approvalSuccess && (isDriverRegistration || finalCredentials)) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>{isDriverRegistration ? '✅ Interview Invitation Sent' : '✅ Account Created Successfully'}</h1>
          <p>
            {isDriverRegistration
              ? 'The driver has been moved to the interview stage and notified by email.'
              : 'Customer account has been created and credentials sent via email'}
          </p>
        </div>

        <div className="admin-details-container">
          <div className="details-card">
            <div className="card-header">
              <h2>🎉 Account Creation Complete</h2>
            </div>
            <div className="card-content">
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  fontSize: '64px',
                  marginBottom: '16px',
                  color: '#10b981'
                }}>
                  ✓
                </div>
                <h3 style={{ color: '#10b981', margin: '0 0 8px 0' }}>
                  {isDriverRegistration ? 'Driver application approved for interview' : 'Customer account created successfully'}
                </h3>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  {isDriverRegistration
                    ? 'The applicant has been notified that the profile passed review and the next step is interview scheduling.'
                    : 'The customer has been notified via email with their login credentials.'}
                </p>
              </div>

              {isDriverRegistration ? (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #0ea5e9',
                  marginBottom: '24px'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', color: '#0c4a6e' }}>📧 Interview-stage Email Sent</h4>
                  <p style={{ margin: '0 0 12px 0', color: '#334155' }}>
                    The driver will receive the update at <strong>{request.email}</strong>.
                  </p>
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#e0f2fe',
                    border: '1px solid #7dd3fc',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#0f172a'
                  }}>
                    {approvalMessage || 'The application passed initial review. The applicant will be contacted for interview if shortlisted.'}
                  </div>
                </div>
              ) : (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #0ea5e9',
                  marginBottom: '24px'
                }}>
                  <h4 style={{ margin: '0 0 16px 0', color: '#0c4a6e' }}>📧 Credentials Sent to Customer</h4>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Username:</span>
                      <code style={{
                        backgroundColor: '#e0f2fe',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        color: '#0369a1',
                        fontSize: '14px'
                      }}>
                        {finalCredentials.username}
                      </code>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Temporary Password:</span>
                      <code style={{
                        backgroundColor: '#e0f2fe',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        color: '#0369a1',
                        fontSize: '14px'
                      }}>
                        {finalCredentials.password}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              <div style={{
                backgroundColor: '#f0fdf4',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #22c55e'
              }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#15803d' }}>📋 Account Summary</h4>
                <div style={{ display: 'grid', gap: '6px', fontSize: '14px' }}>
                  <div><strong>{isDriverRegistration ? 'Name' : 'Contact Person'}:</strong> {request.fullName}</div>
                  <div><strong>Email:</strong> {request.email}</div>
                  <div><strong>Role:</strong> {request.role?.roleName || 'DRIVER'}</div>
                  {isDriverRegistration ? (
                    <div><strong>License:</strong> {request.licenseNumber} ({request.licenseType})</div>
                  ) : (
                    <div><strong>Company:</strong> {request.companyName}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-details-actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate('/admin/registration-requests')}
          >
            📋 Back to Registration Requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>📋 Registration Request Details</h1>
            <p>Viewing {isDriverRegistration ? 'driver' : isCustomerRegistration ? 'customer' : ''} registration for {request.fullName || request.companyName || request.email}</p>
            {editMode && (
              <div style={{
                marginTop: '8px',
                padding: '8px 12px',
                backgroundColor: '#fef3c7',
                border: '1px solid #f59e0b',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#92400e'
              }}>
                ⚠️ You are in edit mode. Make changes and click "Save" or "Cancel".
              </div>
            )}
          </div>
          {request.status === 'PENDING' && (
            <div style={{ display: 'flex', gap: '12px' }}>
              {!editMode ? (
                <>
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setEditedData({...request});
                      setEditMode(true);
                    }}
                    disabled={actionLoading}
                    title="Edit request details"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handleApproveClick}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '⏳ Processing...' : isDriverRegistration ? '✓ Move to Interview' : '✓ Approve'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleRejectClick}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '⏳ Processing...' : '✗ Reject'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-success"
                    onClick={handleSaveChanges}
                    disabled={actionLoading}
                  >
                    {actionLoading ? '⏳ Saving...' : '💾 Save Changes'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setEditMode(false);
                      setEditedData({});
                    }}
                    disabled={actionLoading}
                  >
                    ❌ Cancel
                  </button>
                </>
              )}
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

        {/* Personal/Company Information Card */}
        {isDriverRegistration && (
          <div className="details-card">
            <div className="card-header">
              <h2>Personal Information</h2>
            </div>
            <div className="card-content">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Full Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      className="form-input"
                      value={editedData.fullName || ''}
                      onChange={(e) => handleEditInputChange('fullName', e.target.value)}
                      placeholder="Enter full name"
                    />
                  ) : (
                    <div className="detail-value">{request.fullName || '—'}</div>
                  )}
                </div>
                <div className="detail-item">
                  <label>Date of Birth</label>
                  {editMode ? (
                    <input
                      type="date"
                      className="form-input"
                      value={editedData.dateOfBirth || ''}
                      onChange={(e) => handleEditInputChange('dateOfBirth', e.target.value)}
                    />
                  ) : (
                    <div className="detail-value">{request.dateOfBirth || '—'}</div>
                  )}
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <div className="detail-value">{request.email}</div>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  {editMode ? (
                    <input
                      type="tel"
                      className="form-input"
                      value={editedData.phone || ''}
                      onChange={(e) => handleEditInputChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <div className="detail-value">{request.phone || '—'}</div>
                  )}
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label>Address</label>
                  {editMode ? (
                    <textarea
                      className="form-input"
                      value={editedData.address || ''}
                      onChange={(e) => handleEditInputChange('address', e.target.value)}
                      placeholder="Enter address"
                      rows="3"
                    />
                  ) : (
                    <div className="detail-value">{request.address || '—'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Company Information Card */}
        {isCustomerRegistration && (
          <div className="details-card">
            <div className="card-header">
              <h2>Company Information</h2>
            </div>
            <div className="card-content">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Company Name</label>
                  <div className="detail-value">{request.companyName || '—'}</div>
                </div>
                <div className="detail-item">
                  <label>Tax ID</label>
                  <div className="detail-value">{request.companyTaxId || '—'}</div>
                </div>
                <div className="detail-item">
                  <label>Industry</label>
                  <div className="detail-value">{request.companyIndustry || '—'}</div>
                </div>
                <div className="detail-item">
                  <label>Company Phone</label>
                  <div className="detail-value">{request.companyPhone || '—'}</div>
                </div>
                <div className="detail-item">
                  <label>Company Website</label>
                  <div className="detail-value">{request.companyWebsite || '—'}</div>
                </div>
                <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                  <label>Company Address</label>
                  <div className="detail-value">{request.companyAddress || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Person Information Card (for customers) */}
        {isCustomerRegistration && (
          <div className="details-card">
            <div className="card-header">
              <h2>Authorized Contact Person</h2>
            </div>
            <div className="card-content">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Full Name</label>
                  <div className="detail-value">{request.fullName || '—'}</div>
                </div>
                <div className="detail-item">
                  <label>Position/Title</label>
                  <div className="detail-value">{request.userPosition || '—'}</div>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <div className="detail-value">{request.email}</div>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <div className="detail-value">{request.phone || '—'}</div>
                </div>
              </div>
            </div>
          </div>
        )}



        {/* Driver-specific sections */}
        {isDriverRegistration && (
          <>
            {/* License Information Card */}
            <div className="details-card">
              <div className="card-header">
                <h2>Driver's License Information</h2>
              </div>
              <div className="card-content">
                <div className="details-grid">
                  <div className="detail-item">
                    <label>License Number</label>
                    {editMode ? (
                      <input
                        type="text"
                        className="form-input"
                        value={editedData.licenseNumber || ''}
                        onChange={(e) => handleEditInputChange('licenseNumber', e.target.value)}
                        placeholder="Enter license number"
                      />
                    ) : (
                      <div className="detail-value">{request.licenseNumber || '—'}</div>
                    )}
                  </div>
                  <div className="detail-item">
                    <label>License Type</label>
                    {editMode ? (
                      <input
                        type="text"
                        className="form-input"
                        value={editedData.licenseType || ''}
                        onChange={(e) => handleEditInputChange('licenseType', e.target.value)}
                        placeholder="Enter license type (e.g., B2, C, D)"
                      />
                    ) : (
                      <div className="detail-value">{request.licenseType || '—'}</div>
                    )}
                  </div>
                  <div className="detail-item">
                    <label>Expiry Date</label>
                    {editMode ? (
                      <input
                        type="date"
                        className="form-input"
                        value={editedData.licenseExpiry || ''}
                        onChange={(e) => handleEditInputChange('licenseExpiry', e.target.value)}
                      />
                    ) : (
                      <div className="detail-value">{request.licenseExpiry || '—'}</div>
                    )}
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
                    {editMode ? (
                      <input
                        type="text"
                        className="form-input"
                        value={editedData.emergencyContactName || ''}
                        onChange={(e) => handleEditInputChange('emergencyContactName', e.target.value)}
                        placeholder="Enter emergency contact name"
                      />
                    ) : (
                      <div className="detail-value">{request.emergencyContactName || '—'}</div>
                    )}
                  </div>
                  <div className="detail-item">
                    <label>Contact Phone</label>
                    {editMode ? (
                      <input
                        type="tel"
                        className="form-input"
                        value={editedData.emergencyContactPhone || ''}
                        onChange={(e) => handleEditInputChange('emergencyContactPhone', e.target.value)}
                        placeholder="Enter emergency contact phone"
                      />
                    ) : (
                      <div className="detail-value">{request.emergencyContactPhone || '—'}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Customer-specific sections */}
        {isCustomerRegistration && (
          <>
            {/* Business License Document Card */}
            {request.businessLicenseUrl && (
              <div className="details-card">
                <div className="card-header">
                  <h2>Business License</h2>
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
                    <div style={{ fontSize: '48px' }}>📄</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                        Business License Document
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {request.businessLicenseUrl.split('/').pop()}
                      </div>
                    </div>
                    <a
                      href={toAbsoluteUrl(request.businessLicenseUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      📥 Download License
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Tax Certificate Document Card */}
            {request.taxCertificateUrl && (
              <div className="details-card">
                <div className="card-header">
                  <h2>Tax Certificate</h2>
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
                    <div style={{ fontSize: '48px' }}>🧾</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>
                        Tax Certificate Document
                      </div>
                      <div style={{ fontSize: '13px', color: '#6b7280' }}>
                        {request.taxCertificateUrl.split('/').pop()}
                      </div>
                    </div>
                    <a
                      href={toAbsoluteUrl(request.taxCertificateUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      📥 Download Certificate
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
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

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="modal-content" style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 8px 0', color: '#1f2937' }}>{isDriverRegistration ? 'Review Interview Invitation' : 'Review Account Creation'}</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                {isDriverRegistration
                  ? 'Please confirm that this driver application should move to the interview stage.'
                  : `Please review the account details that will be created for this ${isDriverRegistration ? 'driver' : 'customer'}.`}
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              {!isDriverRegistration && (
                <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1f2937' }}>Account Credentials</h3>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Username:</span>
                      <code style={{
                        backgroundColor: '#e5e7eb',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        color: '#1f2937'
                      }}>
                        {generatedCredentials?.username}
                      </code>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', color: '#374151' }}>Temporary Password:</span>
                      <code style={{
                        backgroundColor: '#e5e7eb',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        color: '#1f2937'
                      }}>
                        {generatedCredentials?.password}
                      </code>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#92400e'
                  }}>
                    <strong>⚠️ Important:</strong> The customer will receive these credentials via email after account creation. Make sure the email address is correct.
                  </div>
                </div>
              )}

              {isDriverRegistration && (
                <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1f2937' }}>Interview-stage Update</h3>
                  <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>
                    Approving this request will:
                    <ul style={{ margin: '8px 0 0 18px' }}>
                      <li>mark the driver application as approved for the next stage</li>
                      <li>send an email saying the application passed review</li>
                      <li>tell the applicant that your team will contact them for interview</li>
                      <li>not create a login account yet</li>
                    </ul>
                  </div>
                </div>
              )}

              <div style={{ marginTop: '16px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1f2937' }}>Account Details</h3>

                <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
                  <div><strong>{isDriverRegistration ? 'Name' : 'Contact Person'}:</strong> {request.fullName || 'N/A'}</div>
                  <div><strong>Email:</strong> {request.email}</div>
                  <div><strong>Phone:</strong> {request.phone || 'N/A'}</div>
                  <div><strong>Role:</strong> {request.role?.roleName || 'DRIVER'}</div>
                  {isDriverRegistration ? (
                    <div><strong>License:</strong> {request.licenseNumber || 'N/A'} ({request.licenseType || 'N/A'})</div>
                  ) : (
                    <div><strong>Company:</strong> {request.companyName || 'N/A'}</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowApprovalModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={handleConfirmApproval}
                disabled={actionLoading}
              >
                {actionLoading ? (isDriverRegistration ? '⏳ Sending Interview Email...' : '⏳ Creating Account...') : (isDriverRegistration ? '✓ Send Interview Update' : '✓ Create Account')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRegistrationRequestDetailsPage;
