import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { driverRegistrationService, uploadService } from '../../services';
import './auth.css';

const DriverRegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: License & CV Upload
    licenseImage: null,
    licenseImagePreview: null,
    licenseImageUrl: null,
    cvFile: null,
    cvFileName: null,
    cvUrl: null,
    
    // Step 2: Personal Info (auto-filled from license or manual)
    fullName: '',
    licenseNumber: '',
    licenseType: '',
    licenseExpiry: '',
    dateOfBirth: '',
    address: '',
    
    // Step 3: Contact Info
    phone: '',
    email: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
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
    
    try {
      // First, upload the license image to get a public URL
      if (formData.licenseImage) {
        const { path } = await uploadService.uploadLicenseImage(formData.licenseImage);
        setFormData(prev => ({ ...prev, licenseImageUrl: path }));
      }
      
      // Upload CV if provided
      if (formData.cvFile) {
        const { path } = await uploadService.uploadCV(formData.cvFile);
        setFormData(prev => ({ ...prev, cvUrl: path }));
      }
      
      // TODO: Implement OCR API call here
      // For now, simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulated extracted data - replace with actual OCR results
      setFormData(prev => ({
        ...prev,
        fullName: 'John Doe', // From OCR
        licenseNumber: 'DL123456789', // From OCR
        licenseType: 'Class B', // From OCR
        licenseExpiry: '2026-12-31', // From OCR
        address: '123 Main St, City, State' // From OCR
      }));
      
      setCurrentStep(2);
    } catch (err) {
      setError('Failed to process documents. Please enter information manually.');
      setCurrentStep(2); // Allow manual entry
    } finally {
      setLoading(false);
    }
  };

  const validateStep2 = () => {
    if (!formData.fullName.trim()) return 'Full name is required';
    if (!formData.licenseNumber.trim()) return 'License number is required';
    if (!formData.licenseType.trim()) return 'License type is required';
    if (!formData.licenseExpiry) return 'License expiry date is required';
    
    // Check if license is expired
    const expiryDate = new Date(formData.licenseExpiry);
    if (expiryDate < new Date()) return 'License has expired';
    
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

  const handleNext = async () => {
    setError('');

    if (currentStep === 1) {
      if (!formData.licenseImage) {
        setError('Please upload your driver\'s license');
        return;
      }
      if (!formData.cvFile) {
        setError('Please upload your CV/Resume');
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
        cvUrl: formData.cvUrl,
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
          <Link to="/login" className="btn btn-primary">
            Return to Login
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
            <div className="step-label">Documents</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Personal Info</div>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Contact</div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={(e) => e.preventDefault()}>
          {/* Step 1: License & CV Upload */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Upload Driver's License & CV</h3>
              <p className="step-description">
                Upload a clear photo of your driver's license and your CV/Resume.
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

              <div className="license-upload-area" style={{ marginTop: '20px' }}>
                <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                  CV / Resume *
                </label>
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
                  <label className="upload-label">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleCVUpload}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-placeholder">
                      <div className="upload-icon">📋</div>
                      <p>Click to upload or drag and drop</p>
                      <p className="upload-hint">PDF or Word document (max 5MB)</p>
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

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Personal Information</h3>
              <p className="step-description">
                {formData.licenseImage ? 
                  'Review and correct the extracted information if needed.' :
                  'Please enter your personal information manually.'
                }
              </p>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="As shown on license"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>License Number *</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="DL123456789"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>License Type *</label>
                  <select
                    name="licenseType"
                    value={formData.licenseType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select type</option>
                    <option value="Class A">Class A - Heavy vehicles</option>
                    <option value="Class B">Class B - Medium vehicles</option>
                    <option value="Class C">Class C - Light vehicles</option>
                    <option value="Motorcycle">Motorcycle</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>License Expiry *</label>
                  <input
                    type="date"
                    name="licenseExpiry"
                    value={formData.licenseExpiry}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Current residential address"
                />
              </div>
            </div>
          )}

          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div className="form-step">
              <h3>Contact Information</h3>
              <p className="step-description">
                Provide your contact details and emergency contact.
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
                  placeholder="Full name"
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
                currentStep === 3 ? 'Submit Application' : 'Next'
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
