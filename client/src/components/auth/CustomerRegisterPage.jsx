import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Input, Select, Textarea, Badge, Alert } from '@/components/ui';
import {
  LuBuilding2,
  LuUser,
  LuFileText,
  LuCloudUpload,
  LuCircleCheck,
  LuArrowRight,
  LuArrowLeft,
  LuCheck,
  LuTrash2,
} from 'react-icons/lu';
import { customerRegistrationService, uploadService } from '../../services';

export const CustomerRegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    companyName: '',
    companyTaxId: '',
    companyIndustry: '',
    companyAddress: '',
    companyPhone: '',
    companyWebsite: '',

    fullName: '',
    email: '',
    phone: '',
    userPosition: '',

    businessLicense: null,
    businessLicenseName: null,
    businessLicenseUrl: null,
    taxCertificate: null,
    taxCertificateName: null,
    taxCertificateUrl: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (fieldName, fileNameField) => (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a valid image or PDF file.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB.');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        [fieldName]: file,
        [fileNameField]: file.name,
      }));
      setError('');
    }
  };

  const validateStep1 = () => {
    if (!formData.companyName.trim()) return 'Company name is required.';
    if (!formData.companyTaxId.trim()) return 'Tax ID / Business Registration Number is required.';
    if (!formData.companyAddress.trim()) return 'Company address is required.';
    return null;
  };

  const validateStep2 = () => {
    if (!formData.fullName.trim()) return 'Authorized representative full name is required.';
    if (!formData.email.trim()) return 'Corporate email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Enter a valid corporate email format.';
    if (!formData.phone.trim()) return 'Phone number is required.';
    if (!formData.userPosition.trim()) return 'Representative job title is required.';
    return null;
  };

  const validateStep3 = () => {
    if (!formData.businessLicense) return 'Business license / ERC document is required.';
    return null;
  };

  const handleNext = async () => {
    setError('');

    if (currentStep === 1) {
      const v = validateStep1();
      if (v) { setError(v); return; }
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      const v = validateStep2();
      if (v) { setError(v); return; }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      const v = validateStep3();
      if (v) { setError(v); return; }
      await handleSubmit();
    }
  };

  const uploadDocuments = async () => {
    const uploads = [];

    if (formData.businessLicense && !formData.businessLicenseUrl) {
      uploads.push(
        uploadService.uploadBusinessLicense(formData.businessLicense).then(({ path }) => {
          setFormData((prev) => ({ ...prev, businessLicenseUrl: path }));
          return path;
        })
      );
    }

    if (formData.taxCertificate && !formData.taxCertificateUrl) {
      uploads.push(
        uploadService.uploadTaxCertificate(formData.taxCertificate).then(({ path }) => {
          setFormData((prev) => ({ ...prev, taxCertificateUrl: path }));
          return path;
        })
      );
    }

    const results = await Promise.all(uploads);
    return results;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      let licenseUrl = formData.businessLicenseUrl;
      let taxUrl = formData.taxCertificateUrl;

      if (formData.businessLicense && !licenseUrl) {
        const { path } = await uploadService.uploadBusinessLicense(formData.businessLicense);
        licenseUrl = path;
      }

      if (formData.taxCertificate && !taxUrl) {
        const { path } = await uploadService.uploadTaxCertificate(formData.taxCertificate);
        taxUrl = path;
      }

      await customerRegistrationService.registerCustomer({
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
        businessLicenseUrl: licenseUrl,
        taxCertificateUrl: taxUrl,
      });

      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Company registration failed.');
    } finally {
      setLoading(false);
    }
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
            Corporate Registration Submitted
          </h2>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            Thank you for registering <strong>{formData.companyName}</strong>. Our enterprise compliance team will review your business license certificate and provision your corporate dispatch credentials within 1 business day.
          </p>

          <Link to="/">
            <Button variant="primary" style={{ width: '100%' }}>
              Return to Homepage
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
          Enterprise Account
        </Badge>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: '0 0 6px 0' }}>
          Corporate Customer Registration
        </h1>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
          Register your business organization to book dedicated freight, access volume rate tiers, and manage dispatch orders.
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
            Company Details
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
            Contact Representative
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
            Documents
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

      <Card style={{ padding: '32px' }}>
        {/* Step 1: Company Info */}
        {currentStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', margin: '0 0 4px 0' }}>
              1. Business Organization Information
            </h3>

            <Input
              label="Company Name *"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="e.g. VinFast Logistics JSC"
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Tax ID / Registration Code *"
                name="companyTaxId"
                value={formData.companyTaxId}
                onChange={handleInputChange}
                placeholder="0102345678"
                required
              />
              <Select
                label="Industry Sector"
                name="companyIndustry"
                value={formData.companyIndustry}
                onChange={handleInputChange}
                options={[
                  { value: '', label: 'Select Industry' },
                  { value: 'Manufacturing', label: 'Manufacturing & Industrial' },
                  { value: 'Retail', label: 'E-commerce & Retail' },
                  { value: 'Construction', label: 'Construction & Raw Materials' },
                  { value: 'Technology', label: 'Technology & Hardware' },
                  { value: 'Logistics', label: '3PL & Freight Forwarding' },
                  { value: 'Healthcare', label: 'Pharma & Medical Supplies' },
                  { value: 'Other', label: 'Other' },
                ]}
              />
            </div>

            <Textarea
              label="Registered Office Address *"
              name="companyAddress"
              value={formData.companyAddress}
              onChange={handleInputChange}
              placeholder="Full registered headquarters address"
              rows={2}
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Corporate Switchboard Phone"
                name="companyPhone"
                value={formData.companyPhone}
                onChange={handleInputChange}
                placeholder="+84 28 3822 0000"
              />
              <Input
                label="Company Website"
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleInputChange}
                placeholder="https://example.vn"
              />
            </div>
          </div>
        )}

        {/* Step 2: Contact Person */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', margin: '0 0 4px 0' }}>
              2. Authorized Representative
            </h3>

            <Input
              label="Full Name *"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="e.g. Tran Minh Tuan"
              required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input
                label="Corporate Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="tuan.tran@company.vn"
                required
              />
              <Input
                label="Direct Phone Number *"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+84 908 123 456"
                required
              />
            </div>

            <Input
              label="Job Position / Role *"
              name="userPosition"
              value={formData.userPosition}
              onChange={handleInputChange}
              placeholder="e.g. Supply Chain Manager / Logistics Director"
              required
            />
          </div>
        )}

        {/* Step 3: Documents */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', margin: '0 0 4px 0' }}>
              3. Verification Documents
            </h3>

            {/* Business License */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Business License / Enterprise Registration Certificate (ERC) *
              </label>

              {formData.businessLicenseName ? (
                <div
                  style={{
                    padding: '14px 16px',
                    border: '1px solid var(--color-success-200)',
                    backgroundColor: 'var(--color-success-50)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LuFileText size={20} color="var(--color-success-600)" />
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-success-900)' }}>
                      {formData.businessLicenseName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        businessLicense: null,
                        businessLicenseName: null,
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
                    padding: '24px',
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
                    accept="image/*,.pdf"
                    onChange={handleFileUpload('businessLicense', 'businessLicenseName')}
                    style={{ display: 'none' }}
                  />
                  <LuCloudUpload size={26} color="var(--color-brand-600)" />
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-brand-600)' }}>
                    Upload Business License (PDF or Image)
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max file size: 5MB</span>
                </label>
              )}
            </div>

            {/* Optional Tax Cert */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Tax Identification Certificate (Optional)
              </label>

              {formData.taxCertificateName ? (
                <div
                  style={{
                    padding: '14px 16px',
                    border: '1px solid var(--color-success-200)',
                    backgroundColor: 'var(--color-success-50)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <LuFileText size={20} color="var(--color-success-600)" />
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-success-900)' }}>
                      {formData.taxCertificateName}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        taxCertificate: null,
                        taxCertificateName: null,
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
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: 'var(--bg-surface-subtle)',
                  }}
                >
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload('taxCertificate', 'taxCertificateName')}
                    style={{ display: 'none' }}
                  />
                  <LuFileText size={24} color="var(--color-slate-500)" />
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    Upload Tax Certificate (optional)
                  </span>
                </label>
              )}
            </div>
          </div>
        )}

        {/* Action Controls */}
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
            {currentStep === 3 ? 'Submit Corporate Application' : 'Continue'}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CustomerRegisterPage;
