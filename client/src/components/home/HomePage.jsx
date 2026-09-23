import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Card, CardContent, Input, Select, Badge } from '@/components/ui';
import {
  LuSearch,
  LuArrowRight,
  LuTruck,
  LuPackage,
  LuWarehouse,
  LuChartLine,
  LuShieldCheck,
  LuFileCheck,
  LuCpu,
  LuClock,
  LuMapPin,
  LuCircleCheck,
  LuAward,
  LuActivity,
  LuNavigation,
  LuFuel,
  LuGauge,
  LuLayers,
  LuPhone,
  LuBuilding2,
  LuFileText,
  LuBookOpen,
  LuCalendar,
  LuTrendingUp,
  LuGlobe,
  LuCheck,
  LuSparkles,
  LuShield,
  LuDollarSign,
  LuUserPlus,
  LuLogIn,
} from 'react-icons/lu';

// Custom Leaflet DivIcon helpers
const createTruckPin = (label, speed, status = 'moving') =>
  divIcon({
    className: 'custom-truck-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        gap: 6px;
        background-color: #0f172a;
        color: #ffffff;
        border: 2px solid ${status === 'moving' ? '#2563eb' : '#059669'};
        border-radius: 9999px;
        padding: 3px 10px;
        font-size: 11px;
        font-weight: 700;
        font-family: Inter, sans-serif;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.35);
        white-space: nowrap;
      ">
        <span style="
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: ${status === 'moving' ? '#38bdf8' : '#34d399'};
          display: inline-block;
        "></span>
        <span>${label}</span>
        <span style="color: #94a3b8; font-size: 10px; font-weight: 500;">${speed}</span>
      </div>
    `,
    iconSize: [110, 26],
    iconAnchor: [55, 13],
    popupAnchor: [0, -13],
  });

const createHubPin = (label, type = 'gateway') =>
  divIcon({
    className: 'custom-hub-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: ${type === 'gateway' ? '#2563eb' : '#475569'};
        color: white;
        border: 2px solid white;
        border-radius: 6px;
        padding: 3px 8px;
        font-size: 11px;
        font-weight: 700;
        font-family: Inter, sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        white-space: nowrap;
      ">
        ${label}
      </div>
    `,
    iconSize: [90, 24],
    iconAnchor: [45, 12],
    popupAnchor: [0, -12],
  });

const tradeLanes = {
  northSouthTrunk: [
    [21.0278, 105.8342], // Hanoi
    [18.6796, 105.6813], // Vinh
    [16.4637, 107.5909], // Hue
    [16.0544, 108.2022], // Da Nang
    [13.783, 109.2197],  // Quy Nhon
    [12.2388, 109.1967], // Nha Trang
    [10.8231, 106.6297], // HCMC
  ],
  haiPhongHanoi: [
    [20.8449, 106.6881], // Hai Phong Port
    [20.9372, 106.3145], // Hai Duong
    [21.0278, 105.8342], // Hanoi
  ],
  mekongDelta: [
    [10.8231, 106.6297], // HCMC
    [10.3606, 106.3639], // My Tho
    [10.0452, 105.7469], // Can Tho
    [9.1769, 105.1524],  // Ca Mau
  ],
};

const activeLiveFleet = [
  { id: 'TRK-29H-8841', name: 'Linehaul 8841', pos: [19.2, 105.7], speed: '68 km/h', origin: 'Hanoi Gateway', dest: 'HCMC Southern Hub', cargo: '24T Industrial Electronics', status: 'moving', eta: '14 hrs remaining' },
  { id: 'TRK-51D-9214', name: 'ColdChain 9214', pos: [14.1, 108.9], speed: '62 km/h', origin: 'Da Nang Central', dest: 'Nha Trang Terminal', cargo: '14T Frozen Seafood (-18°C)', status: 'moving', eta: '3.5 hrs remaining' },
  { id: 'TRK-65C-3410', name: 'Mekong 3410', pos: [10.2, 106.0], speed: '55 km/h', origin: 'Can Tho Hub', dest: 'Cat Lai Port', cargo: '18T Export Agriculture', status: 'moving', eta: '1.2 hrs remaining' },
  { id: 'TRK-15C-7702', name: 'PortExpress 7702', pos: [20.9, 106.4], speed: '50 km/h', origin: 'Hai Phong Seaport', dest: 'Hanoi Mega-Hub', status: 'moving', eta: '45 mins remaining' },
];

