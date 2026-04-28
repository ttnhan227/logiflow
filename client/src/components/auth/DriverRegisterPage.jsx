import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { driverRegistrationService, uploadService, api } from '../../services';
import './auth.css';

const DriverRegisterPage = () => {
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
          setAiExtractionError(result.error || 'We could not extract the license automatically. Please complete the form manually.');
        }
      } catch (aiError) {
        console.error('AI extraction error:', aiError);
        setAiExtractionError('We could not extract the license automatically. Please complete the form manually.');
      }

      setCurrentStep(2);
    } catch (err) {
      console.error('Document processing error:', err);
      setError('Failed to process the uploaded documents. Please try again.');
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
      if (message.toLowerCase().includes('approval')) {
        setSuccess(true);
      } else {
        setError(message || 'Unexpected response from server.');
      }
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      const fallback = typeof err === 'string' ? err : err?.message || 'Application submission failed. Please try again.';
      setError(apiMessage || fallback);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    setError('');

    if (currentStep === 1) {
      const validationError = validateStep1();
      if (validationError) {
        setError(validationError);
        return;
      }
      await processDocuments();
      return;
    }

    if (currentStep === 2) {
      const validationError = validateStep2();
      if (validationError) {
        setError(validationError);
        return;
      }
      setCurrentStep(3);
      return;
    }

    const validationError = validateStep3();
    if (validationError) {
      setError(validationError);
      return;
    }

    await handleSubmit();
  };

  const handleBack = () => {
    setError('');
    setCurrentStep((prev) => prev - 1);
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card success-card">
          <div className="success-icon">✓</div>
          <h2>Application Submitted</h2>
          <p className="success-message">
            Your driver application has been sent successfully. If your profile is shortlisted, we will contact you by email and phone. If selected, you will be invited to an interview. You will also receive an email if your application is not selected.
          </p>
          <div className="info-box">
            <h4>What happens next?</h4>
            <ul>
              <li>Our team reviews your driver license and CV.</li>
              <li>If your profile matches current needs, we will contact you for an interview.</li>
              <li>If not selected, you will still receive an update by email.</li>
            </ul>
          </div>
          <Link to="/drivers" className="btn btn-primary">
            Back to Driver Info
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card driver-register-card">
        <div className="auth-header">
          <h2>Driver Application</h2>
          <p>Upload your documents, complete your profile, and submit your application for review.</p>
        </div>

        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Documents</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Details</div>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Submit</div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {aiExtractionError && currentStep >= 2 && <div className="ai-extraction-error-message">{aiExtractionError}</div>}

        <form onSubmit={(e) => e.preventDefault()}>
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Upload Required Documents</h3>
              <p className="step-description">
                Start by uploading your driver license and CV. We will try to extract license details automatically for you in the next step.
              </p>

              <div className="application-overview">
                <div className="application-overview-card">
                  <strong>Required now</strong>
                  <span>Driver license image and CV or resume.</span>
                </div>
                <div className="application-overview-card">
                  <strong>Next step</strong>
                  <span>Review the extracted fields and fill the remaining information.</span>
                </div>
                <div className="application-overview-card">
                  <strong>Final outcome</strong>
                  <span>If shortlisted, you will be contacted for interview. Otherwise, you will receive a rejection email.</span>
                </div>
              </div>

              <div className="license-upload-area">
                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                  Driver License Image *
                </label>
                {formData.licenseImagePreview ? (
                  <div className="license-preview">
                    <img src={formData.licenseImagePreview} alt="License preview" />
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        licenseImage: null,
                        licenseImagePreview: null,
                        licenseImageUrl: null,
                      }))}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <label className="upload-label">
                    <input type="file" accept="image/*" onChange={handleLicenseUpload} style={{ display: 'none' }} />
                    <div className="upload-placeholder">
                      <div className="upload-icon">📄</div>
                      <p>Click to upload driver license</p>
                      <p className="upload-hint">PNG, JPG, or JPEG up to 5MB</p>
                    </div>
                  </label>
                )}
              </div>

              <div className="cv-upload-section" style={{ marginTop: '24px' }}>
                <h4>Upload CV or Resume *</h4>
                {formData.cvFileName ? (
                  <div className="cv-preview" style={{
                    padding: '20px',
                    border: '2px solid #10b981',
                    borderRadius: '8px',
                    backgroundColor: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ fontSize: '32px' }}>📋</div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#065f46' }}>{formData.cvFileName}</div>
                        <div style={{ fontSize: '13px', color: '#059669' }}>
                          {(formData.cvFile.size / 1024).toFixed(2)} KB
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => setFormData((prev) => ({
                        ...prev,
                        cvFile: null,
                        cvFileName: null,
                        cvUrl: null,
                      }))}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <label className="upload-label upload-card">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleCvUpload}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-placeholder">
                      <div className="upload-icon">📋</div>
                      <p>Click to upload CV or resume</p>
                      <p className="upload-hint">PDF or Word document up to 5MB</p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="form-step">
              <h3>Complete Your Application Details</h3>
              <p className="step-description">
                Review the extracted license details and complete the remaining information needed for screening.
              </p>

              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name *</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="info-item">
                  <label>License Number *</label>
                  <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="info-item">
                  <label>License Type *</label>
                  <input type="text" name="licenseType" value={formData.licenseType} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="info-item">
                  <label>License Expiry</label>
                  <input type="date" name="licenseExpiry" value={formData.licenseExpiry} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="info-item">
                  <label>Date of Birth *</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="info-item full-width">
                  <label>Address *</label>
                  <textarea name="address" value={formData.address} onChange={handleInputChange} className="form-input" rows="3" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+84..." />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="driver@example.com" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Emergency Contact Name *</label>
                  <input type="text" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Emergency Contact Phone *</label>
                  <input type="tel" name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleInputChange} />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="form-step">
              <h3>Submit Application</h3>
              <p className="step-description">
                Review the summary below and submit your application for screening.
              </p>

              <div className="review-section">
                <h4>Application Summary</h4>
                <div className="review-grid">
                  <div className="review-item"><strong>Full Name</strong>{formData.fullName || 'Not provided'}</div>
                  <div className="review-item"><strong>Email</strong>{formData.email || 'Not provided'}</div>
                  <div className="review-item"><strong>Phone</strong>{formData.phone || 'Not provided'}</div>
                  <div className="review-item"><strong>Emergency Contact</strong>{formData.emergencyContactName || 'Not provided'}</div>
                  <div className="review-item"><strong>Emergency Phone</strong>{formData.emergencyContactPhone || 'Not provided'}</div>
                  <div className="review-item"><strong>License Number</strong>{formData.licenseNumber || 'Not provided'}</div>
                  <div className="review-item"><strong>License Type</strong>{formData.licenseType || 'Not provided'}</div>
                  <div className="review-item"><strong>License Expiry</strong>{formData.licenseExpiry || 'Not provided'}</div>
                  <div className="review-item"><strong>Date of Birth</strong>{formData.dateOfBirth || 'Not provided'}</div>
                  <div className="review-item"><strong>Address</strong>{formData.address || 'Not provided'}</div>
                  <div className="review-item"><strong>License Image</strong>{formData.licenseImage ? formData.licenseImage.name : 'Uploaded'}</div>
                  <div className="review-item"><strong>CV</strong>{formData.cvFileName || 'Uploaded'}</div>
                </div>
              </div>

              <div className="terms-box">
                <label className="checkbox-label">
                  <input type="checkbox" name="agreedToReview" checked={formData.agreedToReview} onChange={handleInputChange} />
                  <span>
                    I confirm that this application is accurate. I understand that LogiFlow will review the application, email me whether I am selected or rejected, and contact me for interview only if I move to the next stage.
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="form-actions">
            {currentStep > 1 && (
              <button type="button" className="btn btn-secondary" onClick={handleBack} disabled={loading}>
                Back
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={handleNext} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {currentStep === 1 ? 'Processing...' : 'Submitting...'}
                </>
              ) : currentStep === 3 ? 'Submit Application' : 'Continue'}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p>
            Already interviewed and approved? <Link to="/login">Log in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DriverRegisterPage;