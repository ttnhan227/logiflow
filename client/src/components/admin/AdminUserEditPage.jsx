import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userService, uploadService, authService } from '../../services';
import {
  Button,
  Card,
  Input,
  Select,
  Badge,
  PageHeader,
  Alert,
  LoadingSpinner,
} from '@/components/ui';
import {
  LuSave,
  LuArrowLeft,
} from 'react-icons/lu';

export const AdminUserEditPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    profilePictureUrl: '',
    role: '',
    active: true,
  });

  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await userService.getUserById(parseInt(userId));
        setUser(data);
        setForm({
          username: data.username || '',
          email: data.email || '',
          fullName: data.fullName || '',
          phone: data.phone || '',
          profilePictureUrl: data.profilePictureUrl || '',
          role: data.role || 'DRIVER',
          active: data.active ?? true,
        });
      } catch {
        setError('Failed to retrieve user account data.');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadUserDetails();
    }
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim()) {
      setError('Username and email are required fields.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await userService.updateUser({
        id: parseInt(userId),
        username: form.username,
        email: form.email,
        fullName: form.fullName,
        phone: form.phone,
        profilePictureUrl: form.profilePictureUrl,
        role: form.role,
        active: form.active,
      });

      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.username === form.username) {
        const updatedUser = {
          ...currentUser,
          username: form.username,
          role: form.role,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
      }

      navigate(`/admin/users/${userId}`);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to update user account.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Retrieving account settings..." />;
  }

  if (!user) {
    return (
      <div style={{ padding: '24px', maxWidth: '600px' }}>
        <Alert variant="danger">{error || 'User not found.'}</Alert>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <PageHeader
        title={`Edit User • ${user.username}`}
        description={`Update account profile credentials, security role, and active status.`}
        actions={
          <Link to={`/admin/users/${userId}`}>
            <Button variant="outline" size="sm" leftIcon={<LuArrowLeft size={14} />}>
              Cancel & Return
            </Button>
          </Link>
        }
      />

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card style={{ padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Username *"
              required
              value={form.username}
              onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
            />
            <Input
              label="Email Address *"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Full Name"
              value={form.fullName}
              onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
              placeholder="e.g. John Doe"
            />
            <Input
              label="Phone Number"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="+84 90 123 4567"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Select
              label="Assigned System Role *"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              options={[
                { value: 'DRIVER', label: 'DRIVER - Carrier Fleet' },
                { value: 'CUSTOMER', label: 'CUSTOMER - Enterprise Shipper' },
                { value: 'DISPATCHER', label: 'DISPATCHER - Operations Team' },
                { value: 'ADMIN', label: 'ADMIN - System Administrator' },
              ]}
            />
            <Select
              label="Account Access Status *"
              value={form.active ? 'true' : 'false'}
              onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === 'true' }))}
              options={[
                { value: 'true', label: 'Active - Full System Access' },
                { value: 'false', label: 'Suspended - Login Blocked' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <Link to={`/admin/users/${userId}`}>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button variant="primary" type="submit" loading={submitting} leftIcon={<LuSave size={16} />}>
              Save Account Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AdminUserEditPage;
