import React, { useEffect, useState } from 'react';
import { profileService, uploadService, authService } from '../../services';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './profile.css';

const getBaseUrl = () => {
  const baseURL = api.defaults.baseURL;
  return baseURL.replace(/\/api\/?$/, '');
};

const ProfileEditPage = () => {
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
    profilePictureUrl: '' 
  });
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
          const url = data.profilePictureUrl.startsWith('http') 
            ? data.profilePictureUrl 
            : `${getBaseUrl()}${data.profilePictureUrl.startsWith('/') ? '' : '/'}${data.profilePictureUrl}`;
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

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      setUploading(true);
      setUploadProgress(0);
      const data = await uploadService.uploadProfilePicture(file, (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      if (data && data.path) {
        setForm((prev) => ({ ...prev, profilePictureUrl: data.path }));
        const url = data.path.startsWith('http') 
          ? data.path 
          : `${getBaseUrl()}${data.path.startsWith('/') ? '' : '/'}${data.path}`;
        setPreviewUrl(url);
        setSuccess('Image uploaded successfully');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      const errorMsg = typeof err === 'string' 
        ? err 
        : (err?.message || err?.msg || 'Upload failed');
      setError(errorMsg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
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
          ? (updated.profilePictureUrl.startsWith('http') 
              ? updated.profilePictureUrl 
              : `${getBaseUrl()}${updated.profilePictureUrl.startsWith('/') ? '' : '/'}${updated.profilePictureUrl}`) 
          : stored.profilePictureUrl,
      };
      localStorage.setItem('user', JSON.stringify(newUser));
      
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: newUser }));
      setSuccess('Profile updated successfully');
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-page-container">
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h1 className="profile-title">Edit Profile</h1>
        <p className="profile-subtitle">Update your personal information and profile picture</p>
      </div>

      {error && <div className="profile-alert alert-error">{error}</div>}
      {success && <div className="profile-alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="profile-form">
        {/* Profile Picture Section */}
        <div className="profile-card">
          <div className="card-header">
            <h2>Profile Picture</h2>
          </div>
          <div className="card-content">
            <div className="profile-picture-section">
              <div className="picture-preview-container">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="profile preview" 
                    className="picture-preview" 
                  />
                ) : (
                  <div className="picture-placeholder">
                    <span className="placeholder-icon">👤</span>
                    <p>No Image</p>
                  </div>
                )}
              </div>
              
              <div className="picture-upload-section">
                <div className="file-input-wrapper">
                  <label htmlFor="profile-picture-input" className="file-input-label">
                    Choose Image
                  </label>
                  <input 
                    id="profile-picture-input"
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="file-input"
                  />
                </div>
                
                {uploading && (
                  <div className="upload-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="progress-text">{uploadProgress}%</p>
                  </div>
                )}
                
                <p className="file-hint">JPG, PNG, GIF or WebP • Max 5MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="profile-card">
          <div className="card-header">
            <h2>Personal Information</h2>
          </div>
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="username-input">Username</label>
                <input 
                  id="username-input"
                  type="text"
                  name="username" 
                  value={form.username} 
                  readOnly 
                  className="form-input form-input-readonly"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email-input">Email Address</label>
                <input 
                  id="email-input"
                  type="email"
                  name="email" 
                  value={form.email} 
                  onChange={handleInput}
                  className="form-input"
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="fullname-input">Full Name</label>
                <input 
                  id="fullname-input"
                  type="text"
                  name="fullName" 
                  value={form.fullName} 
                  onChange={handleInput}
                  className="form-input"
                  placeholder="Your Full Name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone-input">Phone Number</label>
                <input 
                  id="phone-input"
                  type="tel"
                  name="phone" 
                  value={form.phone} 
                  onChange={handleInput}
                  className="form-input"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="profile-actions">
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/profile')}
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditPage;
