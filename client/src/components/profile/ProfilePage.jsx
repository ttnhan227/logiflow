import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { profileService } from '../../services';
import api from '../../services/api';
import PasswordChangeModal from './PasswordChangeModal';
import { Button, Card, CardContent, Badge, PageHeader, LoadingSpinner, Alert } from '@/components/ui';
import {
  LuUser,
  LuMail,
  LuPhone,
  LuShieldCheck,
  LuKey,
  LuPencil,
  LuCalendar,
  LuClock,
} from 'react-icons/lu';

const getBaseUrl = () => {
  const baseURL = api.defaults.baseURL;
  return baseURL.replace(/\/api\/?$/, '');
};

export const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load user profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setSuccessNotice('Your password has been changed successfully.');
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading account profile..." />;
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '48px 16px', maxWidth: '600px' }}>
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  const profilePictureUrl = profile?.profilePictureUrl
    ? profile.profilePictureUrl.startsWith('http')
      ? profile.profilePictureUrl
      : `${getBaseUrl()}${profile.profilePictureUrl.startsWith('/') ? '' : '/'}${profile.profilePictureUrl}`
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '36px 0 64px 0' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        <PageHeader
          badge={<Badge variant="brand">Account Management</Badge>}
          title="User Profile"
          description="View and manage your account identity, contact details, and security credentials."
          actions={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<LuKey size={14} />}
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </Button>
              <Link to="/profile/edit">
                <Button variant="primary" size="sm" leftIcon={<LuPencil size={14} />}>
                  Edit Profile
                </Button>
              </Link>
            </div>
          }
        />
      </div>

      <div className="container" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {successNotice && (
          <Alert variant="success" onClose={() => setSuccessNotice('')}>
            {successNotice}
          </Alert>
        )}

        {/* Identity & Avatar Card */}
        <Card style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '84px',
                height: '84px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--color-slate-100)',
                border: '2px solid var(--border-default)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt={profile?.fullName || profile?.username}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <LuUser size={38} color="var(--color-slate-400)" />
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: 0, color: 'var(--text-primary)' }}>
                  {profile?.fullName || profile?.username}
                </h2>
                <Badge variant={profile?.roleName === 'ADMIN' ? 'danger' : profile?.roleName === 'DISPATCHER' ? 'brand' : 'neutral'} size="sm">
                  {profile?.roleName || 'USER'}
                </Badge>
                <Badge variant={profile?.isActive ? 'success' : 'neutral'} dot size="sm">
                  {profile?.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                @{profile?.username}
              </span>
            </div>
          </div>
        </Card>

        {/* Personal & Account Details */}
        <Card style={{ padding: '32px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 20px 0' }}>
            Account Credentials & Contact Information
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LuMail size={12} /> Email Address
              </span>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {profile?.email || '—'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LuPhone size={12} /> Phone Number
              </span>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {profile?.phone || '—'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LuCalendar size={12} /> Account Created
              </span>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LuClock size={12} /> Last Authentication
              </span>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  );
};

export default ProfilePage;
