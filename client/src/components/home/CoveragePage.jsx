import React from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button, Card, CardContent, Badge, PageHeader } from '@/components/ui';
import {
  LuMapPin,
  LuBuilding2,
  LuTruck,
  LuZap,
  LuCalendar,
  LuFactory,
  LuArrowRight,
} from 'react-icons/lu';

// Create crisp SVG DivIcons for Leaflet
const createPinIcon = (color, label) =>
  divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: ${color};
        color: white;
        border: 2px solid white;
        border-radius: 9999px;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: 700;
        font-family: Inter, sans-serif;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
        white-space: nowrap;
      ">
        ${label}
      </div>
    `,
    iconSize: [60, 24],
    iconAnchor: [30, 12],
    popupAnchor: [0, -12],
  });

const hqIcon = createPinIcon('#dc2626', 'HQ HCMC');
const northIcon = createPinIcon('#2563eb', 'North Hub');
const centralIcon = createPinIcon('#059669', 'Central Hub');
const southIcon = createPinIcon('#d97706', 'South Hub');

export const CoveragePage = () => {
  const cities = [
    { name: 'Hanoi Terminal', coords: [21.0278, 105.8342], region: 'north', label: 'Hanoi Hub', drivers: '60+' },
    { name: 'Hai Phong Port Hub', coords: [20.846, 106.6881], region: 'north', label: 'Hai Phong', drivers: '40+' },
    { name: 'Quang Ninh Hub', coords: [20.9718, 107.0417], region: 'north', label: 'Quang Ninh', drivers: '25+' },
    { name: 'Da Nang Central Crossdock', coords: [16.0544, 108.2022], region: 'central', label: 'Da Nang Hub', drivers: '45+' },
    { name: 'Hue Distribution', coords: [16.4619, 107.595], region: 'central', label: 'Hue Hub', drivers: '20+' },
    { name: 'Nha Trang Marine Hub', coords: [12.2388, 109.1967], region: 'central', label: 'Nha Trang', drivers: '30+' },
    { name: 'HCMC Primary Gateway', coords: [10.8231, 106.6297], region: 'south', label: 'HCMC Gateway', drivers: '120+' },
    { name: 'Can Tho Mekong Hub', coords: [10.0458, 105.7469], region: 'south', label: 'Can Tho', drivers: '35+' },
    { name: 'Vung Tau Port Depot', coords: [10.4044, 107.1369], region: 'south', label: 'Vung Tau', drivers: '30+' },
  ];

  const headquarters = {
    name: 'LogiFlow Headquarters & Command Center',
    address: '123 Nguyen Trai Street, District 1',
    city: 'Ho Chi Minh City',
    phone: '+84 1900-1234',
    email: 'operations@logiflow.vn',
    coords: [10.7757, 106.7009],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">Pan-Vietnam Logistics Network</Badge>}
          title="Distribution Hubs & Provincial Coverage"
          description="Direct linehaul services, cross-docking facilities, and last-mile dispatch coverage spanning all 63 provinces across Vietnam."
        />
      </div>

      {/* Interactive Leaflet Map Card */}
      <section className="container">
        <Card style={{ overflow: 'hidden', border: '1px solid var(--border-default)' }}>
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LuMapPin size={18} color="var(--color-brand-600)" />
              <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Active Freight Terminals & Hub Routing
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 'var(--text-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
                <span>Headquarters</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                <span>North Terminals</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
                <span>Central Terminals</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                <span>South Terminals</span>
              </div>
            </div>
          </div>

          <div style={{ height: '480px', width: '100%', position: 'relative' }}>
            <MapContainer
              center={[14.0583, 108.2772]}
              zoom={6}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* HQ Marker */}
              <Marker position={headquarters.coords} icon={hqIcon}>
                <Popup>
                  <div style={{ padding: '6px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-danger-600)' }}>
                      {headquarters.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {headquarters.address}, {headquarters.city}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      📞 {headquarters.phone} • ✉️ {headquarters.email}
                    </div>
                  </div>
                </Popup>
              </Marker>

              {/* City Markers */}
              {cities.map((city) => (
                <Marker
                  key={city.name}
                  position={city.coords}
                  icon={
                    city.region === 'north'
                      ? northIcon
                      : city.region === 'central'
                      ? centralIcon
                      : southIcon
                  }
                >
                  <Popup>
                    <div style={{ padding: '4px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{city.name}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--color-brand-600)', fontWeight: 600, marginTop: '2px' }}>
                        {city.region.toUpperCase()} OPERATIONAL HUB
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Active Drivers: <strong>{city.drivers}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-success-600)', marginTop: '2px' }}>
                        ✓ FTL & Express Linehaul Ready
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Card>
      </section>

      {/* Regional Operational Details */}
      <section className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* North */}
          <Card style={{ padding: '24px', borderTop: '4px solid #2563eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                Northern Corridor
              </h3>
              <Badge variant="brand" size="sm">Hanoi Gateway</Badge>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Connecting Noi Bai Airport, Dinh Vu Seaport (Hai Phong), and Bac Ninh / Hai Duong manufacturing clusters.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {['Hanoi', 'Hai Phong', 'Quang Ninh', 'Bac Ninh', 'Hai Duong', 'Nam Dinh'].map((p) => (
                <span key={p} style={{ padding: '2px 8px', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 500 }}>
                  {p}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Transit: <strong>Same-day / 24h Next-Flight</strong>
            </div>
          </Card>

          {/* Central */}
          <Card style={{ padding: '24px', borderTop: '4px solid #059669' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                Central Coast & Highlands
              </h3>
              <Badge variant="success" size="sm">Da Nang Hub</Badge>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Key cross-dock link bridging North-South linehauls with coastal fisheries, agro-commodities, and industrial ports.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {['Da Nang', 'Hue', 'Nha Trang', 'Quang Nam', 'Quang Ngai', 'Binh Dinh'].map((p) => (
                <span key={p} style={{ padding: '2px 8px', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 500 }}>
                  {p}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Transit: <strong>1–2 Business Days</strong>
            </div>
          </Card>

          {/* South */}
          <Card style={{ padding: '24px', borderTop: '4px solid #d97706' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', margin: 0 }}>
                Southern Mega Hub & Delta
              </h3>
              <Badge variant="warning" size="sm">HCMC Command</Badge>
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Cat Lai port drayage, Binh Duong / Dong Nai factory loops, and cold chain distribution across the Mekong Delta.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              {['HCMC', 'Binh Duong', 'Dong Nai', 'Can Tho', 'Vung Tau', 'Long An'].map((p) => (
                <span key={p} style={{ padding: '2px 8px', backgroundColor: 'var(--color-slate-100)', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 500 }}>
                  {p}
                </span>
              ))}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Transit: <strong>Same-day / Scheduled Multi-stop</strong>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '32px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: '0 0 4px 0' }}>
              Ship to Any Province with Verified SLAs
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Request quote schedules or review our dedicated linehaul frequency tables.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/track">
              <Button variant="primary">Track Existing Cargo</Button>
            </Link>
            <Link to="/business">
              <Button variant="outline">Enterprise Rate Sheet</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CoveragePage;
