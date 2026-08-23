import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, authService } from '../../services';
import {
  Button,
  Card,
  Input,
  Textarea,
  Badge,
  Modal,
  PageHeader,
  Alert,
  LoadingSpinner,
} from '@/components/ui';
import {
  LuArrowLeft,
  LuCheck,
  LuX,
  LuFileText,
  LuDownload,
  LuUser,
  LuBuilding2,
  LuPencil,
  LuSave,
} from 'react-icons/lu';

export const AdminRegistrationRequestDetailsPage = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [request, setRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [approvalSuccess, setApprovalSuccess] = useState(false);
  const [finalCredentials, setFinalCredentials] = useState(null);
  const [approvalMessage, setApprovalMessage] = useState('');

  const isDriverRegistration = request?.role?.roleName === 'DRIVER';
  const isCustomerRegistration = request?.role?.roleName === 'CUSTOMER';

  const loadRequestDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/admin/registration-requests/${requestId}`);
      setRequest(res.data);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to query onboarding request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) {
      loadRequestDetails();
    }
  }, [requestId]);

  const toAbsoluteUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = authService.getBaseUrl();
    return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
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

      const usernameMatch = message.match(/username='([^']+)'/);
      const passwordMatch = message.match(/password='([^']+)'/);

      if (usernameMatch && passwordMatch) {
        setFinalCredentials({
          username: usernameMatch[1],
          password: passwordMatch[1],
        });
        setApprovalSuccess(true);
      } else {
        await loadRequestDetails();
      }
    } catch {
      alert('Failed to authorize application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = async () => {
    if (!window.confirm('Reject this onboarding registration request?')) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/registration-requests/${requestId}/reject`);
      await loadRequestDetails();
    } catch {
      alert('Failed to reject registration request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/registration-requests/${requestId}`, editedData);
      await loadRequestDetails();
      setEditMode(false);
      setEditedData({});
    } catch {
      alert('Failed to update registration request details.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Retrieving applicant credentials..." />;
  }

  if (error || !request) {
    return (
      <div style={{ padding: '24px', maxWidth: '600px' }}>
        <Alert variant="danger">{error || 'Registration request not found.'}</Alert>
        <div style={{ marginTop: '16px' }}>
          <Link to="/admin/registration-requests">
            <Button variant="outline" leftIcon={<LuArrowLeft size={14} />}>
              Back to Requests
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (approvalSuccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px' }}>
        <PageHeader
          title={isDriverRegistration ? 'Interview Stage Authorized' : 'Customer Account Created'}
          description="The onboarding application has been approved and email notifications have been dispatched."
        />

        <Card style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', color: 'var(--color-success-600)', marginBottom: '16px' }}>✓</div>
          <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            {isDriverRegistration ? 'Driver Application Approved for Interview' : 'Shipper Account Provisioned'}
          </h3>

          {finalCredentials && (
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-lg)', margin: '20px 0', textAlign: 'left' }}>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>Generated Credentials:</div>
              <div style={{ marginTop: '8px', fontSize: 'var(--text-sm)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Username:</span>
                <code>{finalCredentials.username}</code>
              </div>
              <div style={{ marginTop: '4px', fontSize: 'var(--text-sm)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Temp Password:</span>
                <code>{finalCredentials.password}</code>
              </div>
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            <Link to="/admin/registration-requests">
              <Button variant="primary">Return to Onboarding Queue</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={`Application #${request.requestId} Review`}
        description={`Onboarding verification for ${request.fullName || request.companyName || request.email}`}
        badge={
          <Badge
            variant={
              request.status === 'APPROVED' ? 'success' : request.status === 'REJECTED' ? 'danger' : 'warning'
            }
          >
            {request.status || 'PENDING'}
          </Badge>
        }
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/admin/registration-requests">
              <Button variant="outline" size="sm" leftIcon={<LuArrowLeft size={14} />}>
                Requests Queue
              </Button>
            </Link>

            {request.status === 'PENDING' && (
              <>
                {!editMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditedData({ ...request });
                        setEditMode(true);
                      }}
                      leftIcon={<LuPencil size={14} />}
                    >
                      Edit Fields
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setShowApprovalModal(true)}
                      loading={actionLoading}
                      leftIcon={<LuCheck size={14} />}
                    >
                      {isDriverRegistration ? 'Authorize Interview' : 'Approve & Create Account'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleRejectClick}
                      loading={actionLoading}
                      leftIcon={<LuX size={14} />}
                    >
                      Reject Application
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditMode(false);
                        setEditedData({});
                      }}
                    >
                      Cancel Edit
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveChanges}
                      loading={actionLoading}
                      leftIcon={<LuSave size={14} />}
                    >
                      Save Changes
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Core Applicant Profile */}
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            Applicant Identity
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Full Name</span>
              {editMode ? (
                <Input
                  value={editedData.fullName || ''}
                  onChange={(e) => setEditedData((p) => ({ ...p, fullName: e.target.value }))}
                />
              ) : (
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{request.fullName || '—'}</div>
              )}
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Email Address</span>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{request.email}</div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Phone Number</span>
              {editMode ? (
                <Input
                  value={editedData.phone || ''}
                  onChange={(e) => setEditedData((p) => ({ ...p, phone: e.target.value }))}
                />
              ) : (
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{request.phone || '—'}</div>
              )}
            </div>

            {request.address && (
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Residential / Office Address</span>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{request.address}</div>
              </div>
            )}
          </div>
        </Card>

        {/* Commercial Credentials / Corporate Data */}
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            {isDriverRegistration ? 'Commercial License Credentials' : 'Corporate Shipper Verification'}
          </h3>

          {isDriverRegistration && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>CDL License Number</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{request.licenseNumber || '—'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Class: {request.licenseType || 'Standard'} • Expiry: {request.licenseExpiry || 'N/A'}</div>
              </div>

              {request.licenseImageUrl && (
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>License Document Photo</span>
                  <div style={{ marginTop: '6px' }}>
                    <a href={toAbsoluteUrl(request.licenseImageUrl)} target="_blank" rel="noreferrer">
                      <img
                        src={toAbsoluteUrl(request.licenseImageUrl)}
                        alt="CDL License"
                        style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}
                      />
                    </a>
                  </div>
                </div>
              )}

              {request.cvUrl && (
                <div>
                  <a href={toAbsoluteUrl(request.cvUrl)} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" leftIcon={<LuDownload size={14} />}>
                      Download Driver Resume (CV)
                    </Button>
                  </a>
                </div>
              )}
            </div>
          )}

          {isCustomerRegistration && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Company Entity</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{request.companyName || '—'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Tax Code: {request.companyTaxId || 'N/A'} • Industry: {request.companyIndustry || 'N/A'}</div>
              </div>

              {request.businessLicenseUrl && (
                <div>
                  <a href={toAbsoluteUrl(request.businessLicenseUrl)} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" leftIcon={<LuDownload size={14} />}>
                      Download Business License
                    </Button>
                  </a>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Approval Confirmation Modal */}
      {showApprovalModal && (
        <Modal
          isOpen={showApprovalModal}
          onClose={() => setShowApprovalModal(false)}
          title={isDriverRegistration ? 'Authorize Driver Interview Stage' : 'Provision Shipper Account'}
          description="Confirming will update applicant onboarding status and trigger automated email notification."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
              {isDriverRegistration
                ? `An invitation will be dispatched to ${request.email} notifying them that credentials have been verified and inviting them to an onboarding interview.`
                : `A new customer enterprise account will be provisioned for ${request.email} with temporary credentials sent automatically.`}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" onClick={() => setShowApprovalModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConfirmApproval} loading={actionLoading}>
                Confirm & Authorize
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminRegistrationRequestDetailsPage;
