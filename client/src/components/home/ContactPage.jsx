import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Input, Select, Textarea, Badge, PageHeader, Alert } from '@/components/ui';
import {
  LuPhone,
  LuMail,
  LuMapPin,
  LuClock,
  LuSend,
  LuCircleCheck,
  LuCircleHelp,
  LuSearch,
} from 'react-icons/lu';

export const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'general',
    subject: '',
    message: '',
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitStatus('loading');
    setTimeout(() => {
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        type: 'general',
        subject: '',
        message: '',
      });
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">Interface Demo</Badge>}
          title="Contact Form Demonstration"
          description="This page demonstrates form controls and validation. It does not send messages to a live support team."
        />
      </div>

      <section className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {/* Inquiry Form */}
          <Card style={{ padding: '32px' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Try the Form
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
              Submitted values are cleared locally after the simulated response.
            </p>

            {submitStatus === 'success' && (
              <div style={{ marginBottom: '16px' }}>
                <Alert variant="success" onClose={() => setSubmitStatus(null)}>
                  Demo submitted locally. No message was transmitted.
                </Alert>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Input
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Nguyen Van An"
                />
                <Input
                  label="Work Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="an.nguyen@company.vn"
                />
              </div>

              <Select
                label="Inquiry Category"
                name="type"
                value={formData.type}
                onChange={handleChange}
                options={[
                  { value: 'general', label: 'General Corporate Inquiry' },
                  { value: 'business', label: 'Customer Workflow' },
                  { value: 'support', label: 'Shipment Workflow' },
                  { value: 'driver', label: 'Driver Workflow' },
                  { value: 'technical', label: 'Technical Question' },
                ]}
              />

              <Input
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="e.g. Question about the tracking workflow"
              />

              <Textarea
                label="Message Details"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Enter sample form content..."
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitStatus === 'loading'}
                leftIcon={<LuSend size={16} />}
                style={{ marginTop: '8px' }}
              >
                Simulate Submission
              </Button>
            </form>
          </Card>

          {/* Contact Details & Direct Channels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <Card style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LuPhone size={20} color="var(--color-brand-600)" />
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>Project Type</h4>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Academic team project</span>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-brand-700)' }}>
                Demonstration only
              </div>
            </Card>

            <Card style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LuMail size={20} color="var(--color-brand-600)" />
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>Integrations</h4>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Development and sandbox services</span>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                PayPal sandbox and Mistral OCR
              </div>
            </Card>

            <Card style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LuMapPin size={20} color="var(--color-brand-600)" />
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>Sample Geography</h4>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Vietnamese logistics scenarios</span>
                </div>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Map markers, addresses, routes, and contacts in the public interface are sample data.
              </p>
            </Card>

            <Card style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LuClock size={20} color="var(--color-brand-600)" />
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>Availability</h4>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>No live dispatch or customer support service is provided.</div>
                <div>Use the repository issue tracker for project feedback.</div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
