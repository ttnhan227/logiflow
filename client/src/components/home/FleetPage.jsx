import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, CardContent, Badge, PageHeader } from '@/components/ui';
import {
  LuTruck,
  LuContainer,
  LuThermometerSnowflake,
  LuShieldCheck,
  LuWrench,
  LuLeaf,
  LuMapPin,
  LuArrowRight,
  LuCpu,
} from 'react-icons/lu';

export const FleetPage = () => {
  const vehicleClasses = [
    {
      type: 'Heavy Container Tractors',
      spec: '20ft & 40ft ISO Intermodal Containers',
      payload: 'Up to 32,000 kg',
      volume: '67.7 m³ (40ft High Cube)',
      bestFor: 'Seaport import/export linehaul, industrial dry bulk, factory transfers',
      badge: 'Heavy Linehaul',
      icon: <LuContainer size={28} color="var(--color-brand-600)" />,
    },
    {
      title: 'Medium Box Trucks (5T – 15T)',
      spec: 'Enclosed hydraulic tailgate rigid trucks',
      payload: '5,000 kg – 15,000 kg',
      volume: '30 – 55 m³',
      bestFor: 'Inter-provincial manufacturing transit, retail distribution, electronics',
      badge: 'Inter-Province',
      icon: <LuTruck size={28} color="var(--color-brand-600)" />,
    },
    {
      title: 'Refrigerated Cold-Chain Transports',
      spec: 'Thermo King multi-temp units (-20°C to +15°C)',
      payload: '3,500 kg – 12,000 kg',
      volume: '18 – 42 m³',
      bestFor: 'Pharmaceuticals, frozen seafood, fresh agriculture, dairy goods',
      badge: 'Cold Chain',
      icon: <LuThermometerSnowflake size={28} color="var(--color-info-600)" />,
    },
    {
      title: 'Urban Express Delivery Vans',
      spec: 'Light commercial city vans with Euro 5 compliance',
      payload: '500 kg – 2,000 kg',
      volume: '6 – 12 m³',
      bestFor: 'Inner-city parcels, same-day retail replenishment, document couriers',
      badge: 'Urban Distribution',
      icon: <LuTruck size={28} color="var(--color-brand-600)" />,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">Fleet & Telemetry</Badge>}
          title="Pan-Vietnam Transport Fleet Infrastructure"
          description="Modern, GPS-equipped commercial fleet certified for linehaul freight, container drayage, and temperature-controlled cold chains across 63 provinces."
        />
      </div>

      {/* Fleet Classification Cards */}
      <section className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {vehicleClasses.map((v) => (
            <Card key={v.type || v.title} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardContent style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--color-slate-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {v.icon}
                  </div>
                  <Badge variant="neutral" size="sm">
                    {v.badge}
                  </Badge>
                </div>

                <div>
                  <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
                    {v.type || v.title}
                  </h3>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {v.spec}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--bg-surface-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    fontSize: 'var(--text-xs)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Max Payload:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{v.payload}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Cargo Volume:</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{v.volume}</strong>
                  </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    Application:
                  </span>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {v.bestFor}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Fleet Standards & Tech */}
      <section className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: 0 }}>
            Fleet Safety & Engineering Standards
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Continuous monitoring and rigorous preventive maintenance ensure 99.8% on-road reliability.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          <Card style={{ padding: '20px' }}>
            <LuCpu size={22} color="var(--color-brand-600)" style={{ marginBottom: '10px' }} />
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', margin: '0 0 4px 0' }}>
              Connected IoT Sensors
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Live door sensors, real-time cabin temperature gauges, and instant geo-fence alerts.
            </p>
          </Card>

          <Card style={{ padding: '20px' }}>
            <LuWrench size={22} color="var(--color-brand-600)" style={{ marginBottom: '10px' }} />
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', margin: '0 0 4px 0' }}>
              Digital Maintenance Logs
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Mandatory pre-trip vehicle safety audits and scheduled dealer-certified servicing every 10,000 km.
            </p>
          </Card>

          <Card style={{ padding: '20px' }}>
            <LuShieldCheck size={22} color="var(--color-brand-600)" style={{ marginBottom: '10px' }} />
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', margin: '0 0 4px 0' }}>
              Full Cargo Insurance
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              All transported goods are fully covered under primary marine cargo risk policies.
            </p>
          </Card>

          <Card style={{ padding: '20px' }}>
            <LuLeaf size={22} color="var(--color-brand-600)" style={{ marginBottom: '10px' }} />
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', margin: '0 0 4px 0' }}>
              Eco Routing & Emissions
            </h4>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              AI route clustering reduces empty linehaul miles and lowers total carbon footprint by 18%.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA */}
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
              Have Specific Vehicle Capacity Requirements?
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Speak with our fleet dispatch manager to reserve dedicated container trailers or refrigerated units.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/business">
              <Button variant="primary">Book Fleet Capacity</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FleetPage;
