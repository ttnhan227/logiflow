import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Badge, PageHeader } from '@/components/ui';
import {
  LuBuilding2,
  LuWebhook,
  LuChartColumn,
  LuTruck,
  LuZap,
  LuShieldCheck,
  LuCircleCheck,
  LuArrowRight,
  LuPhone,
  LuMail,
  LuFileText,
} from 'react-icons/lu';

export const BusinessPage = () => {
  const capabilities = [
    {
      title: 'Administrator Workflow',
      description: 'Manage users, vehicles, orders, trips, and assignment records through role-restricted screens.',
      icon: <LuBuilding2 size={24} color="var(--color-brand-600)" />,
    },
    {
      title: 'Spring Boot REST API',
      description: 'Expose authenticated endpoints used by the React and Flutter clients.',
      icon: <LuWebhook size={24} color="var(--color-brand-600)" />,
    },
    {
      title: 'Operational Dashboards',
      description: 'Present order, trip, vehicle, and invoice data from PostgreSQL in role-specific views.',
      icon: <LuChartColumn size={24} color="var(--color-brand-600)" />,
    },
    {
      title: 'Driver Recommendations',
      description: 'Rank available drivers using license compatibility, vehicle capacity, availability, and distance rules.',
      icon: <LuTruck size={24} color="var(--color-brand-600)" />,
    },
    {
      title: 'WebSocket Tracking',
      description: 'Broadcast authorized, trip-scoped driver coordinates to customer and operations maps.',
      icon: <LuZap size={24} color="var(--color-brand-600)" />,
    },
    {
      title: 'Billing Demonstration',
      description: 'Generate invoice PDFs and exercise checkout through PayPal sandbox mode.',
      icon: <LuShieldCheck size={24} color="var(--color-brand-600)" />,
    },
  ];

  const tiers = [
    {
      name: 'Customer Flow',
      volume: 'Web and mobile',
      description: 'Demonstrates order entry, shipment views, tracking, delivery confirmation, and billing.',
      features: [
        'Authenticated customer account',
        'Order and shipment records',
        'Trip tracking and proof of delivery',
        'Invoice PDF and PayPal sandbox checkout',
      ],
      popular: false,
    },
    {
      name: 'Operations Flow',
      volume: 'React web client',
      description: 'Demonstrates administrative and dispatch tasks for the sample data model.',
      features: [
        'Role-based administration',
        'Driver and vehicle records',
        'Trip planning and assignment',
        'Rule-based driver recommendations',
        'Operational status views',
      ],
      popular: true,
    },
    {
      name: 'Driver Flow',
      volume: 'Flutter mobile client',
      description: "Demonstrates the driver's portion of an assigned delivery.",
      features: [
        'Driver registration and profile',
        'Assigned trip details',
        'Trip-scoped GPS updates',
        'Delivery status changes',
        'Recipient signature capture',
      ],
      popular: false,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">Project Workflows</Badge>}
          title="Customer, Operations, and Driver Demonstrations"
          description="These are implemented portfolio workflows, not commercial plans or service commitments."
        />
      </div>

      {/* Enterprise Capabilities Grid */}
      <section className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {capabilities.map((cap) => (
            <Card key={cap.title} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-brand-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {cap.icon}
              </div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
                {cap.title}
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {cap.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Implementation summary */}
      <section className="container">
        <Card style={{ padding: '36px', backgroundColor: 'var(--color-slate-900)', color: 'var(--color-white)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            <Badge variant="brand" size="sm" style={{ width: 'fit-content' }}>
              Implementation Summary
            </Badge>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-white)', margin: 0 }}>
              Technical Building Blocks
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-brand-500)', fontVariantNumeric: 'tabular-nums' }}>
                3
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '4px' }}>Application Roles</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: '4px 0 0 0' }}>
                Customer, driver, and administrator flows.
              </p>
            </div>

            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-brand-500)', fontVariantNumeric: 'tabular-nums' }}>
                REST
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '4px' }}>Backend API</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: '4px 0 0 0' }}>
                Spring Boot endpoints backed by PostgreSQL.
              </p>
            </div>

            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-brand-500)', fontVariantNumeric: 'tabular-nums' }}>
                WS
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '4px' }}>Location Channel</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: '4px 0 0 0' }}>
                WebSocket updates for active trips.
              </p>
            </div>

            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-brand-500)', fontVariantNumeric: 'tabular-nums' }}>
                Test
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '4px' }}>Checkout Mode</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: '4px 0 0 0' }}>
                PayPal integration uses sandbox credentials.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Volume Tiers */}
      <section className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
            Demonstration Areas
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Explore the implemented flows without implied pricing or commercial availability.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: tier.popular ? '2px solid var(--color-brand-600)' : '1px solid var(--border-default)',
                position: 'relative',
              }}
            >
              {tier.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '20px',
                    backgroundColor: 'var(--color-brand-600)',
                    color: 'var(--color-white)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 10px',
                    borderRadius: 'var(--radius-full)',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Main Demo
                </div>
              )}

              <CardContent style={{ padding: '28px', display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    {tier.name}
                  </h3>
                  <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-brand-600)' }}>
                    {tier.volume}
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                    {tier.description}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  {tier.features.map((f, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      <LuCircleCheck size={14} color="var(--color-success-600)" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                  <Link to="/contact">
                    <Button variant={tier.popular ? 'primary' : 'outline'} style={{ width: '100%' }}>
                      View Project Information
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Direct Contact Bar */}
      <section className="container">
        <div
          style={{
            padding: '36px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: '0 0 4px 0' }}>
              LogiFlow Is a Portfolio Project
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              It does not operate a carrier network, support desk, or commercial service.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/about">
              <Button variant="primary" leftIcon={<LuPhone size={16} />}>
                About the Project
              </Button>
            </Link>
            <Link to="/faq">
              <Button variant="outline" leftIcon={<LuMail size={16} />}>
                Read the Demo FAQ
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BusinessPage;
