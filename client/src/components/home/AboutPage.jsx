import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Badge, PageHeader } from '@/components/ui';
import {
  LuTarget,
  LuEye,
  LuTruck,
  LuBuilding2,
  LuUsers,
  LuShieldCheck,
  LuSmartphone,
  LuMapPin,
  LuAward,
  LuArrowRight,
} from 'react-icons/lu';

export const AboutPage = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      {/* Header */}
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">Our Story</Badge>}
          title="Building Vietnam's Modern Freight Infrastructure"
          description="LogiFlow was founded to eliminate supply chain friction, bring complete GPS transparency to commercial shipping, and empower transport operators nationwide."
        />
      </div>

      {/* Mission & Vision Cards */}
      <section className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <Card style={{ padding: '32px', backgroundColor: 'var(--color-white)', border: '1px solid var(--border-default)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <LuTarget size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              Our Mission
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              To revolutionize logistics across Southeast Asia by replacing legacy paper workflows with automated dispatching, verified freight safety standards, and real-time cargo visibility.
            </p>
          </Card>

          <Card style={{ padding: '32px', backgroundColor: 'var(--color-white)', border: '1px solid var(--border-default)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <LuEye size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              Our Vision
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              To become the standard digital operating backbone for road, port, and cross-dock freight transport in Vietnam, creating economic mobility for thousands of professional commercial drivers.
            </p>
          </Card>
        </div>
      </section>

      {/* What We Deliver */}
      <section className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '28px' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
            What We Do
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Connecting enterprise shippers, distribution centers, and commercial carriers under one unified platform.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <Card style={{ padding: '24px' }}>
            <LuTruck size={24} color="var(--color-brand-600)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)', margin: '0 0 6px 0' }}>
              Freight & Linehaul Dispatch
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Full truckload (FTL) and consolidated shipments connecting industrial manufacturing parks with commercial sea ports.
            </p>
          </Card>

          <Card style={{ padding: '24px' }}>
            <LuBuilding2 size={24} color="var(--color-brand-600)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)', margin: '0 0 6px 0' }}>
              Enterprise Logistics Suite
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Multi-account management, bulk Excel manifest import, automated route sequencing, and consolidated month-end invoicing.
            </p>
          </Card>

          <Card style={{ padding: '24px' }}>
            <LuUsers size={24} color="var(--color-brand-600)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)', margin: '0 0 6px 0' }}>
              Verified Driver Ecosystem
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Rigorous identity verification, vehicle inspection history, compliance records, and direct digital payout processing.
            </p>
          </Card>
        </div>
      </section>

      {/* Why Shippers Trust LogiFlow */}
      <section className="container">
        <Card style={{ padding: '36px', backgroundColor: 'var(--color-slate-900)', color: 'var(--color-white)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            <Badge variant="brand" size="sm" style={{ width: 'fit-content' }}>
              Trust & Standards
            </Badge>
            <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-white)', margin: 0 }}>
              Why Shippers Choose LogiFlow
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            <div>
              <LuShieldCheck size={24} color="var(--color-brand-500)" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>100% Vetted Fleet</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: 0, lineHeight: 1.5 }}>
                Every driver is background-checked and licensed for commercial heavy vehicle operations.
              </p>
            </div>
            <div>
              <LuSmartphone size={24} color="var(--color-brand-500)" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>Mobile Native Apps</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: 0, lineHeight: 1.5 }}>
                Real-time driver application for turn-by-turn routing and instant digital proof of delivery.
              </p>
            </div>
            <div>
              <LuMapPin size={24} color="var(--color-brand-500)" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>Live GPS Polylines</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: 0, lineHeight: 1.5 }}>
                Sub-minute map updates with calculated arrival windows and route deviation alerts.
              </p>
            </div>
            <div>
              <LuAward size={24} color="var(--color-brand-500)" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>99.8% On-Time SLA</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: 0, lineHeight: 1.5 }}>
                Contractual fulfillment guarantees backstopped by dedicated operational support.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* CTA */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '32px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', backgroundColor: 'var(--bg-surface)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: '0 0 4px 0' }}>
              Partner with LogiFlow Today
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Whether you need enterprise freight solutions or wish to register as an authorized driver partner.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/register/driver">
              <Button variant="primary">Apply as Driver</Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline">Contact Sales</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
