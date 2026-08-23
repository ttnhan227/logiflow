import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Badge, PageHeader } from '@/components/ui';
import {
  LuTruck,
  LuCalendar,
  LuSmartphone,
  LuShieldCheck,
  LuCircleCheck,
  LuArrowRight,
  LuFileText,
  LuClock,
  LuAward,
} from 'react-icons/lu';

export const DriversPage = () => {
  const driverBenefits = [
    {
      title: 'Reliable Daily Earning',
      description: 'Competitive per-trip freight tariffs with transparent fuel surcharges and expedited weekly digital bank transfers.',
      icon: <LuTruck size={24} color="var(--color-brand-600)" />,
    },
    {
      title: 'Flexible Dispatch Shifts',
      description: 'Choose assigned linehauls or regional hub loops that match your preferred working schedule and route preferences.',
      icon: <LuCalendar size={24} color="var(--color-brand-600)" />,
    },
    {
      title: 'Digital Navigation App',
      description: 'Turn-by-turn routing with optimized multi-stop sequences, weighbridge alerts, and automated proof of delivery collection.',
      icon: <LuSmartphone size={24} color="var(--color-brand-600)" />,
    },
    {
      title: 'Comprehensive Carrier Insurance',
      description: 'Full personal accident protection, vehicle assistance support, and priority emergency dispatch response.',
      icon: <LuShieldCheck size={24} color="var(--color-brand-600)" />,
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Submit Online Profile',
      desc: 'Complete the digital application form with your personal details and driving license class.',
    },
    {
      num: '02',
      title: 'Document Verification',
      desc: 'Our compliance desk validates your commercial license, vehicle inspection, and background credentials.',
    },
    {
      num: '03',
      title: 'Orientation & Safety Test',
      desc: 'Brief mobile onboarding video covering cargo handling protocols and the driver application.',
    },
    {
      num: '04',
      title: 'Receive Trips & Earn',
      desc: 'Start receiving verified linehaul and delivery trip assignments with instant dispatch notifications.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">Driver Carrier Network</Badge>}
          title="Drive with LogiFlow"
          description="Join Vietnam's trusted network of verified commercial drivers. Earn consistent income with guaranteed freight manifests, automated payouts, and intelligent route navigation."
        />
      </div>

      {/* Driver Value Props */}
      <section className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
          {driverBenefits.map((b) => (
            <Card key={b.title} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                {b.icon}
              </div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
                {b.title}
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {b.description}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Vehicle Category Earning Matrix */}
      <section className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
            Fleet Vehicle Categories
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Opportunity tiers across standard commercial vehicle classifications.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <Card style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge variant="brand" size="sm">Light & Urban</Badge>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Class B2 License</span>
            </div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>
              Van & Light Truck Driver (0.5T – 2T)
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Ideal for inner-city distribution, same-day retail replenishment, and express inter-district transfers.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Daily Earnings:</span>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-brand-700)', marginTop: '2px' }}>
                400,000 – 750,000 VND / day
              </div>
            </div>
          </Card>

          <Card style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px', border: '2px solid var(--color-brand-600)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge variant="brand" size="sm">High Demand</Badge>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Class C License</span>
            </div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>
              Medium & Heavy Linehaul (5T – 15T)
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Connecting industrial parks with sea ports and central sorting facilities on scheduled corridor schedules.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Daily Earnings:</span>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-brand-700)', marginTop: '2px' }}>
                800,000 – 1,500,000 VND / day
              </div>
            </div>
          </Card>

          <Card style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge variant="neutral" size="sm">Container Drayage</Badge>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Class FC License</span>
            </div>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', margin: 0 }}>
              Container Tractor Operator (20ft / 40ft)
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Heavy drayage operations between major container ports (Cat Lai, Hai Phong, Cai Mep) and inland logistics depots.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Estimated Daily Earnings:</span>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-brand-700)', marginTop: '2px' }}>
                1,200,000 – 2,200,000 VND / day
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Onboarding Steps */}
      <section className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
            How Onboarding Works
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Four straightforward steps to become an authorized carrier on the platform.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {steps.map((s) => (
            <Card key={s.num} style={{ padding: '24px', position: 'relative' }}>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-brand-500)', opacity: 0.8, fontVariantNumeric: 'tabular-nums' }}>
                {s.num}
              </span>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, margin: '8px 0 4px 0' }}>
                {s.title}
              </h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                {s.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Callout */}
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
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-white)', margin: '0 0 4px 0' }}>
              Ready to Join Vietnam's Premier Freight Network?
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-300)', margin: 0 }}>
              Submit your driver application today. Our review desk processes submissions within 24 hours.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/register/driver">
              <Button variant="primary" size="lg">
                Apply as Driver Partner
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DriversPage;
