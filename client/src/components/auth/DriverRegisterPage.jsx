import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { driverRegistrationService, uploadService, api } from '../../services';
import './auth.css';

const DriverRegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [ocrError, setOcrError] = useState('');
  const [editMode, setEditMode] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: License Upload & OCR
    licenseImage: null,
    licenseImagePreview: null,
    licenseImageUrl: null,
    
    // Step 2: Confirm Extracted Info (read-only)
    fullName: '',
    licenseNumber: '',
    licenseType: '',
    licenseExpiry: '',
    dateOfBirth: '',
    address: '',
    
    // Step 3: Contact Information
    phone: '',
    email: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    
    // Step 4: CV Upload & Review
    cvFile: null,
    cvFileName: null,
    cvUrl: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLicenseUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          licenseImage: file,
          licenseImagePreview: reader.result
        }));
        setError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCVUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type (PDF or Word documents)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        cvFile: file,
        cvFileName: file.name
      }));
      setError('');
    }
  };

  const processLicenseImage = async () => {
    setLoading(true);
    setError('');
    setOcrError('');
    
    try {
      // First, upload the license image to get a public URL
      if (formData.licenseImage) {
        const { path } = await uploadService.uploadLicenseImage(formData.licenseImage);
        setFormData(prev => ({ ...prev, licenseImageUrl: path }));
        
        // Call OCR API to extract license information
        try {
          const response = await api.post('/registration/extract-license', {
            imageUrl: path
          });
          
          const result = response.data;
          
          if (result.success && result.data) {
            // Pre-populate form fields with extracted data
            setFormData(prev => ({
              ...prev,
              fullName: result.data.fullName || prev.fullName,
              licenseNumber: result.data.licenseNumber || prev.licenseNumber,
              licenseType: result.data.licenseType || prev.licenseType,
              licenseExpiry: result.data.licenseExpiry || prev.licenseExpiry,
              dateOfBirth: result.data.dateOfBirth || prev.dateOfBirth,
              address: result.data.address || prev.address,
            }));
          } else {
            // Check if the error indicates the document is not a license
            const errorMessage = result.error || 'OCR extraction failed. Please enter information manually.';
            if (errorMessage.includes('license format')) {
              // Document is not a license - prevent proceeding
              setError('Please upload a valid driver\'s license. The uploaded document does not appear to be a license.');
              setLoading(false);
              return;
            } else {
              // OCR failed but allow manual entry
              setOcrError(errorMessage);
            }
          }
        } catch (ocrError) {
          console.error('OCR Error:', ocrError);
          setOcrError('Unable to extract information automatically. Please enter information manually.');
        }
      }
      
      // Upload CV if provided
      if (formData.cvFile) {
        const { path } = await uploadService.uploadCV(formData.cvFile);
        setFormData(prev => ({ ...prev, cvUrl: path }));
      }
      
      setCurrentStep(2);
    } catch (err) {
      setError('Failed to process documents. Please enter information manually.');
      setCurrentStep(2); // Allow manual entry
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.licenseImage) return 'Please upload your driver\'s license';
    return null;
  };

  const validateStep2 = () => {
    // Step 2 is confirmation only - no validation needed, just proceed
    return null;
  };

  const validateStep3 = () => {
    if (!formData.phone.trim()) return 'Phone number is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email format';
    if (!formData.emergencyContactName.trim()) return 'Emergency contact name is required';
    if (!formData.emergencyContactPhone.trim()) return 'Emergency contact phone is required';
    return null;
  };

  const validateStep4 = () => {
    if (!formData.cvFile) return 'Please upload your CV/Resume';
    return null;
  };

  const handleNext = async () => {
    setError('');

    if (currentStep === 1) {
      const error = validateStep1();
      if (error) {
        setError(error);
        return;
      }
      await processLicenseImage();
    } else if (currentStep === 2) {
      const error = validateStep2();
      if (error) {
        setError(error);
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      const error = validateStep3();
      if (error) {
        setError(error);
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      const error = validateStep4();
      if (error) {
        setError(error);
        return;
      }

      await handleSubmit();
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      let finalCvUrl = formData.cvUrl;

      // Upload CV before submitting if not already uploaded
      if (formData.cvFile && !finalCvUrl) {
        const { path } = await uploadService.uploadCV(formData.cvFile);
        finalCvUrl = path;
        setFormData(prev => ({ ...prev, cvUrl: path }));
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
      const msg = data?.message || '';
      if (msg.toLowerCase().includes('approval')) {
        setSuccess(true);
      } else {
        setError(msg || 'Unexpected response from server');
      }
    } catch (err) {
      const apiMessage = err?.response?.data?.message;
      const fallback = typeof err === 'string' ? err : (err?.message || 'Registration failed. Please try again.');
      setError(apiMessage || fallback);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card success-card">
          <div className="success-icon">✓</div>
          <h2>Registration Submitted Successfully!</h2>
          <p className="success-message">
            Thank you for registering as a driver with LogiFlow. Your application has been submitted
            and is pending admin approval.
          </p>
          <div className="info-box">
            <h4>What happens next?</h4>
            <ul>
              <li>Our admin team will review your application</li>
              <li>We'll verify your driver's license and contact information</li>
              <li>You'll receive an email once your account is approved</li>
              <li>After approval, you can log in using your credentials</li>
            </ul>
          </div>
          <p className="info-note">
            This process typically takes 1-2 business days. If you have any questions, please contact
            our support team.
          </p>
          <Link to="/" className="btn btn-primary">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card driver-register-card">
        <div className="auth-header">
          <h2>Driver Registration</h2>
          <p>Join LogiFlow as a delivery driver</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Upload License</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Confirm Info</div>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Contact Info</div>
          </div>
          <div className={`step ${currentStep >= 4 ? 'active' : ''} ${currentStep > 4 ? 'completed' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-label">Review</div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {ocrError && <div className="ocr-error-message">{ocrError}</div>}

        <form onSubmit={(e) => e.preventDefault()}>
          {/* Step 1: License Upload & OCR */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Upload Driver's License</h3>
              <p className="step-description">
                Upload a clear photo of your driver's license for verification.
              </p>

              <div className="license-upload-area">
                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                  Driver's License *
                </label>
                {formData.licenseImagePreview ? (
                  <div className="license-preview">
                    <img src={formData.licenseImagePreview} alt="License preview" />
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        licenseImage: null,
                        licenseImagePreview: null
                      }))}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLicenseUpload}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-placeholder">
                      <div className="upload-icon">📄</div>
                      <p>Click to upload or drag and drop</p>
                      <p className="upload-hint">PNG, JPG or JPEG (max 5MB)</p>
                    </div>
                  </label>
                )}
              </div>

              <div className="tips-box">
                <h4>📸 Tips for a good photo:</h4>
                <ul>
                  <li>Ensure all text is clearly readable</li>
                  <li>Use good lighting - avoid shadows and glare</li>
                  <li>Capture the entire license in the frame</li>
                  <li>Hold the camera steady or place license on a flat surface</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Confirm Extracted Information */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Confirm Extracted Information</h3>
              <p className="step-description">
                Please review the information extracted from your driver's license. You can proceed to the next step or go back to upload a different image.
              </p>

              {/* License Image Display */}
              {formData.licenseImagePreview && (
                <div className="license-confirmation" style={{ marginBottom: '30px' }}>
                  <h4>📄 Uploaded License Image</h4>
                  <div className="license-preview-confirm">
                    <img src={formData.licenseImagePreview} alt="License" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }} />
                  </div>
                </div>
              )}

              {/* Extracted Information Display */}
              <div className="extracted-info-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4>📋 Extracted Information</h4>
                  <button
                    type="button"
                    className={`btn ${editMode ? 'btn-secondary' : 'btn-outline'}`}
                    onClick={() => setEditMode(!editMode)}
                    style={{ fontSize: '14px', padding: '8px 16px' }}
                  >
                    {editMode ? '✏️ Cancel Edit' : '✏️ Edit Fields'}
                  </button>
                </div>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Full Name:</label>
                    {editMode ? (
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Enter full name"
                      />
                    ) : (
                      <div className="info-value">{formData.fullName || 'Not extracted'}</div>
                    )}
                  </div>
                  <div className="info-item">
                    <label>License Number:</label>
                    {editMode ? (
                      <input
                        type="text"
                        name="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Enter license number"
                      />
                    ) : (
                      <div className="info-value">{formData.licenseNumber || 'Not extracted'}</div>
                    )}
                  </div>
                  <div className="info-item">
                    <label>License Type:</label>
                    {editMode ? (
                      <input
                        type="text"
                        name="licenseType"
                        value={formData.licenseType}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Enter license type"
                      />
                    ) : (
                      <div className="info-value">{formData.licenseType || 'Not extracted'}</div>
                    )}
                  </div>
                  <div className="info-item">
                    <label>License Expiry:</label>
                    {editMode ? (
                      <input
                        type="date"
                        name="licenseExpiry"
                        value={formData.licenseExpiry}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    ) : (
                      <div className="info-value">{formData.licenseExpiry || 'Not extracted'}</div>
                    )}
                  </div>
                  <div className="info-item">
                    <label>Date of Birth:</label>
                    {editMode ? (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    ) : (
                      <div className="info-value">{formData.dateOfBirth || 'Not extracted'}</div>
                    )}
                  </div>
                  <div className="info-item full-width">
                    <label>Address:</label>
                    {editMode ? (
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Enter address"
                        rows="3"
                      />
                    ) : (
                      <div className="info-value">{formData.address || 'Not extracted'}</div>
                    )}
                  </div>
                </div>
              </div>

              {ocrError && (
                <div className="ocr-warning" style={{ 
                  backgroundColor: '#fef3c7', 
                  border: '1px solid #f59e0b', 
                  borderRadius: '8px', 
                  padding: '16px', 
                  marginTop: '20px' 
                }}>
                  <div style={{ fontWeight: '600', color: '#92400e', marginBottom: '8px' }}>
                    ⚠️ OCR Extraction Note
                  </div>
                  <div style={{ color: '#78350f' }}>
                    {ocrError}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div className="form-step">
              <h3>Contact Information</h3>
              <p className="step-description">
                Please provide your contact details and emergency contact information.
              </p>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="driver@example.com"
                  required
                />
              </div>

              <hr />
              <h4>Emergency Contact</h4>

              <div className="form-group">
                <label>Emergency Contact Name *</label>
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                  placeholder="Full name of emergency contact"
                  required
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact Phone *</label>
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleInputChange}
                  placeholder="+1234567890"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 4: Review & CV Upload */}
          {currentStep === 4 && (
            <div className="form-step">
              <h3>Review & Upload CV</h3>
              <p className="step-description">
                Review your information and upload your CV/Resume.
              </p>

              {/* Review Section */}
              <div className="review-section">
                <h4>📋 Review Your Information</h4>
                <div className="review-grid">
                  <div className="review-item">
                    <strong>Full Name:</strong> {formData.fullName || 'Not provided'}
                  </div>
                  <div className="review-item">
                    <strong>License Number:</strong> {formData.licenseNumber || 'Not provided'}
                  </div>
                  <div className="review-item">
                    <strong>License Type:</strong> {formData.licenseType || 'Not provided'}
                  </div>
                  <div className="review-item">
                    <strong>License Expiry:</strong> {formData.licenseExpiry || 'Not provided'}
                  </div>
                  <div className="review-item">
                    <strong>Date of Birth:</strong> {formData.dateOfBirth || 'Not provided'}
                  </div>
                  <div className="review-item">
                    <strong>Phone:</strong> {formData.phone || 'Not provided'}
                  </div>
                  <div className="review-item">
                    <strong>Email:</strong> {formData.email || 'Not provided'}
                  </div>
                  <div className="review-item">
                    <strong>Address:</strong> {formData.address || 'Not provided'}
                  </div>
                  <div className="review-item">
                    <strong>Emergency Contact:</strong> {formData.emergencyContactName || 'Not provided'}
                  </div>
                  <div className="review-item">
                    <strong>Emergency Phone:</strong> {formData.emergencyContactPhone || 'Not provided'}
                  </div>
                </div>
              </div>

              {/* CV Upload Section */}
              <div className="cv-upload-section" style={{ marginTop: '30px' }}>
                <h4>📄 Upload Your CV/Resume</h4>
                <p className="cv-description">
                  Upload your CV or resume to complete your application. This helps us understand your experience and qualifications.
                </p>

                {formData.cvFileName ? (
                  <div className="cv-preview" style={{ 
                    padding: '20px', 
                    border: '2px solid #10b981', 
                    borderRadius: '8px',
                    backgroundColor: '#f0fdf4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
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
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        cvFile: null,
                        cvFileName: null
                      }))}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <label className="upload-label" style={{ 
                    border: '2px dashed #d1d5db',
                    borderRadius: '8px',
                    padding: '40px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'block',
                    transition: 'border-color 0.2s'
                  }}>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleCVUpload}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-placeholder">
                      <div className="upload-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                      <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>Click to upload or drag and drop</p>
                      <p className="upload-hint" style={{ color: '#6b7280' }}>PDF or Word document (max 5MB)</p>
                    </div>
                  </label>
                )}
              </div>

              <div className="tips-box" style={{ marginTop: '20px' }}>
                <h4>💡 Tips for your CV:</h4>
                <ul>
                  <li>Include your driving experience and qualifications</li>
                  <li>Mention any relevant certifications or training</li>
                  <li>Keep it updated with your most recent experience</li>
                  <li>Ensure the file is not password-protected</li>
                </ul>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="form-actions">
            {currentStep > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </button>
            )}
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {currentStep === 1 ? 'Processing...' : 'Submitting...'}
                </>
              ) : (
                currentStep === 4 ? 'Submit Application' : 'Next'
              )}
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DriverRegisterPage;
