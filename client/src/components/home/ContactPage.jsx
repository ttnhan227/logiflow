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
          badge={<Badge variant="brand">Operational Support</Badge>}
          title="Contact LogiFlow"
          description="Have questions about our multi-modal freight services, corporate rates, or technical API integration? We are here to help."
        />
      </div>

      <section className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {/* Inquiry Form */}
          <Card style={{ padding: '32px' }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
              Send an Inquiry
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
              Our operations and customer support team responds within 2 business hours.
            </p>

            {submitStatus === 'success' && (
              <div style={{ marginBottom: '16px' }}>
                <Alert variant="success" onClose={() => setSubmitStatus(null)}>
                  Your message has been received! A logistics coordinator will contact you shortly.
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
                  { value: 'business', label: 'Enterprise Contract & Quote' },
                  { value: 'support', label: 'Active Shipment Support' },
                  { value: 'driver', label: 'Driver Partner Operations' },
                  { value: 'technical', label: 'API & Technical Integration' },
                ]}
              />

              <Input
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="e.g. FTL Linehaul Quote Request for HCMC - Da Nang"
              />

              <Textarea
                label="Message Details"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe your freight volume, origin/destination hubs, or specific questions..."
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={submitStatus === 'loading'}
                leftIcon={<LuSend size={16} />}
                style={{ marginTop: '8px' }}
              >
                Submit Inquiry
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
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>Command Center Hotline</h4>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>24/7 Dedicated Support</span>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-brand-700)' }}>
                +84 1900-1234
              </div>
            </Card>

            <Card style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LuMail size={20} color="var(--color-brand-600)" />
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>Enterprise Sales Email</h4>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>B2B Quotes & Inquiries</span>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                business@logiflow.vn
              </div>
            </Card>

            <Card style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LuMapPin size={20} color="var(--color-brand-600)" />
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>Corporate Headquarters</h4>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Ho Chi Minh City</span>
                </div>
              </div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                123 Nguyen Trai Street, District 1, Ho Chi Minh City, Vietnam 70000
              </p>
            </Card>

            <Card style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LuClock size={20} color="var(--color-brand-600)" />
                </div>
                <div>
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: 0 }}>Business Desk Hours</h4>
                </div>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>Monday – Friday: <strong>8:00 AM – 6:00 PM ICT</strong></div>
                <div>Saturday: <strong>8:00 AM – 12:00 PM ICT</strong></div>
                <div>Dispatch Emergency: <strong>24/7 Telemetry On-Call</strong></div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
