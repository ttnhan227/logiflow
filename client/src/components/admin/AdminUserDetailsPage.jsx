import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userService } from '../../services';
import {
  Button,
  Card,
  Badge,
  PageHeader,
  Alert,
  LoadingSpinner,
} from '@/components/ui';
import {
  LuUser,
  LuMail,
  LuPhone,
  LuShield,
  LuCalendar,
  LuPencil,
  LuArrowLeft,
  LuBuilding2,
  LuAward,
} from 'react-icons/lu';

export const AdminUserDetailsPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [roleSpecificData, setRoleSpecificData] = useState(null);

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await userService.getUserById(parseInt(userId));
        setUser(data);

        if (data && data.role) {
          try {
            let extendedData = null;
            if (data.role === 'DRIVER') {
              const driversResult = await userService.searchDrivers(data.username, 0, 1);
              extendedData = driversResult.content?.find((d) => d.id === parseInt(userId));
            } else if (data.role === 'CUSTOMER') {
              const customersResult = await userService.searchCustomers(data.username, 0, 1);
              extendedData = customersResult.content?.find((c) => c.id === parseInt(userId));
            } else if (data.role === 'DISPATCHER') {
              const dispatchersResult = await userService.searchDispatchers(data.username, 0, 1);
              extendedData = dispatchersResult.content?.find((d) => d.id === parseInt(userId));
            }
            setRoleSpecificData(extendedData || data);
          } catch {
            setRoleSpecificData(data);
          }
        }
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Failed to query user profile details.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadUserDetails();
    }
  }, [userId]);

  if (loading) {
    return <LoadingSpinner fullPage text="Retrieving identity credentials..." />;
  }

  if (error || !user) {
    return (
      <div style={{ padding: '24px', maxWidth: '600px' }}>
        <Alert variant="danger">{error || 'User not found.'}</Alert>
        <div style={{ marginTop: '16px' }}>
          <Link to="/admin/dashboard">
            <Button variant="outline" leftIcon={<LuArrowLeft size={14} />}>
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const roleBackLink = `/admin/users/${user.role?.toLowerCase()}s`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={`User Profile • ${user.username}`}
        description={`Enterprise ${user.role} Account • ID: #${user.id}`}
        badge={<Badge variant={user.active ? 'success' : 'danger'}>{user.active ? 'ACTIVE' : 'SUSPENDED'}</Badge>}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to={roleBackLink}>
              <Button variant="outline" size="sm" leftIcon={<LuArrowLeft size={14} />}>
                Back to {user.role}s
              </Button>
            </Link>
            <Link to={`/admin/users/${userId}/edit`}>
              <Button variant="primary" size="sm" leftIcon={<LuPencil size={14} />}>
                Edit Account
              </Button>
            </Link>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Core Identity Card */}
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            Identity & Contact Details
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Username</span>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{user.username}</div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Full Name</span>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{user.fullName || '—'}</div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Email Address</span>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{user.email}</div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Phone Number</span>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{user.phone || '—'}</div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Role</span>
              <div style={{ marginTop: '4px' }}>
                <Badge variant="brand" size="sm">{user.role || 'N/A'}</Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Extended Role Attributes Card */}
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            Role-Specific Profile Attributes
          </h3>

          {user.role === 'DRIVER' && roleSpecificData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Commercial License</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{roleSpecificData.licenseNumber || '—'}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Type: {roleSpecificData.licenseType || 'STANDARD'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Experience & Rating</span>
                <div style={{ fontSize: 'var(--text-sm)' }}>{roleSpecificData.yearsExperience || 0} years experience • Rating: ★ {roleSpecificData.rating || '5.0'}</div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Health & Duty Status</span>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <Badge variant="success" size="sm">{roleSpecificData.healthStatus || 'FIT'}</Badge>
                  <Badge variant="neutral" size="sm">{roleSpecificData.status || 'Active'}</Badge>
                </div>
              </div>
            </div>
          )}

          {user.role === 'CUSTOMER' && roleSpecificData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Company Entity</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{roleSpecificData.companyName || 'Individual Shipper'}</div>
                {roleSpecificData.companyCode && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Code: {roleSpecificData.companyCode}</div>
                )}
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Order Volume & Spend</span>
                <div style={{ fontSize: 'var(--text-sm)' }}>
                  {roleSpecificData.totalOrders || 0} lifetime orders • {Number(roleSpecificData.totalSpent || 0).toLocaleString()} VND spent
                </div>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Preferred Settlement</span>
                <div style={{ fontSize: 'var(--text-sm)' }}>{roleSpecificData.preferredPaymentMethod?.replace('_', ' ') || 'STANDARD'}</div>
              </div>
            </div>
          )}

          {user.role === 'DISPATCHER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Dispatch Authority</span>
              <div style={{ padding: '12px', backgroundColor: 'var(--color-success-50)', border: '1px solid var(--color-success-200)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-success-900)' }}>
                ✓ Route Manifest Authorization & Optimization<br />
                ✓ Real-Time Driver Fleet Allocation & Dispatch<br />
                ✓ Live SLA Monitoring & Telemetry Supervision
              </div>
            </div>
          )}

          {user.role === 'ADMIN' && (
            <div style={{ padding: '12px', backgroundColor: 'var(--color-brand-50)', border: '1px solid var(--color-brand-200)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-brand-900)' }}>
              👑 Super Administrator Access • Unrestricted enterprise privileges across billing, fleet assets, and security logs.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AdminUserDetailsPage;
