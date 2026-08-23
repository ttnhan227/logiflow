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
      title: 'Dedicated Key Account Dispatch Desk',
      description: 'Single point of contact operational specialist assigned to manage daily loading schedules, spot rates, and high-priority lane surges.',
      icon: <LuBuilding2 size={24} color="var(--color-brand-600)" />,
    },
    {
      title: 'Enterprise REST API Integration',
      description: 'Connect directly to your WMS, SAP ERP, or custom OMS. Automated order creation, barcode label generation, and webhook status pushes.',
      icon: <LuWebhook size={24} color="var(--color-brand-600)" />,
    },
    {
      title: 'Advanced Freight & Cost Telemetry',
      description: 'Consolidated reporting across carrier on-time rates, freight cost per metric ton-km, route bottleneck heatmaps, and carbon impact.',
      icon: <LuChartColumn size={24} color="var(--color-brand-600)" />,
    },
    {
      title: 'Dedicated Contracted Fleets',
      description: 'Lock in seasonal container chassis and multi-ton linehaul trucks reserved strictly for your manufacturing distribution loops.',
      icon: <LuTruck size={24} color="var(--color-brand-600)" />,
    },
    {
      title: 'Guaranteed SLA & Priority Transit',
      description: 'Strict 99.8% on-time contractual delivery window commitments backstopped by automatic penalty rebate credits.',
      icon: <LuZap size={24} color="var(--color-brand-600)" />,
    },
    {
      title: 'Comprehensive Marine Cargo Policy',
      description: 'Full replacement value coverage up to 10 Billion VND per transit with fast-track 48-hour claim resolution.',
      icon: <LuShieldCheck size={24} color="var(--color-brand-600)" />,
    },
  ];

  const tiers = [
    {
      name: 'Growth Shipper',
      volume: '100 – 1,000 shipments / mo',
      description: 'Designed for scaling e-commerce brands and regional manufacturers.',
      features: [
        'Web portal & CSV/Excel bulk import',
        'Standard GPS tracking & digital e-POD',
        'Next-day settlement cycle',
        'Standard email & phone support',
      ],
      popular: false,
    },
    {
      name: 'Corporate Fleet',
      volume: '1,000 – 10,000 shipments / mo',
      description: 'Full-service freight coordination for high-volume enterprise operations.',
      features: [
        'Full REST API & webhook integration',
        'Dedicated dispatch operations manager',
        'Volume-tiered freight discount brackets',
        'Customized driver uniforms & branding options',
        'Extended 30-day corporate credit terms',
      ],
      popular: true,
    },
    {
      name: 'Strategic Enterprise',
      volume: '10,000+ shipments / mo',
      description: 'Custom multi-modal linehaul solutions and dedicated warehousing loops.',
      features: [
        'Tailored SLA contract with financial penalty terms',
        'Dedicated on-site logistics coordination personnel',
        'Custom ERP / SAP data pipeline connectors',
        '24/7 dedicated control tower hotline',
        'White-glove claims & cargo insurance priority',
      ],
      popular: false,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">Enterprise Logistics</Badge>}
          title="Frictionless Supply Chain Solutions for Large Shippers"
          description="Scale your multi-province transport operations with automated dispatching, customized contracted capacity, and enterprise-grade REST APIs."
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

      {/* Enterprise SLA Metrics */}
      <section className="container">
        <Card style={{ padding: '36px', backgroundColor: 'var(--color-slate-900)', color: 'var(--color-white)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            <Badge variant="brand" size="sm" style={{ width: 'fit-content' }}>
              Contract Commitments
            </Badge>
            <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-white)', margin: 0 }}>
              Enterprise SLA Guarantee
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-brand-500)', fontVariantNumeric: 'tabular-nums' }}>
                99.8%
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '4px' }}>On-Time Delivery SLA</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: '4px 0 0 0' }}>
                Strict multi-province fulfillment windows.
              </p>
            </div>

            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-brand-500)', fontVariantNumeric: 'tabular-nums' }}>
                &lt; 15 min
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '4px' }}>Command Desk Response</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: '4px 0 0 0' }}>
                Direct priority line for key accounts.
              </p>
            </div>

            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-brand-500)', fontVariantNumeric: 'tabular-nums' }}>
                100%
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '4px' }}>Cargo Insurance</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: '4px 0 0 0' }}>
                Marine policy up to 10 Billion VND.
              </p>
            </div>

            <div>
              <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, color: 'var(--color-brand-500)', fontVariantNumeric: 'tabular-nums' }}>
                Net 30
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '4px' }}>Corporate Terms</div>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-slate-400)', margin: '4px 0 0 0' }}>
                Transparent monthly VAT consolidated invoicing.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Volume Tiers */}
      <section className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
            Enterprise Volume Plans
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Choose a contracted tier matching your monthly supply chain freight velocity.
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
                  Enterprise Choice
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
                      Request Custom Rate Quote
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
              Speak Directly with our B2B Logistics Desk
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Available Monday through Saturday (8:00 AM – 6:00 PM ICT).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <a href="tel:+8419001234">
              <Button variant="primary" leftIcon={<LuPhone size={16} />}>
                +84 1900-1234
              </Button>
            </a>
            <a href="mailto:business@logiflow.vn">
              <Button variant="outline" leftIcon={<LuMail size={16} />}>
                business@logiflow.vn
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BusinessPage;
