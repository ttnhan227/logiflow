import React, { useState } from 'react';
import { Modal, Input, Button, Alert } from '@/components/ui';
import { LuLock } from 'react-icons/lu';
import { profileService } from '../../services';

export const PasswordChangeModal = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required.';
    }

    if (!form.newPassword.trim()) {
      newErrors.newPassword = 'New password is required.';
    } else if (form.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters.';
    }

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirmation password is required.';
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await profileService.changePassword(form.currentPassword, form.newPassword);
      setSubmitting(false);
      onSuccess && onSuccess();
      onClose();
      setForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
    } catch (error) {
      setSubmitting(false);
      let errorMessage =
        error?.response?.data?.message ||
        error?.response?.data ||
        error?.message ||
        'Failed to change password.';
      if (error?.response?.status === 400) {
        errorMessage = 'Current password is incorrect.';
      }
      setErrors({ general: errorMessage });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Change Account Password"
      description="Update your credentials for accessing the LogiFlow portal."
      maxWidth="480px"
    >
      {errors.general && (
        <div style={{ marginBottom: '16px' }}>
          <Alert variant="danger">{errors.general}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          label="Current Password *"
          type="password"
          name="currentPassword"
          value={form.currentPassword}
          onChange={handleInputChange}
          placeholder="Enter current password"
          error={errors.currentPassword}
          leftIcon={<LuLock size={16} />}
          required
          disabled={submitting}
        />

        <Input
          label="New Password *"
          type="password"
          name="newPassword"
          value={form.newPassword}
          onChange={handleInputChange}
          placeholder="Minimum 6 characters"
          hint="Must contain at least 6 characters."
          error={errors.newPassword}
          leftIcon={<LuLock size={16} />}
          required
          disabled={submitting}
        />

        <Input
          label="Confirm New Password *"
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleInputChange}
          placeholder="Re-enter new password"
          error={errors.confirmPassword}
          leftIcon={<LuLock size={16} />}
          required
          disabled={submitting}
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PasswordChangeModal;