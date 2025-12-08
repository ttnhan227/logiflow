import React, { useEffect, useState } from 'react';
import { profileService, uploadService, authService } from '../../services';
import api from '../../services/api';
import './home.css';

const getBaseUrl = () => {
  const baseURL = api.defaults.baseURL; // http://localhost:8080/api
  return baseURL.replace(/\/api\/?$/, '');
};

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', fullName: '', phone: '', profilePictureUrl: '' });
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
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
          const url = data.profilePictureUrl.startsWith('http') ? data.profilePictureUrl : `${getBaseUrl()}${data.profilePictureUrl.startsWith('/') ? '' : '/'}${data.profilePictureUrl}`;
          setPreviewUrl(url);
        }
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      setUploading(true);
      const data = await uploadService.uploadProfilePicture(file, (progressEvent) => {
        // progress handling could be added
      });
      if (data && data.path) {
        setForm((prev) => ({ ...prev, profilePictureUrl: data.path }));
        const url = data.path.startsWith('http') ? data.path : `${getBaseUrl()}${data.path.startsWith('/') ? '' : '/'}${data.path}`;
        setPreviewUrl(url);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        fullName: form.fullName || null,
        phone: form.phone || null,
        profilePictureUrl: form.profilePictureUrl || null,
        // email/username could be included if backend allows
        email: form.email || null,
      };
      const updated = await profileService.updateProfile(payload);

      // Update stored user so layouts reflect changes
      const stored = JSON.parse(localStorage.getItem('user') || 'null') || {};
      const newUser = {
        ...stored,
        username: updated.username || stored.username,
        profilePictureUrl: updated.profilePictureUrl ? (updated.profilePictureUrl.startsWith('http') ? updated.profilePictureUrl : `${getBaseUrl()}${updated.profilePictureUrl.startsWith('/') ? '' : '/'}${updated.profilePictureUrl}`) : stored.profilePictureUrl,
      };
      localStorage.setItem('user', JSON.stringify(newUser));
      // notify app of update
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: newUser }));
      setError(null);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to update profile');
    }
  };

  if (loading) return (<div className="page-container"><h2>Profile</h2><div>Loading...</div></div>);

  return (
    <div className="page-container profile-page">
      <div className="page-header"><h2>Your Profile</h2></div>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-row">
          <label>Username</label>
          <input name="username" value={form.username} readOnly />
        </div>
        <div className="form-row">
          <label>Email</label>
          <input name="email" value={form.email} onChange={handleInput} />
        </div>
        <div className="form-row">
          <label>Full name</label>
          <input name="fullName" value={form.fullName} onChange={handleInput} />
        </div>
        <div className="form-row">
          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={handleInput} />
        </div>

        <div className="form-row">
          <label>Profile picture</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 80, height: 80 }}>
              {previewUrl ? (
                <img src={previewUrl} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <div style={{ width: 80, height: 80, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>No Image</div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              {uploading && <div style={{ fontSize: 12 }}>Uploading...</div>}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <button type="submit" className="btn">Save Profile</button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
