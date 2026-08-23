import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileService, uploadService } from '../../services';
import api from '../../services/api';
import { Button, Card, CardContent, Input, PageHeader, LoadingSpinner, Alert } from '@/components/ui';
import { LuUser, LuCloudUpload, LuSave, LuArrowLeft, LuTrash2 } from 'react-icons/lu';

const getBaseUrl = () => {
  const baseURL = api.defaults.baseURL;
  return baseURL.replace(/\/api\/?$/, '');
};

export const ProfileEditPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    profilePictureUrl: '',
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setForm({
        username: data.username || '',
        email: data.email || '',
        fullName: data.fullName || '',
        phone: data.phone || '',
        profilePictureUrl: data.profilePictureUrl || '',
      });

      if (data.profilePictureUrl) {
        const url = data.profilePictureUrl.startsWith('http')
          ? data.profilePictureUrl
          : `${getBaseUrl()}${data.profilePictureUrl.startsWith('/') ? '' : '/'}${data.profilePictureUrl}`;
        setPreviewUrl(url);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      setUploading(true);
      const data = await uploadService.uploadProfilePicture(file);
      if (data && data.path) {
        setForm((prev) => ({ ...prev, profilePictureUrl: data.path }));
        const url = data.path.startsWith('http')
          ? data.path
          : `${getBaseUrl()}${data.path.startsWith('/') ? '' : '/'}${data.path}`;
        setPreviewUrl(url);
        setSuccess('Profile avatar uploaded successfully.');
      }
    } catch (err) {
      setError(err?.message || 'Avatar upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const payload = {
        fullName: form.fullName || null,
        phone: form.phone || null,
        profilePictureUrl: form.profilePictureUrl || null,
        email: form.email || null,
      };
      const updated = await profileService.updateProfile(payload);

      const stored = JSON.parse(localStorage.getItem('user') || 'null') || {};
      const newUser = {
        ...stored,
        username: updated.username || stored.username,
        profilePictureUrl: updated.profilePictureUrl
          ? updated.profilePictureUrl.startsWith('http')
            ? updated.profilePictureUrl
            : `${getBaseUrl()}${updated.profilePictureUrl.startsWith('/') ? '' : '/'}${updated.profilePictureUrl}`
          : stored.profilePictureUrl,
      };
      localStorage.setItem('user', JSON.stringify(newUser));

      window.dispatchEvent(new CustomEvent('userUpdated', { detail: newUser }));
      setSuccess('Profile updated successfully.');
      setTimeout(() => navigate('/profile'), 1000);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Loading profile editor..." />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', padding: '36px 0 64px 0' }}>
      <div className="container" style={{ maxWidth: '720px' }}>
        <PageHeader
          title="Edit Profile"
          description="Update your contact information and profile avatar."
          actions={
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LuArrowLeft size={14} />}
              onClick={() => navigate('/profile')}
            >
              Cancel
            </Button>
          }
        />
      </div>

      <div className="container" style={{ maxWidth: '720px' }}>
        {error && (
          <div style={{ marginBottom: '16px' }}>
            <Alert variant="danger" onClose={() => setError(null)}>
              {error}
            </Alert>
          </div>
        )}

        {success && (
          <div style={{ marginBottom: '16px' }}>
            <Alert variant="success" onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Avatar Upload Card */}
          <Card style={{ padding: '28px' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
              Profile Photo
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
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
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <LuUser size={36} color="var(--color-slate-400)" />
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-white)',
                    border: '1px solid var(--border-default)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    color: 'var(--text-primary)',
                    boxShadow: 'var(--shadow-xs)',
                  }}
                >
                  <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} style={{ display: 'none' }} />
                  <LuCloudUpload size={16} />
                  <span>{uploading ? 'Uploading...' : 'Upload New Photo'}</span>
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Recommended: Square JPG or PNG, max 5MB
                </span>
              </div>
            </div>
          </Card>

          {/* Form Fields Card */}
          <Card style={{ padding: '28px' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
              Personal & Contact Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Username"
                name="username"
                value={form.username}
                disabled
                hint="Username cannot be altered."
              />

              <Input
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={handleInput}
                placeholder="Enter your full name"
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleInput}
                  placeholder="name@example.com"
                />
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleInput}
                  placeholder="+84..."
                />
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/profile')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={submitting || uploading}
              leftIcon={<LuSave size={16} />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditPage;
