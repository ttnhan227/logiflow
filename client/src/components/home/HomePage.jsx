import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, Input, Select, Badge } from '@/components/ui';
import {
  LuSearch,
  LuArrowRight,
  LuTruck,
  LuPackage,
  LuWarehouse,
  LuShieldCheck,
  LuNavigation,
  LuDollarSign,
  LuCheck,
  LuUserPlus,
  LuLogIn,
} from 'react-icons/lu';

const HomeCoverageMap = lazy(() => import('./HomeCoverageMap'));

const PictureMedia = ({
  base,
  fallbackExt = 'jpg',
  alt,
  width,
  height,
  loading = 'lazy',
  fetchPriority,
  style = {},
}) => (
  <picture style={{ display: 'block', width: '100%', height: '100%' }}>
    <source srcSet={`/${base}.avif`} type="image/avif" />
    <source srcSet={`/${base}.webp`} type="image/webp" />
    <img
      src={`/${base}.${fallbackExt}`}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding={loading === 'eager' ? 'sync' : 'async'}
      style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', ...style }}
    />
  </picture>
);

export const HomePage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [leadForm, setLeadForm] = useState({ company: '', email: '', mode: 'FTL', monthlyVolume: '10-50_TRIPS' });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [shouldLoadMap, setShouldLoadMap] = useState(false);
  const mapTriggerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const el = mapTriggerRef.current;
    if (!el || shouldLoadMap) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoadMap(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoadMap(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [shouldLoadMap]);

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
      imageBase: 'article-market',
      width: 960,
      height: 720,
      title: 'Vietnam Domestic Freight Rates: Q3 Linehaul Capacity & Fuel Trends',
      readTime: '5 min read',
      date: 'August 2026',
      summary: 'Detailed benchmark of North-South trunk rates, Hai Phong port drayage turnaround times, and seasonal agricultural demand out of the Mekong Delta.',
      link: '/insights',
    },
    {
      id: 'cold-chain-best-practices',
      tag: 'Cold Chain Best Practices',
      imageBase: 'article-coldchain',
      width: 960,
      height: 640,
      title: 'Eliminating Temperature Excursions in Tropical Cargo Linehaul',
      readTime: '7 min read',
      date: 'August 2026',
      summary: 'How IoT reefer telematics, automated door-opening sensors, and predictive ETA routing maintain 100% cold-chain integrity for seafood and pharmaceuticals.',
      link: '/insights',
    },
    {
      id: 'ai-dispatch-efficiency',
      tag: 'Technology & AI',
      imageBase: 'article-dispatch',
      width: 960,
      height: 640,
      title: 'How Automated Dispatch Algorithms Cut Empty Linehaul Miles by 28%',
      readTime: '6 min read',
      date: 'July 2026',
      summary: 'A deep dive into LogiFlow’s dynamic batching algorithm and how it matches backhaul capacity across Vietnam to eliminate empty miles.',
      link: '/insights',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px', paddingBottom: '80px' }}>
      {/* 1. HERO SECTION — unified Vietnam route poster */}
      <section
        className="logiflow-route-hero"
        style={{
          position: 'relative',
          backgroundColor: 'var(--color-asphalt)',
          color: 'var(--color-white)',
          padding: '92px 0 112px 0',
          minHeight: '680px',
          overflow: 'hidden',
          borderBottom: '4px solid var(--color-route-orange)',
        }}
      >
        {/* Background LCP Image Layer */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
          <PictureMedia
            base="brand-route-art"
            fallbackExt="jpg"
            alt=""
            width={1600}
            height={839}
            loading="eager"
            fetchPriority="high"
            style={{ objectPosition: 'center' }}
          />
        </div>

        {/* Soft Contrast Gradient Overlays */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(90deg, rgba(3, 17, 31, 0.93) 0%, rgba(3, 17, 31, 0.78) 38%, rgba(3, 17, 31, 0.18) 72%), linear-gradient(180deg, rgba(3, 17, 31, 0.18) 0%, rgba(3, 17, 31, 0.05) 58%, rgba(3, 17, 31, 0.82) 100%)',
            pointerEvents: 'none',
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 650px)', alignItems: 'center' }}>
            {/* Left Hero Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant="brand" size="md">Pan-Vietnam Freight Operations</Badge>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(44px, 6vw, 72px)',
                  fontWeight: 'var(--font-bold)',
                  color: 'var(--color-white)',
                  lineHeight: 1.12,
                  letterSpacing: 'var(--tracking-tight)',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)',
                  margin: 0,
                }}
              >
                Move freight.<br />See everything.
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
                Dispatch orders, follow live GPS movement, coordinate drivers, and
                capture proof of delivery in one continuous operational flow.
              </p>

              {/* Quick Freight Track Console */}
              <div
                style={{
                  padding: '8px',
                  backgroundColor: 'rgba(3, 17, 31, 0.72)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid rgba(68, 197, 225, 0.38)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <form className="logiflow-track-form" onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="logiflow-track-input"
                    aria-label="Enter Tracking Code or Order ID"
                    placeholder="Enter Tracking Code (e.g. TRK-882194)..."
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    style={{
                      flex: 1,
                      minHeight: '46px',
                      padding: '0 16px',
                      backgroundColor: 'var(--color-white)',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'max(1rem, var(--text-sm))',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Button type="submit" variant="primary" size="lg" leftIcon={<LuSearch size={16} aria-hidden="true" />}>
                    Track Shipment
                  </Button>
                </form>
              </div>

              {/* Hero Action CTAs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                <Button as={Link} to="/register/customer" variant="primary" size="lg" leftIcon={<LuUserPlus size={16} aria-hidden="true" />} rightIcon={<LuArrowRight size={16} aria-hidden="true" />}>
                  Try Customer Registration
                </Button>
                <Button
                  as={Link}
                  to="/register/driver"
                  variant="outline"
                  size="lg"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: 'var(--color-slate-600)',
                    color: 'var(--color-white)',
                  }}
                  leftIcon={<LuTruck size={16} aria-hidden="true" />}
                >
                  Try Driver Registration
                </Button>
                <Button
                  as={Link}
                  to="/login"
                  variant="outline"
                  size="lg"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    borderColor: 'rgba(255,255,255,0.28)',
                    color: 'var(--color-white)',
                  }}
                  leftIcon={<LuLogIn size={16} aria-hidden="true" />}
                >
                  Sign In
                </Button>
              </div>

              {/* Trust Indicators */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'var(--color-slate-300)', fontSize: 'var(--text-xs)', paddingTop: '8px', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LuCheck size={16} color="var(--color-success-400)" aria-hidden="true" /> React and Flutter Clients
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LuCheck size={16} color="var(--color-success-400)" aria-hidden="true" /> Spring Boot and PostgreSQL
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LuCheck size={16} color="var(--color-success-400)" aria-hidden="true" /> Signature-Based e-POD
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PRODUCT SCREENSHOTS */}
      <section className="container">
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 32px auto' }}>
          <Badge variant="brand" size="sm">Product Screens</Badge>
          <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '12px 0 8px 0' }}>
            The dispatcher workspace and live route map.
          </h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Review orders and fleet activity in the operations dashboard, then follow a trip on the map. Screens show demonstration data.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18.5rem), 1fr))', gap: '24px' }}>
          <figure style={{ margin: 0, overflow: 'hidden', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <PictureMedia base="logiflow-dashboard" fallbackExt="png" alt="LogiFlow dispatcher operations dashboard" width={1280} height={800} style={{ height: 'auto' }} />
            <figcaption style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Operations dashboard</figcaption>
          </figure>
          <figure style={{ margin: 0, overflow: 'hidden', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)' }}>
            <PictureMedia base="logiflow-map" fallbackExt="png" alt="LogiFlow live driver location map" width={1280} height={800} style={{ height: 'auto' }} />
            <figcaption style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>Driver location and route map</figcaption>
          </figure>
        </div>
      </section>

      {/* 3. IMPLEMENTATION OVERVIEW */}
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
            <p style={{ margin: 0, fontSize: 'var(--text-lg)', fontStyle: 'italic', color: 'var(--text-primary)', lineHeight: 1.6, fontWeight: 500 }}>
              “LogiFlow is an academic project. Company names, operating statistics, locations, routes, and contacts shown in the interface are sample data rather than customer or service claims.”
            </p>
            <div style={{ marginTop: '8px' }}>
              <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', display: 'block' }}>Demonstration Boundary</strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>No live carrier network or commercial service</span>
            </div>
          </div>
        </Card>
      </section>

      {/* 4. CORE TRANSPORT MODES BREAKDOWN */}
      <section className="container" style={{ display: 'flex', flexDirection: 'column', gap: '72px' }}>
        <h2 className="sr-only">Core Transport Modes</h2>
        {/* Mode 1: Inter-Provincial Linehaul Trunk */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 19rem), 1fr))', gap: '48px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LuTruck size={20} aria-hidden="true" />
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

            <Button as={Link} to="/services" variant="primary" size="md" rightIcon={<LuArrowRight size={14} aria-hidden="true" />} style={{ marginTop: '8px', alignSelf: 'flex-start' }}>
              Explore Linehaul Services
            </Button>
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
              <PictureMedia base="service-truck" fallbackExt="jpg" alt="Commercial Linehaul Truck" width={960} height={1280} />
            </div>
          </div>
        </div>

        {/* Mode 2: Port Drayage & Full Truckload (FTL) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 19rem), 1fr))', gap: '48px', alignItems: 'center' }}>
          <div style={{ order: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LuWarehouse size={20} aria-hidden="true" />
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

            <Button as={Link} to="/fleet" variant="primary" size="md" rightIcon={<LuArrowRight size={14} aria-hidden="true" />} style={{ marginTop: '8px', alignSelf: 'flex-start' }}>
              Explore Fleet Capabilities
            </Button>
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
              <PictureMedia base="service-ocean" fallbackExt="jpg" alt="Seaport Container Drayage" width={960} height={539} />
            </div>
          </div>
        </div>

        {/* Mode 3: Express Last-Mile Distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 19rem), 1fr))', gap: '48px', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LuPackage size={20} aria-hidden="true" />
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

            <Button as={Link} to="/services" variant="primary" size="md" rightIcon={<LuArrowRight size={14} aria-hidden="true" />} style={{ marginTop: '8px', alignSelf: 'flex-start' }}>
              Explore Express Delivery
            </Button>
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
              <PictureMedia base="service-fulfillment" fallbackExt="jpg" alt="Express Urban Fulfillment" width={960} height={640} />
            </div>
          </div>
        </div>

        {/* Mode 4: Temperature-Controlled Cold-Chain */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 19rem), 1fr))', gap: '48px', alignItems: 'center' }}>
          <div style={{ order: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LuShieldCheck size={20} aria-hidden="true" />
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

            <Button as={Link} to="/services" variant="primary" size="md" rightIcon={<LuArrowRight size={14} aria-hidden="true" />} style={{ marginTop: '8px', alignSelf: 'flex-start' }}>
              Explore Cold-Chain
            </Button>
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
              <PictureMedia base="service-air" fallbackExt="jpg" alt="Cold-Chain Transport" width={960} height={638} />
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
              <li><Link to="/coverage" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>OSRM Route &amp; Distance Mapping →</Link></li>
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
              <li><Link to="/business" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>PDF Invoices &amp; Delivery Receipts →</Link></li>
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
              <li><Link to="/business" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>Distance-Based Freight Pricing →</Link></li>
              <li><Link to="/business" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>PayPal Sandbox Checkout →</Link></li>
              <li><Link to="/business" style={{ color: 'var(--color-brand-600)', fontWeight: 600 }}>Driver Payout &amp; Fee Requests →</Link></li>
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

          <Button as={Link} to="/insights" variant="outline" size="sm" rightIcon={<LuArrowRight size={14} aria-hidden="true" />}>
            View All Insights & News →
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 18.5rem), 1fr))', gap: '24px' }}>
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
                <PictureMedia
                  base={art.imageBase}
                  fallbackExt="jpg"
                  alt={art.title}
                  width={art.width}
                  height={art.height}
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
                    Read Article <LuArrowRight size={12} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 7. GLOBAL REACH, LOCAL ON-THE-GROUND EXPERTISE */}
      <section className="container" ref={mapTriggerRef}>
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
          <div style={{ height: '360px', width: '100%', backgroundColor: 'var(--color-slate-100)' }}>
            {shouldLoadMap ? (
              <Suspense
                fallback={
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    Loading interactive route map…
                  </div>
                }
              >
                <HomeCoverageMap />
              </Suspense>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                Interactive route map loads on scroll
              </div>
            )}
          </div>
          <div style={{ padding: '16px 24px', backgroundColor: 'var(--bg-surface-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '20px', fontSize: 'var(--text-xs)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span aria-hidden="true" style={{ width: '10px', height: '10px', backgroundColor: '#2563eb', borderRadius: '2px' }} />
                 Sample Hub Markers
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span aria-hidden="true" style={{ width: '10px', height: '4px', backgroundColor: '#2563eb' }} />
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 19rem), 1fr))', gap: '40px', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-white)', margin: '0 0 12px 0' }}>
                 Ready to Explore the Demo?
              </h2>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-300)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                 Create a sample customer or driver account to walk through the implemented role-based flows.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Button as={Link} to="/register/customer" variant="primary" size="lg" leftIcon={<LuUserPlus size={16} aria-hidden="true" />}>
                   Try Customer Flow
                </Button>
                <Button
                  as={Link}
                  to="/register/driver"
                  variant="outline"
                  size="lg"
                  style={{
                    backgroundColor: 'transparent',
                    borderColor: 'var(--color-slate-600)',
                    color: 'var(--color-white)',
                  }}
                  leftIcon={<LuTruck size={16} aria-hidden="true" />}
                >
                   Try Driver Flow
                </Button>
              </div>
            </div>

            {/* Direct Inquiry Box */}
            <div
              className="dark-card-form"
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
                    <LuCheck size={24} aria-hidden="true" />
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
                    name="email"
                    type="email"
                    autoComplete="email"
                    spellCheck={false}
                    autoCapitalize="none"
                    required
                    placeholder="name@company.com"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm((p) => ({ ...p, email: e.target.value }))}
                  />
                  <Input
                    label="Company / Shipper Name *"
                    name="organization"
                    autoComplete="organization"
                    required
                    placeholder="e.g. Acme Logistics Ltd."
                    value={leadForm.company}
                    onChange={(e) => setLeadForm((p) => ({ ...p, company: e.target.value }))}
                  />
                  <div className="responsive-grid-2" style={{ gap: '12px' }}>
                    <Select
                      label="Primary Freight Mode"
                      name="freightMode"
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
                      name="monthlyVolume"
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
