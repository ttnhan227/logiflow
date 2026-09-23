import React from 'react';
import { Link } from 'react-router-dom';
import { LuMail, LuPhone, LuMapPin, LuShield, LuArrowRight } from 'react-icons/lu';

export const FooterLayout = () => {
  return (
    <footer
      style={{
        backgroundColor: 'var(--color-slate-900)',
        color: 'var(--color-slate-300)',
        borderTop: '1px solid var(--color-slate-800)',
        marginTop: 'auto',
        fontSize: 'var(--text-sm)',
      }}
    >
      {/* Top Banner / Callout */}
      <div
        style={{
          borderBottom: '1px solid var(--color-slate-800)',
          padding: '32px 0',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div>
            <h3 style={{ color: 'var(--color-white)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', margin: '0 0 4px 0' }}>
              Explore the LogiFlow academic project
            </h3>
            <p style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-sm)', margin: 0 }}>
              Review the customer, operations, and driver demonstration workflows.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/register/customer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: 'var(--color-brand-600)',
                color: 'var(--color-white)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
              }}
            >
              Try Customer Workflow <LuArrowRight size={16} />
            </Link>
            <Link
              to="/track"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '10px 18px',
                backgroundColor: 'var(--color-slate-800)',
                color: 'var(--color-white)',
                borderRadius: 'var(--radius-md)',
                fontWeight: 600,
                fontSize: 'var(--text-sm)',
                border: '1px solid var(--color-slate-700)',
              }}
            >
              Track Shipment
            </Link>
          </div>
        </div>
      </div>

      {/* Main Links Grid */}
      <div style={{ padding: '48px 0 36px 0' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '36px',
            }}
          >
            {/* Brand Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--color-white)',
                    letterSpacing: '-0.6px',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  Logi<span style={{ color: 'var(--color-brand-400)' }}>Flow</span>
                </span>
              </Link>
              <p style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-xs)', lineHeight: 1.6, margin: 0 }}>
                A portfolio project for freight orders, trip assignment, driver tracking, proof of delivery, and billing.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-emerald-400)' }}>
                <LuShield size={16} color="var(--color-success-600)" />
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-slate-300)' }}>
                  Academic demonstration; not a carrier
                </span>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 style={{ color: 'var(--color-white)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px', fontWeight: 700 }}>
                Demonstrations
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><Link to="/services" style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-sm)' }}>Sample Freight Workflows</Link></li>
                <li><Link to="/coverage" style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-sm)' }}>Sample Coverage Map</Link></li>
                <li><Link to="/track" style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-sm)' }}>Shipment Tracking Demo</Link></li>
              </ul>
            </div>

            {/* Platform & Solutions */}
            <div>
              <h4 style={{ color: 'var(--color-white)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px', fontWeight: 700 }}>
                Solutions
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><Link to="/business" style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-sm)' }}>Role-Based Workflows</Link></li>
                <li><Link to="/fleet" style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-sm)' }}>Sample Vehicle Data</Link></li>
                <li><Link to="/mobile-app" style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-sm)' }}>Flutter Mobile Client</Link></li>
                <li><Link to="/drivers" style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-sm)' }}>Driver Workflow</Link></li>
              </ul>
            </div>

            {/* Company & Support */}
            <div>
              <h4 style={{ color: 'var(--color-white)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px', fontWeight: 700 }}>
                Project
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><Link to="/about" style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-sm)' }}>About LogiFlow</Link></li>
                <li><Link to="/contact" style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-sm)' }}>Form Demonstration</Link></li>
                <li><Link to="/faq" style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-sm)' }}>Frequently Asked Questions</Link></li>
                <li><Link to="/login" style={{ color: 'var(--color-slate-400)', fontSize: 'var(--text-sm)' }}>Demo Sign-in</Link></li>
              </ul>
            </div>

            {/* Operational Contact */}
            <div>
              <h4 style={{ color: 'var(--color-white)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px', fontWeight: 700 }}>
                Scope
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--color-slate-400)', fontSize: 'var(--text-xs)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LuMail size={15} color="var(--color-brand-500)" />
                  <span>No live support mailbox</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LuPhone size={15} color="var(--color-brand-500)" />
                  <span>No dispatch hotline</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <LuMapPin size={15} color="var(--color-brand-500)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>Locations and contacts shown in the interface are sample data.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          borderTop: '1px solid var(--color-slate-800)',
          padding: '20px 0',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-slate-500)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            &copy; {new Date().getFullYear()} LogiFlow academic project.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link to="/about" style={{ color: 'var(--color-slate-500)' }}>Project Scope</Link>
            <Link to="/faq" style={{ color: 'var(--color-slate-500)' }}>Limitations</Link>
            <Link to="/about" style={{ color: 'var(--color-slate-500)' }}>Implementation</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterLayout;
