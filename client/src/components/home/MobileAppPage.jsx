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
      title: 'Live Sub-Minute GPS Tracking',
      description: 'Follow shipments turn-by-turn on high-precision vector maps with estimated arrival calculation.',
      icon: <LuNavigation size={22} color="var(--color-brand-600)" />,
    },
    {
      title: 'Instant Push Alerts',
      description: 'Receive real-time push notifications when orders are dispatched, in-transit, arrived, or delivered.',
      icon: <LuBell size={22} color="var(--color-brand-600)" />,
    },
    {
      title: 'In-App Dispatch Chat',
      description: 'Direct end-to-end encrypted messaging channel connecting consignee, driver, and operations desk.',
      icon: <LuMessageSquare size={22} color="var(--color-brand-600)" />,
    },
    {
      title: 'Digital e-POD Proof of Handover',
      description: 'Capture recipient digital signatures and timestamped photo proof of delivery on mobile.',
      icon: <LuShieldCheck size={22} color="var(--color-brand-600)" />,
    },
    {
      title: 'Secure Payouts & Invoicing',
      description: 'Instant driver payout withdrawals to linked Vietnamese bank accounts and mobile invoice access.',
      icon: <LuCreditCard size={22} color="var(--color-brand-600)" />,
    },
    {
      title: 'Fleet & Driver Verification',
      description: 'Review licensed driver credentials, vehicle inspection compliance ratings, and safety scores.',
      icon: <LuTruck size={22} color="var(--color-brand-600)" />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">Native Mobile Apps</Badge>}
          title="LogiFlow on iOS & Android"
          description="Empower your field drivers, dispatch coordinators, and receiving clients with native mobile applications."
        />
      </div>

      {/* Hero Showcase Card */}
      <section className="container">
        <Card style={{ padding: '48px 36px', backgroundColor: 'var(--color-slate-900)', color: 'var(--color-white)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Badge variant="brand" size="md" style={{ width: 'fit-content' }}>
                Field Operational Suite
              </Badge>
              <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-white)', margin: 0 }}>
                Real-Time Freight Telemetry in the Palm of Your Hand
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-300)', lineHeight: 1.6, margin: 0 }}>
                Designed specifically for Vietnamese logistics corridors. Works seamlessly offline in low-connectivity rural zones, synchronizing manifests once connected.
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffd700', fontSize: 'var(--text-xs)' }}>
                <div style={{ display: 'flex', gap: '2px' }}>
                  {[...Array(5)].map((_, i) => (
                    <LuStar key={i} size={14} fill="#ffd700" color="#ffd700" />
                  ))}
                </div>
                <span style={{ color: 'var(--color-slate-300)', fontWeight: 600 }}>
                  4.8 Rating Across 10,000+ Active Drivers
                </span>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                <Button variant="primary" size="lg" leftIcon={<LuDownload size={16} />}>
                  Download Android APK
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
                Driver & Consignee Features
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: 'var(--text-xs)', color: 'var(--color-slate-300)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LuCircleCheck size={15} color="var(--color-success-600)" />
                  <span>Integrated turn-by-turn map with weighbridge notifications</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LuCircleCheck size={15} color="var(--color-success-600)" />
                  <span>Direct Bluetooth printer support for physical receipt receipts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LuCircleCheck size={15} color="var(--color-success-600)" />
                  <span>Instant camera scan for multi-barcode parcel consolidation</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LuCircleCheck size={15} color="var(--color-success-600)" />
                  <span>Emergency 1-tap SOS dispatcher alert hotline</span>
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
            Built for rugged on-the-road execution and transparent delivery handoffs.
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
              Complete our driver onboarding verification to receive your mobile login credentials.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/register/driver">
              <Button variant="primary">Apply as Driver Partner</Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline">Technical Support</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MobileAppPage;
