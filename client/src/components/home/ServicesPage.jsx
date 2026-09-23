import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Badge, PageHeader } from '@/components/ui';
import {
  LuPackage,
  LuZap,
  LuTruck,
  LuBuilding2,
  LuChartLine,
  LuShieldCheck,
  LuClock,
  LuMapPin,
  LuCircleCheck,
  LuArrowRight,
  LuLayers,
} from 'react-icons/lu';

export const ServicesPage = () => {
  const individualServices = [
    {
      title: 'Standard Linehaul Freight',
      description: 'A sample order scenario used to demonstrate order entry, trip planning, and shipment status.',
      price: 'Sample scenario',
      timeline: 'No service commitment',
      icon: <LuPackage size={24} color="var(--color-brand-600)" />,
      badge: 'Standard',
      popular: false,
    },
    {
      title: 'Express Priority Dispatch',
      description: 'A sample priority label for exercising the order and assignment interfaces.',
      price: 'Sample scenario',
      timeline: 'No service commitment',
      icon: <LuZap size={24} color="var(--color-brand-600)" />,
      badge: 'Most Popular',
      popular: true,
    },
    {
      title: 'Inter-Provincial Full Truckload',
      description: 'A capacity-focused scenario for matching sample trucks and compatible drivers.',
      price: 'Sample scenario',
      timeline: 'No service commitment',
      icon: <LuTruck size={24} color="var(--color-brand-600)" />,
      badge: 'Heavy Cargo',
      popular: false,
    },
  ];

  const enterpriseServices = [
    {
      title: 'Customer Workflow',
      description: 'Create and review orders, track assigned trips, confirm delivery, and review invoices.',
      icon: <LuBuilding2 size={24} color="var(--color-brand-600)" />,
      features: ['Order records', 'Shipment status', 'PayPal sandbox checkout'],
    },
    {
      title: 'Operations Workflow',
      description: 'Manage users, drivers, vehicles, orders, trips, assignments, and billing records.',
      icon: <LuChartLine size={24} color="var(--color-brand-600)" />,
      features: ['Role-based views', 'Driver recommendations', 'Invoice PDF generation'],
    },
    {
      title: 'Driver Workflow',
      description: 'Use the Flutter client to review assignments, send location updates, and capture delivery evidence.',
      icon: <LuTruck size={24} color="var(--color-brand-600)" />,
      features: ['Assigned trips', 'WebSocket location updates', 'Recipient signature capture'],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      {/* Header */}
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">Demonstration Scenarios</Badge>}
          title="Freight Workflows Represented in the Project"
          description="These cards illustrate software scenarios, not services, prices, transit times, or commercial availability."
        />
      </div>

      {/* Service Tiers for Shippers */}
      <section className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
            Sample Order Types
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Representative records used to exercise the customer and operations interfaces.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {individualServices.map((svc) => (
            <Card
              key={svc.title}
              style={{
                display: 'flex',
                flexDirection: 'column',
                border: svc.popular ? '2px solid var(--color-brand-600)' : '1px solid var(--border-default)',
                position: 'relative',
              }}
            >
              {svc.popular && (
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
                  {svc.icon}
                </div>

                <div>
                  <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
                    {svc.title}
                  </h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {svc.description}
                  </p>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-brand-700)', fontVariantNumeric: 'tabular-nums' }}>
                    {svc.price}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <LuClock size={13} /> {svc.timeline}
                  </div>
                </div>

                <Link to="/business" style={{ marginTop: '8px' }}>
                  <Button variant={svc.popular ? 'primary' : 'outline'} style={{ width: '100%' }}>
                    View Workflow
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Enterprise Solutions Grid */}
      <section className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          <Badge variant="neutral" size="sm" style={{ width: 'fit-content' }}>
            Role-Based
          </Badge>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
            Implemented Application Flows
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            The core workflows supported by the React, Flutter, and Spring Boot applications.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {enterpriseServices.map((ent) => (
            <Card key={ent.title} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-slate-100)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {ent.icon}
              </div>

              <div>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', margin: '0 0 6px 0' }}>
                  {ent.title}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {ent.description}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto', paddingTop: '12px' }}>
                {ent.features.map((f, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                    <LuCircleCheck size={14} color="var(--color-success-600)" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <Link to="/business" style={{ marginTop: '12px' }}>
                <Button variant="outline" size="sm" rightIcon={<LuArrowRight size={14} />}>
                  Learn More
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="container">
        <div
          style={{
            padding: '40px',
            backgroundColor: 'var(--color-slate-900)',
            color: 'var(--color-white)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-white)', margin: '0 0 6px 0' }}>
              Want to Explore the Demonstration?
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-300)', margin: 0 }}>
              Review the implemented workflows or open the tracking interface with sample data.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/business">
              <Button variant="primary">View Project Workflows</Button>
            </Link>
            <Link to="/track">
              <Button
                variant="outline"
                style={{
                  backgroundColor: 'transparent',
                  borderColor: 'var(--color-slate-700)',
                  color: 'var(--color-white)',
                }}
              >
                Open Tracking Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