export const HomePage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedLane, setSelectedLane] = useState('northSouthTrunk');
  const [leadForm, setLeadForm] = useState({ company: '', email: '', mode: 'FTL', monthlyVolume: '10-50_TRIPS' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      navigate(`/track?tracking=${encodeURIComponent(trackingNumber.trim())}`);
    } else {
      navigate('/track');
    }
  };

  const handleLeadSubmit = (e) => {
    e.preventDefault();
    setLeadSubmitted(true);
  };

  // Technologies used by the project
  const clientPartners = [
    { name: 'SPRING BOOT', sector: 'REST API' },
    { name: 'POSTGRESQL', sector: 'Persistence' },
    { name: 'REACT', sector: 'Web Client' },
    { name: 'FLUTTER', sector: 'Mobile Client' },
    { name: 'WEBSOCKET', sector: 'Location Updates' },
    { name: 'DOCKER', sector: 'Local Deployment' },
  ];

  // News & Market Insights Articles
  const newsArticles = [
    {
      id: 'fmu-august-2026',
      tag: 'Freight Market Update',
      image: '/article-market.jpg',
      title: 'Vietnam Domestic Freight Rates: Q3 Linehaul Capacity & Fuel Trends',
      readTime: '5 min read',
      date: 'August 2026',
      summary: 'Detailed benchmark of North-South trunk rates, Hai Phong port drayage turnaround times, and seasonal agricultural demand out of the Mekong Delta.',
      link: '/insights',
    },
    {
      id: 'cold-chain-best-practices',
      tag: 'Cold Chain Best Practices',
      image: '/article-coldchain.jpg',
      title: 'Eliminating Temperature Excursions in Tropical Cargo Linehaul',
      readTime: '7 min read',
      date: 'August 2026',
      summary: 'How IoT reefer telematics, automated door-opening sensors, and predictive ETA routing maintain 100% cold-chain integrity for seafood and pharmaceuticals.',
      link: '/insights',
    },
    {
      id: 'ai-dispatch-efficiency',
      tag: 'Technology & AI',
      image: '/article-dispatch.jpg',
      title: 'How Automated Dispatch Algorithms Cut Empty Linehaul Miles by 28%',
      readTime: '6 min read',
      date: 'July 2026',
      summary: 'A deep dive into LogiFlow’s dynamic batching algorithm and how it matches backhaul capacity across Vietnam to eliminate empty miles.',
      link: '/insights',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '80px' }}>
      {/* 1. HERO SECTION (Brightened Photo Overlay + Live Telemetry Map) */}
      <section
        style={{
          position: 'relative',
          backgroundColor: '#0a0f1d',
          color: 'var(--color-white)',
          padding: '88px 0 104px 0',
          overflow: 'hidden',
          borderBottom: '1px solid #1e293b',
        }}
      >
        {/* Background Image Layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(/hero-bg.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 40%',
            backgroundRepeat: 'no-repeat',
            opacity: 0.82,
          }}
        />

        {/* Soft Contrast Gradient Overlays */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(15, 23, 42, 0.82) 0%, rgba(15, 23, 42, 0.6) 48%, rgba(15, 23, 42, 0.2) 100%), linear-gradient(180deg, rgba(15, 23, 42, 0.3) 0%, rgba(15, 23, 42, 0.1) 60%, rgba(15, 23, 42, 0.85) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '52px', alignItems: 'center' }}>
            {/* Left Hero Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant="brand" size="md">
                  Academic Full-Stack Project
                </Badge>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(34px, 4.8vw, 50px)',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--color-white)',
                  lineHeight: 1.12,
                  letterSpacing: 'var(--tracking-tight)',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)',
                  margin: 0,
                }}
              >
                Freight Dispatch, Driver Tracking, and Proof of Delivery
              </h1>

              <p
                style={{
                  fontSize: 'var(--text-md)',
                  color: '#e2e8f0',
                  lineHeight: 1.6,
                  textShadow: '0 1px 6px rgba(0, 0, 0, 0.6)',
                  margin: 0,
                  maxWidth: '620px',
                }}
              >
                Explore order creation, rule-based driver assignment, WebSocket location updates, delivery signatures, and sandbox billing in one demonstration application.
              </p>

              {/* Quick Freight Track Console */}
              <div
                style={{
                  padding: '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Enter Tracking Code (e.g. TRK-882194)..."
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    style={{
                      flex: 1,
                      height: '46px',
                      padding: '0 16px',
                      backgroundColor: 'var(--color-white)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                  <Button type="submit" variant="primary" size="lg" leftIcon={<LuSearch size={16} />}>
                    Track Shipment
                  </Button>
                </form>
              </div>

              {/* Hero Action CTAs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <Link to="/register/customer">
                  <Button variant="primary" size="lg" leftIcon={<LuUserPlus size={16} />} rightIcon={<LuArrowRight size={16} />}>
                    Try Customer Registration
                  </Button>
                </Link>
                <Link to="/register/driver">
                  <Button
                    variant="outline"
                    size="lg"
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: 'var(--color-slate-700)',
                      color: 'var(--color-white)',
                    }}
                    leftIcon={<LuTruck size={16} />}
                  >
                    Try Driver Registration
                  </Button>
                </Link>
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      borderColor: 'rgba(255,255,255,0.2)',
                      color: 'var(--color-white)',
                    }}
                    leftIcon={<LuLogIn size={16} />}
                  >
                    Sign in to Demo
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'var(--color-slate-400)', fontSize: 'var(--text-xs)', paddingTop: '8px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LuCheck size={16} color="var(--color-success-400)" /> React and Flutter Clients
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LuCheck size={16} color="var(--color-success-400)" /> Spring Boot and PostgreSQL
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LuCheck size={16} color="var(--color-success-400)" /> Signature-Based e-POD
                </span>
              </div>
            </div>

            {/* Right Hero Column: Interactive Floating Live Radar Preview */}
            <div>
              <Card
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 24px 48px -12px rgba(0,0,0,0.6)',
                  padding: 0,
                  overflow: 'hidden',
                }}
              >
                {/* Dashboard Top Header Bar */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#34d399',
                        display: 'inline-block',
                      }}
                    />
                    <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--color-white)', letterSpacing: '0.5px' }}>
                      ACTIVE FREIGHT RADAR & TELEMETRY
                    </strong>
                  </div>
                  <Badge variant="brand" size="sm">
                    LIVE FLEET
                  </Badge>
                </div>

                {/* Leaflet Live Map */}
                <div style={{ height: '310px', width: '100%', position: 'relative' }}>
                  <MapContainer
                    center={[16.0544, 107.5]}
                    zoom={5.4}
                    style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
                    scrollWheelZoom={false}
                    attributionControl={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      maxZoom={19}
                    />

                    <Polyline
                      positions={tradeLanes[selectedLane] || tradeLanes.northSouthTrunk}
                      color="#2563eb"
                      weight={4}
                      opacity={0.85}
                      dashArray="8, 6"
                    />

                    <Marker position={[21.0278, 105.8342]} icon={createHubPin('Hanoi Gateway', 'gateway')}>
                      <Popup>
                        <div style={{ padding: '4px', fontSize: '12px' }}>
                          <strong>Hanoi Northern Terminal</strong>
                          <div>Daily Outbound: 65 Trucks</div>
                        </div>
                      </Popup>
                    </Marker>
                    <Marker position={[16.0544, 108.2022]} icon={createHubPin('Da Nang Hub', 'crossdock')}>
                      <Popup>
                        <div style={{ padding: '4px', fontSize: '12px' }}>
                          <strong>Da Nang Central Cross-Dock</strong>
                          <div>Transit Hub: 40 Trucks/day</div>
                        </div>
                      </Popup>
                    </Marker>
                    <Marker position={[10.8231, 106.6297]} icon={createHubPin('HCMC Mega-Hub', 'gateway')}>
                      <Popup>
                        <div style={{ padding: '4px', fontSize: '12px' }}>
                          <strong>HCMC Southern Mega-Hub</strong>
                          <div>Daily Outbound: 120 Trucks</div>
                        </div>
                      </Popup>
                    </Marker>

                    {activeLiveFleet.map((truck) => (
                      <Marker key={truck.id} position={truck.pos} icon={createTruckPin(truck.name, truck.speed, truck.status)}>
                        <Popup>
                          <div style={{ padding: '4px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <strong style={{ color: '#2563eb' }}>{truck.id}</strong>
                            <div><strong>Lane:</strong> {truck.origin} → {truck.dest}</div>
                            <div><strong>Cargo:</strong> {truck.cargo}</div>
                            <div><strong>Speed:</strong> {truck.speed} (Live GPS)</div>
                            <div><strong>ETA:</strong> {truck.eta}</div>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>

                {/* Dashboard Bottom Telemetry Stats */}
                <div
                  style={{
                    padding: '12px 18px',
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Display</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#ffffff' }}>Sample Data</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Channel</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#34d399' }}>WebSocket</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Exceptions</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: '#38bdf8' }}>0 Cleared</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* 2. IMPLEMENTATION OVERVIEW */}
      <section className="container">
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 32px auto' }}>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            A full-stack demonstration of freight workflows across web and mobile clients.
          </h2>
          <Link to="/business" style={{ color: 'var(--color-brand-600)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>
            Explore the Implemented Workflows →
          </Link>
        </div>

        {/* Client Partner Logo Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          {clientPartners.map((partner) => (
            <div
              key={partner.name}
              style={{
                padding: '18px 20px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                textAlign: 'center',
                boxShadow: 'var(--shadow-xs)',
              }}
            >
              <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                {partner.name}
              </strong>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {partner.sector}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. PROJECT SCOPE */}
      <section className="container">
        <Card style={{ padding: '40px', backgroundColor: 'var(--bg-surface-subtle)', border: '1px solid var(--border-default)' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Badge variant="brand" size="sm" style={{ alignSelf: 'center' }}>
               Project Scope
            </Badge>
            <blockquote style={{ margin: 0, fontSize: 'var(--text-lg)', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>
              “LogiFlow is an academic project. Company names, operating statistics, locations, routes, and contacts shown in the interface are sample data rather than customer or service claims.”
            </blockquote>
            <div style={{ marginTop: '8px' }}>
              <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', display: 'block' }}>Demonstration Boundary</strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>No live carrier network or commercial service</span>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. CORE TRANSPORT MODES BREAKDOWN */}
      <section className="container" style={{ display: 'flex', flexDirection: 'column', gap: '72px' }}>
        {/* Mode 1: Inter-Provincial Linehaul Trunk */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LuTruck size={20} />
              </div>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-brand-600)', letterSpacing: '0.05em' }}>
                Inter-Provincial Linehaul Trunk
              </span>
            </div>

            <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
              Scheduled Freight Connecting North, Central & South Vietnam
            </h3>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              Move high-volume palletized freight and commercial cargo on reliable daily schedules. Connect primary production corridors between Hanoi, Bac Ninh, Da Nang, Binh Duong, and Ho Chi Minh City with automated dispatcher matching and continuous GPS tracking.
            </p>

            <Link to="/services" style={{ marginTop: '8px' }}>
              <Button variant="primary" size="md" rightIcon={<LuArrowRight size={14} />}>
                Explore Linehaul Services
              </Button>
            </Link>
          </div>

          {/* Linehaul Visual */}
          <div>
            <div
              style={{
                position: 'relative',
                height: '380px',
                width: '100%',
                borderRadius: 'var(--radius-2xl)',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--border-default)',
              }}
            >
              <img
                src="/service-truck.jpg"
                alt="Commercial Linehaul Truck"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Minimalist Floating Telemetry Pill */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '18px',
                  left: '18px',
                  backgroundColor: 'rgba(15, 23, 42, 0.82)',
                  backdropFilter: 'blur(12px)',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }} />
                <span><strong>Trunk 29H-8841</strong> • Hanoi → HCMC</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>• On Schedule</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mode 2: Port Drayage & Full Truckload (FTL) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div style={{ order: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LuWarehouse size={20} />
              </div>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-brand-600)', letterSpacing: '0.05em' }}>
                Seaport Drayage & Full Truckload (FTL)
              </span>
            </div>

            <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
              Direct Seaport Gate to Factory Floor Delivery
            </h3>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              Drayage and intermodal transport connecting deepwater terminals (Hai Phong, Cat Lai, Cai Mep) directly to regional ICDs and manufacturing plants. Dedicated heavy container tractors with automated weighbridge compliance auditing.
            </p>

            <Link to="/fleet" style={{ marginTop: '8px' }}>
              <Button variant="primary" size="md" rightIcon={<LuArrowRight size={14} />}>
                Explore Fleet Capabilities
              </Button>
            </Link>
          </div>

          {/* Drayage Visual */}
          <div style={{ order: 1 }}>
            <div
              style={{
                position: 'relative',
                height: '380px',
                width: '100%',
                borderRadius: 'var(--radius-2xl)',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--border-default)',
              }}
            >
              <img
                src="/service-ocean.jpg"
                alt="Seaport Container Drayage"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Minimalist Floating Telemetry Pill */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '18px',
                  left: '18px',
                  backgroundColor: 'rgba(15, 23, 42, 0.82)',
                  backdropFilter: 'blur(12px)',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }} />
                <span><strong>Cat Lai Drayage</strong> • Port → Song Than ICD</span>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>• In Transit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mode 3: Express Last-Mile Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LuPackage size={20} />
              </div>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-brand-600)', letterSpacing: '0.05em' }}>
                Express Last-Mile & Urban Delivery
              </span>
            </div>

            <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
              Same-Day and Next-Day Urban Fulfillment
            </h3>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              Fast, predictable regional deliveries across major metropolitan hubs. Features bulk barcode scanning, automated driver route sequencing, paperless digital proof of delivery (e-POD), and real-time delivery status notifications.
            </p>

            <Link to="/services" style={{ marginTop: '8px' }}>
              <Button variant="primary" size="md" rightIcon={<LuArrowRight size={14} />}>
                Explore Express Delivery
              </Button>
            </Link>
          </div>

          {/* Fulfillment Visual */}
          <div>
            <div
              style={{
                position: 'relative',
                height: '380px',
                width: '100%',
                borderRadius: 'var(--radius-2xl)',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--border-default)',
              }}
            >
              <img
                src="/service-fulfillment.jpg"
                alt="Express Urban Fulfillment"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Minimalist Floating Telemetry Pill */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '18px',
                  left: '18px',
                  backgroundColor: 'rgba(15, 23, 42, 0.82)',
                  backdropFilter: 'blur(12px)',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }} />
                <span><strong>Urban Hub SGN-02</strong> • 99.4% On-Time e-POD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mode 4: Temperature-Controlled Cold-Chain */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '48px', alignItems: 'center' }}>
          <div style={{ order: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LuShieldCheck size={20} />
              </div>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-brand-600)', letterSpacing: '0.05em' }}>
                Temperature-Controlled Cold-Chain
              </span>
            </div>

            <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
              IoT-Monitored Reefer Transport for Perishables & Pharma
            </h3>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.65, margin: 0 }}>
              Maintain unbroken temperature integrity from Mekong aquaculture facilities and Da Lat produce farms directly to central cold-storage hubs. Multi-temperature setpoints (-20°C to +15°C) with automated reefer sensor logging.
            </p>

            <Link to="/services" style={{ marginTop: '8px' }}>
              <Button variant="primary" size="md" rightIcon={<LuArrowRight size={14} />}>
                Explore Cold-Chain
              </Button>
            </Link>
          </div>

          {/* Air / Cold-Chain Visual */}
          <div style={{ order: 1 }}>
            <div
              style={{
                position: 'relative',
                height: '380px',
                width: '100%',
                borderRadius: 'var(--radius-2xl)',
                overflow: 'hidden',
                boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
                border: '1px solid var(--border-default)',
              }}
            >
              <img
                src="/service-air.jpg"
                alt="Cold-Chain Transport"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Minimalist Floating Telemetry Pill */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '18px',
                  left: '18px',
                  backgroundColor: 'rgba(15, 23, 42, 0.82)',
                  backdropFilter: 'blur(12px)',
                  color: '#ffffff',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--text-xs)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8', display: 'inline-block' }} />
                <span><strong>Reefer 51D-9214</strong> • Cold-Chain (-18°C) • Verified</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TAKE FULL CONTROL OF YOUR FREIGHT (4 Pillars Matrix) */}
      <section className="container">
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 40px auto' }}>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            Take full control of your freight operations
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Unified tools engineered for shippers, dispatchers, and fleet drivers across Vietnam.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
          {/* Dispatch & Routing */}
          <Card style={{ padding: '28px', border: '1px solid var(--border-default)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <LuTruck size={22} />
            </div>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
              Dispatch & Routing
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-xs)' }}>
              <li><Link to="/services" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>Automated Driver Matching →</Link></li>
              <li><Link to="/services" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>Multi-Stop Trip Batching →</Link></li>
              <li><Link to="/fleet" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>Vehicle Readiness & Tonnage →</Link></li>
            </ul>
          </Card>

          {/* Real-Time GPS Telemetry */}
          <Card style={{ padding: '28px', border: '1px solid var(--border-default)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <LuNavigation size={22} />
            </div>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
              Live Telemetry & GPS
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-xs)' }}>
              <li><Link to="/track" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>Real-Time Shipment Tracking →</Link></li>
              <li><Link to="/coverage" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>63-Province Hub Corridors →</Link></li>
              <li><Link to="/track" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>Speed & Waypoint Logs →</Link></li>
            </ul>
          </Card>

          {/* Shipment Management */}
          <Card style={{ padding: '28px', border: '1px solid var(--border-default)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <LuPackage size={22} />
            </div>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
              Shipment Management
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-xs)' }}>
              <li><Link to="/business" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>Excel / CSV Bulk Order Import →</Link></li>
              <li><Link to="/services" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>Digital e-POD Confirmation →</Link></li>
              <li><Link to="/business" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>Barcode & Manifest Generation →</Link></li>
            </ul>
          </Card>

          {/* Settlement & Invoicing */}
          <Card style={{ padding: '28px', border: '1px solid var(--border-default)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <LuDollarSign size={22} />
            </div>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
              Billing & Settlement
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: 'var(--text-xs)' }}>
              <li><Link to="/business" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>Transparent Provincial Tariffs →</Link></li>
              <li><Link to="/business" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>Automated COD Reconciliation →</Link></li>
              <li><Link to="/business" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>Net-30 Corporate Invoicing →</Link></li>
            </ul>
          </Card>
        </div>
      </section>

      {/* 6. NEWS & LOGIFLOW INSIGHTS */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <Badge variant="brand" size="sm" style={{ marginBottom: '8px' }}>
              Market Insights & Knowledge
            </Badge>
            <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              LogiFlow Insights
            </h2>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Actionable logistics intelligence, freight rate benchmarks, and supply chain operational analysis.
            </p>
          </div>

          <Link to="/insights">
            <Button variant="outline" size="sm" rightIcon={<LuArrowRight size={14} />}>
              View All Insights & News →
            </Button>
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {newsArticles.map((art) => (
            <Card
              key={art.id}
              style={{
                padding: 0,
                overflow: 'hidden',
                border: '1px solid var(--border-default)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Photo Thumbnail */}
              <div style={{ height: '175px', width: '100%', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={art.image}
                  alt={art.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Badge variant="neutral" size="sm">
                    {art.tag}
                  </Badge>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{art.readTime}</span>
                </div>

                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                  {art.title}
                </h3>

                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, flex: 1 }}>
                  {art.summary}
                </p>

                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{art.date}</span>
                  <Link to="/insights" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-brand-600)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Read Article <LuArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 7. GLOBAL REACH, LOCAL ON-THE-GROUND EXPERTISE */}
      <section className="container">
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 36px auto' }}>
          <Badge variant="neutral" size="sm" style={{ marginBottom: '8px' }}>
              Sample Map Data
          </Badge>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            Representative Vietnamese logistics routes
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            The map demonstrates markers and route polylines; it does not represent LogiFlow-owned hubs or active coverage.
          </p>
        </div>

        <Card style={{ overflow: 'hidden', border: '1px solid var(--border-default)', padding: 0 }}>
          <div style={{ height: '360px', width: '100%' }}>
            <MapContainer
              center={[16.0544, 107.5]}
              zoom={5.2}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={19}
              />
              <Polyline positions={tradeLanes.northSouthTrunk} color="#2563eb" weight={4} opacity={0.8} dashArray="6, 6" />
              <Marker position={[21.0278, 105.8342]} icon={createHubPin('Hanoi Office & Hub')}>
                <Popup><strong>Sample Northern Hub</strong><br />Hanoi</Popup>
              </Marker>
              <Marker position={[16.0544, 108.2022]} icon={createHubPin('Da Nang Office')}>
                <Popup><strong>Sample Central Hub</strong><br />Da Nang</Popup>
              </Marker>
              <Marker position={[10.8231, 106.6297]} icon={createHubPin('HCMC HQ')}>
                <Popup><strong>Sample Southern Hub</strong><br />Ho Chi Minh City</Popup>
              </Marker>
            </MapContainer>
          </div>
          <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-surface-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '20px', fontSize: 'var(--text-xs)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: '#2563eb', borderRadius: '2px' }} />
                 Sample Hub Markers
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '10px', height: '4px', backgroundColor: '#2563eb' }} />
                 Sample Route Polylines
              </span>
            </div>
            <Link to="/coverage" style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-brand-600)' }}>
               View Sample Coverage Map →
            </Link>
          </div>
        </Card>
      </section>

      {/* 8. PUT US TO WORK AS YOUR LOGISTICS PLATFORM (Pre-Footer CTA) */}
      <section className="container">
        <Card
          style={{
            backgroundColor: 'var(--color-slate-900)',
            color: 'var(--color-white)',
            padding: '52px 40px',
            borderRadius: 'var(--radius-2xl)',
            border: 'none',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-white)', margin: '0 0 12px 0' }}>
                 Ready to Explore the Demo?
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-300)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                 Create a sample customer or driver account to walk through the implemented role-based flows.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/register/customer">
                  <Button variant="primary" size="lg" leftIcon={<LuUserPlus size={16} />}>
                     Try Customer Flow
                  </Button>
                </Link>
                <Link to="/register/driver">
                  <Button
                    variant="outline"
                    size="lg"
                    style={{
                      backgroundColor: 'transparent',
                      borderColor: 'var(--color-slate-700)',
                      color: 'var(--color-white)',
                    }}
                    leftIcon={<LuTruck size={16} />}
                  >
                     Try Driver Flow
                  </Button>
                </Link>
              </div>
            </div>

            {/* Direct Inquiry Box */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '28px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {leadSubmitted ? (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--color-success-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <LuCheck size={24} />
                  </div>
                  <h3 style={{ color: '#fff', fontSize: 'var(--text-lg)', margin: '0 0 6px 0' }}>Demo Form Submitted</h3>
                  <p style={{ color: 'var(--color-slate-300)', fontSize: 'var(--text-xs)', margin: 0 }}>
                    No information was transmitted to a sales or operations team.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleLeadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Input
                    label="Business Email *"
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm((p) => ({ ...p, email: e.target.value }))}
                  />
                  <Input
                    label="Company / Shipper Name *"
                    required
                    placeholder="e.g. Acme Logistics Ltd."
                    value={leadForm.company}
                    onChange={(e) => setLeadForm((p) => ({ ...p, company: e.target.value }))}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <Select
                      label="Primary Freight Mode"
                      value={leadForm.mode}
                      onChange={(e) => setLeadForm((p) => ({ ...p, mode: e.target.value }))}
                      options={[
                        { value: 'FTL', label: 'Inter-Provincial FTL' },
                        { value: 'DRAYAGE', label: 'Port Drayage' },
                        { value: 'EXPRESS', label: 'Express Delivery' },
                        { value: 'COLDCHAIN', label: 'Cold-Chain Reefer' },
                      ]}
                    />
                    <Select
                      label="Monthly Volume"
                      value={leadForm.monthlyVolume}
                      onChange={(e) => setLeadForm((p) => ({ ...p, monthlyVolume: e.target.value }))}
                      options={[
                        { value: '1-10_TRIPS', label: '1 – 10 Trips / mo' },
                        { value: '10-50_TRIPS', label: '10 – 50 Trips / mo' },
                        { value: '50+_TRIPS', label: '50+ High Volume' },
                      ]}
                    />
                  </div>
                  <Button variant="primary" size="lg" type="submit" style={{ marginTop: '8px' }}>
                    Simulate Form Submission
                  </Button>
                </form>
              )}
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default HomePage;
