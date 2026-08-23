import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, Badge, PageHeader, Input } from '@/components/ui';
import {
  LuSearch,
  LuCalendar,
  LuClock,
  LuArrowRight,
  LuTrendingUp,
  LuShip,
  LuPlane,
  LuTruck,
  LuFileText,
  LuBookOpen,
  LuLayers,
  LuSparkles,
} from 'react-icons/lu';

export const InsightsPage = () => {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const categories = [
    { id: 'ALL', label: 'All Insights' },
    { id: 'MARKET_UPDATE', label: 'Freight Market Updates' },
    { id: 'OCEAN_AIR', label: 'Ocean & Air Freight' },
    { id: 'TRUCKING_LASTMILE', label: 'Trucking & Last-Mile' },
    { id: 'CUSTOMS_TRADE', label: 'Customs & Regulatory' },
    { id: 'SUPPLY_CHAIN_TECH', label: 'Supply Chain AI & Tech' },
  ];

  const articles = [
    {
      id: 'fmu-august-2026',
      category: 'MARKET_UPDATE',
      tag: 'Freight Market Update',
      image: '/article-market.jpg',
      title: 'Global Freight Market Rate Update: Transpacific & Asia-Europe Corridors',
      readTime: '6 min read',
      date: 'August 22, 2026',
      author: 'LogiFlow Strategic Trade Intelligence',
      summary: 'Analysis of ocean container spot rates, blank sailings, air cargo peak season demand surges, and domestic linehaul capacity indexes across Southeast Asia.',
      content: `
        ### Key Market Takeaways:
        - **Ocean Freight Rates**: Asia-to-US West Coast spot rates stabilized around $4,850/FEU following early peak season demand. Carrier reliability improved to 71.4%.
        - **Air Cargo Capacity**: Cross-border e-commerce volumes continue to absorb wide-body freighter space out of Hanoi (HAN) and Ho Chi Minh City (SGN), pushing spot rates up 12% MoM.
        - **Domestic Trucking**: Regional linehaul corridors between Hanoi and industrial manufacturing hubs (Bac Ninh, Hai Phong) report 99.2% on-time dispatch turnaround with optimized backhauls.
        - **Recommendations for Shippers**: Secure fixed space allocations 3–4 weeks in advance for Q3/Q4 peak season cargo to avoid demurrage and rollovers.
      `,
    },
    {
      id: 'cold-chain-best-practices',
      category: 'TRUCKING_LASTMILE',
      tag: 'Trucking & Cold Chain',
      image: '/article-coldchain.jpg',
      title: 'Eliminating Temperature Excursions in Tropical Cargo Linehaul',
      readTime: '8 min read',
      date: 'August 18, 2026',
      author: 'Nguyen Van Hai, VP of Cold-Chain Operations',
      summary: 'How IoT reefer telematics, automated door-opening sensors, and predictive ETA routing maintain 100% cold-chain integrity for seafood and pharmaceuticals.',
      content: `
        ### Cold-Chain Operational Excellence:
        - **Continuous IoT Logging**: Sensors record ambient and cargo core temperatures every 60 seconds with instant satellite alerts if reefer temps drift ±1.5°C.
        - **Pre-Cooling Compliance**: Automated weighbridge audits ensure trucks meet strict pre-cooling setpoints before loading docks open.
        - **Route Optimization**: Real-time traffic rerouting bypasses congestion along the National Highway 1A coastal trunk, cutting average transit times by 4.2 hours.
      `,
    },
    {
      id: 'customs-modernization-vietnam',
      category: 'CUSTOMS_TRADE',
      tag: 'Customs & Compliance',
      image: '/service-truck.jpg',
      title: 'Guide to Vietnam Customs Modernization: E-Manifests & Direct VNACCS/VCIS Filing',
      readTime: '5 min read',
      date: 'August 10, 2026',
      author: 'Pham Thi Lan, Lead Customs Brokerage Counsel',
      summary: 'A step-by-step breakdown of digital customs declarations, green channel clearance protocols, and duty drawback optimization for multinational manufacturers.',
      content: `
        ### Digital Customs Highlights:
        - **Pre-Arrival Clearance**: Filing declarations prior to vessel docking at Cat Lai and Cai Mep ports enables direct discharge to inland trucks within 90 minutes.
        - **HS Code Machine Classification**: AI validation reduces tariff classification disputes and prevents customs audit penalties.
        - **Paperless e-POD**: Digital proof-of-delivery integration ties customs clearance documentation directly into accounts payable systems.
      `,
    },
    {
      id: 'ai-dispatch-efficiency',
      category: 'SUPPLY_CHAIN_TECH',
      tag: 'Technology & AI',
      image: '/article-dispatch.jpg',
      title: 'How Automated Dispatch Algorithms Cut Empty Linehaul Miles by 28%',
      readTime: '7 min read',
      date: 'July 28, 2026',
      author: 'LogiFlow Supply Chain Engineering Team',
      summary: 'Exploring how machine learning matches outbound manufacturing freight with inbound agricultural return loads to maximize fleet utilization.',
      content: `
        ### Algorithmic Linehaul Optimization:
        - **Dynamic Batching**: Grouping LTL shipments by volumetric density and destination geofences increases tractor-trailer payload efficiency to 94.6%.
        - **Backhaul Matching**: Real-time bidding interfaces connect independent fleet owners with verified return loads, slashing empty return trips.
        - **Carbon Footprint Tracking**: Accurate scope 3 emissions calculation allows enterprise shippers to meet ESG reporting standards.
      `,
    },
    {
      id: 'ocean-shipping-transparency',
      category: 'OCEAN_AIR',
      tag: 'Ocean Freight',
      image: '/service-ocean.jpg',
      title: 'Digitizing Ocean Freight: From Purchase Order to Final Port Delivery',
      readTime: '6 min read',
      date: 'July 15, 2026',
      author: 'Global Ocean Freight Operations',
      summary: 'Why SKU-level purchase order tracking and real-time AIS vessel telemetry are transforming modern container logistics.',
      content: `
        ### End-to-End Container Visibility:
        - **PO Milestone Tracking**: Know the exact status of individual SKU part numbers inside 40ft High Cube containers.
        - **Demurrage & Detention Alerts**: Automated alerts calculate free-time clocks across all container terminals, preventing costly port storage fees.
        - **Integrated Drayage**: Synchronized chassis assignments ensure containers move out of port terminals within 12 hours of discharge.
      `,
    },
  ];

  const filteredArticles = articles.filter((a) => {
    const matchesCategory = activeCategory === 'ALL' || a.category === activeCategory;
    const matchesSearch =
      searchTerm.trim() === '' ||
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">LogiFlow Insights & Market Intelligence</Badge>}
          title="Supply Chain News, Market Updates & Expert Analysis"
          description="Actionable freight rate benchmarks, ocean and air carrier updates, regulatory customs analysis, and supply chain technology research."
        />
      </div>

      {/* Filter and Search Bar */}
      <section className="container">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            {/* Category Tabs */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: activeCategory === cat.id ? 'var(--color-brand-600)' : 'var(--border-default)',
                    backgroundColor: activeCategory === cat.id ? 'var(--color-brand-600)' : 'var(--bg-surface)',
                    color: activeCategory === cat.id ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div style={{ maxWidth: '320px', width: '100%' }}>
              <Input
                placeholder="Search freight articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<LuSearch size={16} />}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Lead Story */}
      {filteredArticles.length > 0 && activeCategory === 'ALL' && !searchTerm && (
        <section className="container">
          <Card
            style={{
              padding: 0,
              overflow: 'hidden',
              backgroundColor: 'var(--color-slate-900)',
              color: 'var(--color-white)',
              borderRadius: 'var(--radius-2xl)',
              border: 'none',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', alignItems: 'stretch' }}>
              {/* Left Column Text */}
              <div style={{ padding: '40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <Badge variant="brand" size="sm">
                    Featured Market Report
                  </Badge>
                  <span style={{ fontSize: '11px', color: 'var(--color-slate-400)' }}>August 2026 Edition</span>
                </div>

                <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--color-white)', margin: '0 0 14px 0', lineHeight: 1.2 }}>
                  {filteredArticles[0].title}
                </h2>

                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-slate-300)', lineHeight: 1.6, margin: '0 0 24px 0' }}>
                  {filteredArticles[0].summary}
                </p>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setSelectedArticle(filteredArticles[0])}
                  rightIcon={<LuArrowRight size={16} />}
                  style={{ alignSelf: 'flex-start' }}
                >
                  Read Full Market Report
                </Button>
              </div>

              {/* Right Column Authentic Image */}
              <div style={{ minHeight: '300px', position: 'relative' }}>
                <img
                  src={filteredArticles[0].image}
                  alt={filteredArticles[0].title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Article Cards Grid with Authentic Photography Thumbnails */}
      <section className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '28px' }}>
          {filteredArticles.map((art) => (
            <Card
              key={art.id}
              style={{
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid var(--border-default)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => setSelectedArticle(art)}
            >
              {/* Photo Thumbnail */}
              <div style={{ height: '190px', width: '100%', overflow: 'hidden', position: 'relative' }}>
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

                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.35 }}>
                  {art.title}
                </h3>

                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, flex: 1 }}>
                  {art.summary}
                </p>

                <div style={{ paddingTop: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{art.date}</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-brand-600)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    Read Article <LuArrowRight size={13} />
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Full Article Reader Modal */}
      {selectedArticle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => setSelectedArticle(null)}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-2xl)',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 0,
              overflow: 'hidden',
              boxShadow: 'var(--shadow-2xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Hero Image */}
            <div style={{ height: '240px', width: '100%', position: 'relative' }}>
              <img
                src={selectedArticle.image}
                alt={selectedArticle.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                onClick={() => setSelectedArticle(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.75)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Badge variant="brand" size="sm">
                  {selectedArticle.tag}
                </Badge>
              </div>

              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 12px 0' }}>
                {selectedArticle.title}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: '24px', flexWrap: 'wrap' }}>
                <span>Published: {selectedArticle.date}</span>
                <span>•</span>
                <span>{selectedArticle.readTime}</span>
                <span>•</span>
                <span>Author: {selectedArticle.author}</span>
              </div>

              <div
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  whiteSpace: 'pre-line',
                }}
              >
                {selectedArticle.content}
              </div>

              <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-default)', display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="primary" size="md" onClick={() => setSelectedArticle(null)}>
                  Done Reading
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsPage;
