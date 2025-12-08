import React, { useEffect, useState } from 'react';
import { profileService, authService } from '../../services';
import api from '../../services/api';
import './profile.css';

const getBaseUrl = () => {
  const baseURL = api.defaults.baseURL;
  return baseURL.replace(/\/api\/?$/, '');
};

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await profileService.getProfile();
        setProfile(data);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);



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

  if (error) {
    return (
      <div className="profile-page-container">
        <div className="profile-alert alert-error">{error}</div>
      </div>
    );
  }

  const profilePictureUrl = profile?.profilePictureUrl 
    ? (profile.profilePictureUrl.startsWith('http') 
        ? profile.profilePictureUrl 
        : `${getBaseUrl()}${profile.profilePictureUrl.startsWith('/') ? '' : '/'}${profile.profilePictureUrl}`)
    : null;

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h1 className="profile-title">Your Profile</h1>
        <p className="profile-subtitle">View your personal information</p>
      </div>

      {/* Profile Picture Section */}
      <div className="profile-card">
        <div className="card-header">
          <h2>Profile Picture</h2>
        </div>
        <div className="card-content">
          <div className="profile-picture-view-section">
            {profilePictureUrl ? (
              <img 
                src={profilePictureUrl} 
                alt="profile" 
                className="picture-preview" 
              />
            ) : (
              <div className="picture-placeholder">
                <span className="placeholder-icon">👤</span>
                <p>No Image</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="profile-card">
        <div className="card-header">
          <h2>Personal Information</h2>
        </div>
        <div className="card-content">
          <div className="info-grid">
            <div className="info-item">
              <label>Username</label>
              <p className="info-value">{profile?.username || '-'}</p>
            </div>

            <div className="info-item">
              <label>Email Address</label>
              <p className="info-value">{profile?.email || '-'}</p>
            </div>

            <div className="info-item">
              <label>Full Name</label>
              <p className="info-value">{profile?.fullName || '-'}</p>
            </div>

            <div className="info-item">
              <label>Phone Number</label>
              <p className="info-value">{profile?.phone || '-'}</p>
            </div>

            <div className="info-item">
              <label>Role</label>
              <p className="info-value">
                <span className={`role-badge role-badge-${profile?.roleName?.toLowerCase()}`}>
                  {profile?.roleName || '-'}
                </span>
              </p>
            </div>

            <div className="info-item">
              <label>Status</label>
              <p className="info-value">
                <span className={`status-badge ${profile?.isActive ? 'status-active' : 'status-inactive'}`}>
                  {profile?.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>

            <div className="info-item">
              <label>Member Since</label>
              <p className="info-value info-date">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
              </p>
            </div>

            <div className="info-item">
              <label>Last Login</label>
              <p className="info-value info-date">
                {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleDateString() : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="profile-actions">
        <a href="/profile/edit" className="btn btn-primary">
          Edit Profile
        </a>
      </div>
    </div>
  );
};

export default ProfilePage;
