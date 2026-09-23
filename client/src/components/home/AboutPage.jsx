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
          badge={<Badge variant="brand">About the Project</Badge>}
          title="An Academic Freight Workflow Project"
          description="LogiFlow explores dispatch, driver tracking, proof of delivery, and billing across web and mobile clients."
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
              Project Goal
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Build and test a full-stack logistics workflow from order creation and driver assignment through delivery confirmation and invoicing.
            </p>
          </Card>

          <Card style={{ padding: '32px', backgroundColor: 'var(--color-white)', border: '1px solid var(--border-default)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '18px' }}>
              <LuEye size={24} />
            </div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              Technical Scope
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Combine React and Flutter clients with a Spring Boot API, PostgreSQL persistence, WebSocket location updates, and containerized local deployment.
            </p>
          </Card>
        </div>
      </section>

      {/* What We Deliver */}
      <section className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '28px' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
            What It Demonstrates
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Representative freight workflows implemented for an academic team project.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <Card style={{ padding: '24px' }}>
            <LuTruck size={24} color="var(--color-brand-600)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)', margin: '0 0 6px 0' }}>
              Order and Trip Management
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Create orders, plan trips, assign drivers, and update delivery status through role-based interfaces.
            </p>
          </Card>

          <Card style={{ padding: '24px' }}>
            <LuBuilding2 size={24} color="var(--color-brand-600)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)', margin: '0 0 6px 0' }}>
              Operations Workspace
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Manage logistics records, monitor trips, import supported data, and generate invoice PDFs.
            </p>
          </Card>

          <Card style={{ padding: '24px' }}>
            <LuUsers size={24} color="var(--color-brand-600)" style={{ marginBottom: '12px' }} />
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-semibold)', margin: '0 0 6px 0' }}>
              Driver Records
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Capture driver and vehicle details, with OCR-assisted license-field extraction and administrator review.
            </p>
          </Card>
        </div>
      </section>

      {/* Why Shippers Trust LogiFlow */}
      <section className="container">
        <Card style={{ padding: '36px', backgroundColor: 'var(--color-slate-900)', color: 'var(--color-white)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            <Badge variant="brand" size="sm" style={{ width: 'fit-content' }}>
              Implemented Workflows
            </Badge>
            <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-white)', margin: 0 }}>
              What the Project Includes
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
            <div>
              <LuShieldCheck size={24} color="var(--color-brand-500)" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>Driver Data Review</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: 0, lineHeight: 1.5 }}>
                OCR-prefilled license fields remain subject to manual administrator review.
              </p>
            </div>
            <div>
              <LuSmartphone size={24} color="var(--color-brand-500)" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>Mobile Native Apps</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: 0, lineHeight: 1.5 }}>
                Flutter client screens support assigned trips, location updates, and proof-of-delivery capture.
              </p>
            </div>
            <div>
              <LuMapPin size={24} color="var(--color-brand-500)" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>WebSocket Location Updates</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: 0, lineHeight: 1.5 }}>
                Trip-scoped driver coordinates are sent to authorized clients and displayed on maps.
              </p>
            </div>
            <div>
              <LuAward size={24} color="var(--color-brand-500)" style={{ marginBottom: '8px' }} />
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: '4px' }}>Role-Based Access</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: 0, lineHeight: 1.5 }}>
                API endpoints and application views are separated by customer, driver, and administrator roles.
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
              Review the demonstration workflows or create a sample account.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/register/driver">
              <Button variant="primary">Apply as Driver</Button>
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

export default AboutPage;
