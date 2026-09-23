import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Input, Textarea, Badge, Alert, LoadingSpinner } from '@/components/ui';
import {
  LuCloudUpload,
  LuFileText,
  LuImage,
  LuCircleCheck,
  LuTriangleAlert,
  LuArrowRight,
  LuArrowLeft,
  LuUser,
  LuPhone,
  LuMail,
  LuCheck,
  LuTrash2,
} from 'react-icons/lu';
import { driverRegistrationService, uploadService, api } from '../../services';

export const DriverRegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [aiExtractionError, setAiExtractionError] = useState('');

  const [formData, setFormData] = useState({
    licenseImage: null,
    licenseImagePreview: null,
    licenseImageUrl: null,
    cvFile: null,
    cvFileName: null,
    cvUrl: null,

    fullName: '',
    licenseNumber: '',
    licenseType: '',
    licenseExpiry: '',
    dateOfBirth: '',
    address: '',
    phone: '',
    email: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    agreedToReview: false,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLicenseUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file for the driver license.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Driver license image must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        licenseImage: file,
        licenseImagePreview: reader.result,
        licenseImageUrl: null,
      }));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleCvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document for your CV.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('CV file must be less than 5MB.');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      cvFile: file,
      cvFileName: file.name,
      cvUrl: null,
    }));
    setError('');
  };

  const processDocuments = async () => {
    setLoading(true);
    setError('');
    setAiExtractionError('');

    try {
      const { path } = await uploadService.uploadLicenseImage(formData.licenseImage);
      setFormData((prev) => ({ ...prev, licenseImageUrl: path }));

      try {
        const response = await api.post('/registration/extract-license', { imageUrl: path });
        const result = response.data;

        if (result.success && result.data) {
          setFormData((prev) => ({
            ...prev,
            licenseImageUrl: path,
            fullName: result.data.fullName || prev.fullName,
            licenseNumber: result.data.licenseNumber || prev.licenseNumber,
            licenseType: result.data.licenseType || prev.licenseType,
            licenseExpiry: result.data.licenseExpiry || prev.licenseExpiry,
            dateOfBirth: result.data.dateOfBirth || prev.dateOfBirth,
            address: result.data.address || prev.address,
          }));
        } else {
          setAiExtractionError(result.error || 'We could not extract the license automatically. Please fill the fields manually.');
        }
      } catch {
        setAiExtractionError('We could not extract the license automatically. Please fill the fields manually.');
      }

      setCurrentStep(2);
    } catch {
      setError('Failed to upload and process driver license. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.licenseImage) return 'Please upload a driver license image.';
    if (!formData.cvFile) return 'Please upload your CV or resume.';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.fullName.trim()) return 'Full name is required.';
    if (!formData.licenseNumber.trim()) return 'License number is required.';
    if (!formData.licenseType.trim()) return 'License type is required.';
    if (!formData.dateOfBirth.trim()) return 'Date of birth is required.';
    if (!formData.address.trim()) return 'Address is required.';
    if (!formData.phone.trim()) return 'Phone number is required.';
    if (!formData.email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Enter a valid email address.';
    if (!formData.emergencyContactName.trim()) return 'Emergency contact name is required.';
    if (!formData.emergencyContactPhone.trim()) return 'Emergency contact phone is required.';
    return null;
  };

  const validateStep3 = () => {
    if (!formData.agreedToReview) {
      return 'Please confirm that your application details are accurate before submitting.';
    }
    return null;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      let finalCvUrl = formData.cvUrl;
      if (formData.cvFile && !finalCvUrl) {
        const { path } = await uploadService.uploadCV(formData.cvFile);
        finalCvUrl = path;
        setFormData((prev) => ({ ...prev, cvUrl: path }));
      }

      const data = await driverRegistrationService.registerDriver({
        email: formData.email,
        phone: formData.phone,
        fullName: formData.fullName,
        licenseNumber: formData.licenseNumber,
        licenseType: formData.licenseType,
        licenseExpiry: formData.licenseExpiry,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactPhone: formData.emergencyContactPhone,
        licenseImageUrl: formData.licenseImageUrl,
        cvUrl: finalCvUrl,
      });

      const message = data?.message || '';
      if (message.toLowerCase().includes('approval') || message.toLowerCase().includes('submitted') || data?.id) {
        setSuccess(true);
      } else {
        setError(message || 'Application received.');
        setSuccess(true);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Application submission failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setError('');

    if (currentStep === 1) {
      const v = validateStep1();
      if (v) { setError(v); return; }
      await processDocuments();
      return;
    }

    if (currentStep === 2) {
      const v = validateStep2();
      if (v) { setError(v); return; }
      setCurrentStep(3);
      return;
    }

    const v = validateStep3();
    if (v) { setError(v); return; }

    await handleSubmit();
  };

  if (success) {
    return (
      <div className="container" style={{ padding: '64px 16px', maxWidth: '600px' }}>
        <Card style={{ padding: '40px', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success-50)',
              color: 'var(--color-success-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
            }}
          >
            <LuCircleCheck size={32} />
          </div>

          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: '0 0 8px 0' }}>
            Application Submitted Successfully
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            Your driver partner application has been recorded in our screening pipeline. Our compliance team will review your commercial credentials and notify you via email and phone regarding interview scheduling.
          </p>

          <div
            style={{
              backgroundColor: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '24px',
              fontSize: 'var(--text-xs)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Next Steps:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <LuCheck size={14} color="var(--color-success-600)" />
              <span>Administrator review of submitted license fields</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <LuCheck size={14} color="var(--color-success-600)" />
              <span>Demo role approval in the administrator workflow</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <LuCheck size={14} color="var(--color-success-600)" />
              <span>Mobile sign-in after the account is approved</span>
            </div>
          </div>

          <Link to="/drivers">
            <Button variant="primary" style={{ width: '100%' }}>
              Back to Driver Career Portal
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 16px 64px 16px', maxWidth: '720px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Badge variant="brand" size="sm" style={{ marginBottom: '8px' }}>
          Carrier Onboarding
        </Badge>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: '0 0 6px 0' }}>
          Driver Partner Application
        </h1>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
          Upload your documents, verify credentials, and apply to join LogiFlow's commercial fleet
        </p>
      </div>

      {/* Stepper Progress */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          padding: '16px 24px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 1 ? 'var(--color-brand-600)' : 'var(--color-slate-200)',
              color: currentStep >= 1 ? 'var(--color-white)' : 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            1
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: currentStep === 1 ? 700 : 500, color: 'var(--text-primary)' }}>
            Upload Documents
          </span>
        </div>

        <div style={{ height: '1px', flex: 1, backgroundColor: 'var(--border-default)', margin: '0 12px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 2 ? 'var(--color-brand-600)' : 'var(--color-slate-200)',
              color: currentStep >= 2 ? 'var(--color-white)' : 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            2
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: currentStep === 2 ? 700 : 500, color: 'var(--text-primary)' }}>
            Profile Details
          </span>
        </div>

        <div style={{ height: '1px', flex: 1, backgroundColor: 'var(--border-default)', margin: '0 12px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: currentStep >= 3 ? 'var(--color-brand-600)' : 'var(--color-slate-200)',
              color: currentStep >= 3 ? 'var(--color-white)' : 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            3
          </span>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: currentStep === 3 ? 700 : 500, color: 'var(--text-primary)' }}>
            Review & Submit
          </span>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '20px' }}>
          <Alert variant="danger" onClose={() => setError('')}>
            {error}
          </Alert>
        </div>
      )}

      {aiExtractionError && currentStep >= 2 && (
        <div style={{ marginBottom: '20px' }}>
          <Alert variant="warning" onClose={() => setAiExtractionError('')}>
            {aiExtractionError}
          </Alert>
        </div>
      )}

      <Card style={{ padding: '32px' }}>
        {/* Step 1: Upload Documents */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', margin: '0 0 4px 0' }}>
                1. Upload Driver License & CV
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                High-resolution images help our OCR automatically pre-fill your license credentials.
              </p>
            </div>

            {/* License Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Driver's License Photo (Front) *
              </label>

              {formData.licenseImagePreview ? (
                <div
                  style={{
                    position: 'relative',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    maxHeight: '220px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--color-slate-900)',
                  }}
                >
                  <img
                    src={formData.licenseImagePreview}
                    alt="License Preview"
                    style={{ maxHeight: '220px', width: 'auto', objectFit: 'contain' }}
                  />
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        licenseImage: null,
                        licenseImagePreview: null,
                        licenseImageUrl: null,
                      }))
                    }
                    style={{ position: 'absolute', top: '10px', right: '10px' }}
                    leftIcon={<LuTrash2 size={14} />}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <label
                  style={{
                    border: '2px dashed var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '28px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <input type="file" accept="image/*" onChange={handleLicenseUpload} style={{ display: 'none' }} />
                  <LuImage size={28} color="var(--color-brand-600)" />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-brand-600)' }}>
                    Click to select license image
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PNG, JPG up to 5MB</span>
                </label>
              )}
            </div>

            {/* CV Upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Curriculum Vitae / Driving History Summary *
              </label>

              {formData.cvFileName ? (
                <div
                  style={{
                    padding: '16px',
                    border: '1px solid var(--color-success-200)',
                    backgroundColor: 'var(--color-success-50)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LuFileText size={22} color="var(--color-success-600)" />
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-success-900)' }}>
                        {formData.cvFileName}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--color-success-700)' }}>
                        {(formData.cvFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        cvFile: null,
                        cvFileName: null,
                        cvUrl: null,
                      }))
                    }
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <label
                  style={{
                    border: '2px dashed var(--border-default)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '28px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf"
                    onChange={handleCvUpload}
                    style={{ display: 'none' }}
                  />
                  <LuCloudUpload size={28} color="var(--color-brand-600)" />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-brand-600)' }}>
                    Click to select CV document
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PDF or Word up to 5MB</span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Driver Details */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', margin: '0 0 4px 0' }}>
                2. Profile & License Credentials
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                Please review extracted license fields and complete emergency contacts.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Full Name *"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
              <Input
                label="License Number *"
                name="licenseNumber"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <Input
                label="License Type (e.g. B2, C, FC) *"
                name="licenseType"
                value={formData.licenseType}
                onChange={handleInputChange}
                required
              />
              <Input
                label="License Expiry"
                name="licenseExpiry"
                type="date"
                value={formData.licenseExpiry}
                onChange={handleInputChange}
              />
              <Input
                label="Date of Birth *"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />
            </div>

            <Textarea
              label="Permanent Residential Address *"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={2}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Mobile Phone *"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+84 901 234 567"
                required
              />
              <Input
                label="Email Address *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="driver@example.vn"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Emergency Contact Name *"
                name="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={handleInputChange}
                required
              />
              <Input
                label="Emergency Contact Phone *"
                name="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={handleInputChange}
                placeholder="+84..."
                required
              />
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', margin: '0 0 4px 0' }}>
                3. Final Review & Confirmation
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                Please check the accuracy of your application before final submission.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                padding: '16px',
                backgroundColor: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--text-xs)',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Full Name:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formData.fullName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formData.email}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formData.phone}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>License:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formData.licenseNumber} (Class {formData.licenseType})
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Emergency Contact:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {formData.emergencyContactName} ({formData.emergencyContactPhone})
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Address:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formData.address}</div>
              </div>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '12px',
                backgroundColor: 'var(--color-brand-50)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <input
                type="checkbox"
                name="agreedToReview"
                checked={formData.agreedToReview}
                onChange={handleInputChange}
                style={{ marginTop: '2px' }}
              />
              <span>
                I certify that all uploaded documents and submitted details are truthful and complete. I authorize LogiFlow to verify my commercial driving history and contact me regarding fleet recruitment.
              </span>
            </label>
          </div>
        )}

        {/* Form Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          {currentStep > 1 ? (
            <Button variant="outline" onClick={() => setCurrentStep((prev) => prev - 1)} disabled={loading} leftIcon={<LuArrowLeft size={16} />}>
              Back
            </Button>
          ) : (
            <Link to="/login">
              <Button variant="ghost">Cancel</Button>
            </Link>
          )}

          <Button
            variant="primary"
            onClick={handleNext}
            loading={loading}
            rightIcon={currentStep === 3 ? <LuCheck size={16} /> : <LuArrowRight size={16} />}
          >
            {currentStep === 1 ? 'Process & Continue' : currentStep === 2 ? 'Review Application' : 'Submit Application'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DriverRegisterPage;
