import React, { useState } from 'react';
import Modal from '../admin/Modal';
import { profileService } from '../../services';
import './profile.css';

const PasswordChangeModal = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!form.newPassword.trim()) {
      newErrors.newPassword = 'New password is required';
    } else if (form.newPassword.length < 6) {
      newErrors.newPassword = 'New password must be at least 6 characters';
    }

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await profileService.changePassword(form.currentPassword, form.newPassword);
      setSubmitting(false);
      onSuccess && onSuccess();
      onClose();
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setErrors({});
    } catch (error) {
      setSubmitting(false);
      let errorMessage = error?.response?.data?.message || error?.response?.data || error?.message || 'Failed to change password';
      if (error?.response?.status === 400) {
        errorMessage = 'Current password is incorrect';
      }
      setErrors({ general: errorMessage });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🔐 Change Password"
      size="medium"
      isLoading={submitting}
    >
      {errors.general && (
        <div className="modal-error" style={{ marginBottom: '20px' }}>
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-row full">
          <div className="form-group">
            <label>
              Current Password <span className="required">*</span>
            </label>
            <input
              type="password"
              name="currentPassword"
              value={form.currentPassword}
              onChange={handleInputChange}
              placeholder="Enter your current password"
              required
              disabled={submitting}
            />
            {errors.currentPassword && (
              <div className="form-error">{errors.currentPassword}</div>
            )}
          </div>
        </div>

        <div className="form-row full">
          <div className="form-group">
            <label>
              New Password <span className="required">*</span>
            </label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleInputChange}
              placeholder="Enter your new password"
              required
              disabled={submitting}
            />
            <div className="form-help">Minimum 6 characters</div>
            {errors.newPassword && (
              <div className="form-error">{errors.newPassword}</div>
            )}
          </div>
        </div>

        <div className="form-row full">
          <div className="form-group">
            <label>
              Confirm New Password <span className="required">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your new password"
              required
              disabled={submitting}
            />
            {errors.confirmPassword && (
              <div className="form-error">{errors.confirmPassword}</div>
            )}
          </div>
        </div>
      </form>

      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? '⏳ Changing...' : '🔐 Change Password'}
        </button>
      </div>
    </Modal>
  );
};

export default PasswordChangeModal;