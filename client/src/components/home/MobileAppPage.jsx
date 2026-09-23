import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Badge, PageHeader } from '@/components/ui';
import {
  LuSmartphone,
  LuDownload,
  LuShieldCheck,
  LuNavigation,
  LuBell,
  LuCreditCard,
  LuMessageSquare,
  LuTruck,
  LuCircleCheck,
  LuStar,
} from 'react-icons/lu';

export const MobileAppPage = () => {
  const appFeatures = [
    {
      title: 'Driver Location Updates',
      description: 'Send trip-scoped coordinates to the backend while a delivery is in progress.',
      icon: <LuNavigation size={22} color="var(--color-brand-600)" />,
    },
    {
      title: 'Trip Status Updates',
      description: 'Review assigned trips and update supported delivery states from the mobile workflow.',
      icon: <LuBell size={22} color="var(--color-brand-600)" />,
    },
    {
      title: 'Assignment Details',
      description: 'View route, customer, vehicle, and delivery information for an assigned trip.',
      icon: <LuMessageSquare size={22} color="var(--color-brand-600)" />,
    },
    {
      title: 'Proof of Delivery',
      description: 'Capture a recipient signature and delivery details from the driver client.',
      icon: <LuShieldCheck size={22} color="var(--color-brand-600)" />,
    },
    {
      title: 'Role-Based Sign-In',
      description: 'Use authenticated customer and driver flows backed by the Spring Boot API.',
      icon: <LuCreditCard size={22} color="var(--color-brand-600)" />,
    },
    {
      title: 'Driver Profile',
      description: 'Review stored profile, license, and vehicle information used by the demo workflow.',
      icon: <LuTruck size={22} color="var(--color-brand-600)" />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">Flutter Client</Badge>}
          title="LogiFlow Mobile Workflows"
          description="A Flutter client for the project's customer and driver flows."
        />
      </div>

      {/* Hero Showcase Card */}
      <section className="container">
        <Card style={{ padding: '48px 36px', backgroundColor: 'var(--color-slate-900)', color: 'var(--color-white)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Badge variant="brand" size="md" style={{ width: 'fit-content' }}>
                Academic Demo Build
              </Badge>
              <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-white)', margin: 0 }}>
                Assigned Trips, Location Updates, and Delivery Capture
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-300)', lineHeight: 1.6, margin: 0 }}>
                The mobile client connects to the LogiFlow API to demonstrate authenticated trip and delivery workflows.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffd700', fontSize: 'var(--text-xs)' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <LuStar key={i} size={14} fill="#ffd700" color="#ffd700" />
                  ))}
                </div>
                <span style={{ color: 'var(--color-slate-300)', fontWeight: 600 }}>
                  Portfolio build; no production user or rating claim
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                <Button variant="primary" size="lg" leftIcon={<LuDownload size={16} />}>
                  Android Build
                </Button>
                <Link to="/track">
                  <Button
                    variant="outline"
                    size="lg"
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: 'var(--color-slate-700)',
                      color: 'var(--color-white)',
                    }}
                  >
                    Open Web Tracker
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mockup Preview Box */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-xl)',
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Implemented Mobile Flows
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--text-xs)', color: 'var(--color-slate-300)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LuCircleCheck size={15} color="var(--color-success-600)" />
                  <span>Assigned trip and route details</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LuCircleCheck size={15} color="var(--color-success-600)" />
                  <span>Trip-scoped GPS location updates</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LuCircleCheck size={15} color="var(--color-success-600)" />
                  <span>Delivery status and signature capture</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LuCircleCheck size={15} color="var(--color-success-600)" />
                  <span>Authenticated customer and driver views</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Feature Capabilities Grid */}
      <section className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
            Core Mobile Capabilities
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Implemented for the project's driver and customer demonstration flows.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {appFeatures.map((f) => (
            <Card key={f.title} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--color-brand-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {f.icon}
              </div>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', margin: '4px 0 0 0' }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {f.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Driver Application CTA */}
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
            gap: '16px',
          }}
        >
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: '0 0 4px 0' }}>
              Want to Access the Driver App?
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Create a sample driver profile and continue through the demo onboarding flow.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/register/driver">
              <Button variant="primary">Open Driver Registration</Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline">Project Information</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MobileAppPage;
