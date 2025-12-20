import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { customerRegistrationService, uploadService, api } from '../../services';
import './auth.css';

const CustomerRegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Company Information
    companyName: '',
    companyTaxId: '',
    companyIndustry: '',
    companyAddress: '',
    companyPhone: '',
    companyWebsite: '',

    // Step 2: Authorized User Information
    fullName: '',
    email: '',
    phone: '',
    userPosition: '',

    // Step 3: Document Upload
    businessLicense: null,
    businessLicenseName: null,
    businessLicenseUrl: null,
    taxCertificate: null,
    taxCertificateName: null,
    taxCertificateUrl: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (fieldName, fileNameField, urlField) => (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid image or PDF file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        [fieldName]: file,
        [fileNameField]: file.name
      }));
      setError('');
    }
  };

  const validateStep1 = () => {
    if (!formData.companyName.trim()) return 'Company name is required';
    if (!formData.companyTaxId.trim()) return 'Tax ID is required';
    if (!formData.companyAddress.trim()) return 'Company address is required';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.fullName.trim()) return 'Full name is required';
    if (!formData.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Invalid email format';
    if (!formData.phone.trim()) return 'Phone number is required';
    if (!formData.userPosition.trim()) return 'Position is required';
    return null;
  };

  const validateStep3 = () => {
    if (!formData.businessLicense) return 'Business license is required';
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
      setCurrentStep(2);
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

  const uploadDocuments = async () => {
    const uploads = [];

    // Upload business license
    if (formData.businessLicense) {
      uploads.push(
        uploadService.uploadBusinessLicense(formData.businessLicense)
          .then(({ path }) => setFormData(prev => ({ ...prev, businessLicenseUrl: path })))
      );
    }

    // Upload tax certificate (optional)
    if (formData.taxCertificate) {
      uploads.push(
        uploadService.uploadTaxCertificate(formData.taxCertificate)
          .then(({ path }) => setFormData(prev => ({ ...prev, taxCertificateUrl: path })))
      );
    }

    await Promise.all(uploads);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Upload documents first
      await uploadDocuments();

      // Submit registration
      const data = await customerRegistrationService.registerCustomer({
        companyName: formData.companyName,
        companyTaxId: formData.companyTaxId,
        companyIndustry: formData.companyIndustry,
        companyAddress: formData.companyAddress,
        companyPhone: formData.companyPhone,
        companyWebsite: formData.companyWebsite,
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        userPosition: formData.userPosition,
        businessLicenseUrl: formData.businessLicenseUrl,
        taxCertificateUrl: formData.taxCertificateUrl,
      });

      setSuccess(true);
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
            Thank you for registering {formData.companyName} with LogiFlow. Your application has been submitted
            and is pending admin approval.
          </p>
          <div className="info-box">
            <h4>What happens next?</h4>
            <ul>
              <li>Our admin team will review your company registration</li>
              <li>We'll verify your business documents and contact information</li>
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
      <div className="auth-card customer-register-card">
        <div className="auth-header">
          <h2>Customer Registration</h2>
          <p>Register your company with LogiFlow</p>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Company Info</div>
          </div>
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Contact Person</div>
          </div>
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Documents</div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={(e) => e.preventDefault()}>
          {/* Step 1: Company Information */}
          {currentStep === 1 && (
            <div className="form-step">
              <h3>Company Information</h3>
              <p className="step-description">
                Please provide your company details for registration.
              </p>

              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Enter your company name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tax ID / Business Registration Number *</label>
                  <input
                    type="text"
                    name="companyTaxId"
                    value={formData.companyTaxId}
                    onChange={handleInputChange}
                    placeholder="Enter tax ID or registration number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Industry</label>
                  <select
                    name="companyIndustry"
                    value={formData.companyIndustry}
                    onChange={handleInputChange}
                  >
                    <option value="">Select industry</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Construction">Construction</option>
                    <option value="Retail">Retail</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Technology">Technology</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Company Address *</label>
                <textarea
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleInputChange}
                  placeholder="Enter complete company address"
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Company Phone</label>
                  <input
                    type="tel"
                    name="companyPhone"
                    value={formData.companyPhone}
                    onChange={handleInputChange}
                    placeholder="+1234567890"
                  />
                </div>

                <div className="form-group">
                  <label>Company Website</label>
                  <input
                    type="url"
                    name="companyWebsite"
                    value={formData.companyWebsite}
                    onChange={handleInputChange}
                    placeholder="https://www.company.com"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Authorized User Information */}
          {currentStep === 2 && (
            <div className="form-step">
              <h3>Authorized Contact Person</h3>
              <p className="step-description">
                Please provide details for the person authorized to manage this account.
              </p>

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contact@company.com"
                    required
                  />
                </div>

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
              </div>

              <div className="form-group">
                <label>Position/Title *</label>
                <input
                  type="text"
                  name="userPosition"
                  value={formData.userPosition}
                  onChange={handleInputChange}
                  placeholder="e.g., Logistics Manager, Operations Director"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 3: Document Upload */}
          {currentStep === 3 && (
            <div className="form-step">
              <h3>Business Documents</h3>
              <p className="step-description">
                Upload your business documents for verification. Business license is required.
              </p>

              {/* Business License - Required */}
              <div className="document-upload-section">
                <h4>📄 Business License/Registration Certificate *</h4>
                {formData.businessLicenseName ? (
                  <div className="file-preview">
                    <div className="file-info">
                      <span className="file-icon">📋</span>
                      <span className="file-name">{formData.businessLicenseName}</span>
                      <span className="file-size">
                        {(formData.businessLicense.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        businessLicense: null,
                        businessLicenseName: null
                      }))}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload('businessLicense', 'businessLicenseName', 'businessLicenseUrl')}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-placeholder">
                      <div className="upload-icon">📄</div>
                      <p>Click to upload business license</p>
                      <p className="upload-hint">PDF or image (max 5MB)</p>
                    </div>
                  </label>
                )}
              </div>

              {/* Tax Certificate - Optional */}
              <div className="document-upload-section">
                <h4>🧾 Tax Certificate (Optional)</h4>
                {formData.taxCertificateName ? (
                  <div className="file-preview">
                    <div className="file-info">
                      <span className="file-icon">🧾</span>
                      <span className="file-name">{formData.taxCertificateName}</span>
                      <span className="file-size">
                        {(formData.taxCertificate.size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        taxCertificate: null,
                        taxCertificateName: null
                      }))}
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload('taxCertificate', 'taxCertificateName', 'taxCertificateUrl')}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-placeholder">
                      <div className="upload-icon">🧾</div>
                      <p>Click to upload tax certificate (optional)</p>
                      <p className="upload-hint">PDF or image (max 5MB)</p>
                    </div>
                  </label>
                )}
              </div>



              <div className="tips-box">
                <h4>💡 Document Requirements:</h4>
                <ul>
                  <li>Business license/registration certificate is mandatory</li>
                  <li>Documents should be clear and readable</li>
                  <li>Supported formats: PDF, JPG, PNG</li>
                  <li>Maximum file size: 5MB per document</li>
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
                  {currentStep === 3 ? 'Submitting...' : 'Processing...'}
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

export default CustomerRegisterPage;
