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

const hqIcon = createPinIcon('#dc2626', 'HCMC Sample');
const northIcon = createPinIcon('#2563eb', 'North Sample');
const centralIcon = createPinIcon('#059669', 'Central Sample');
const southIcon = createPinIcon('#d97706', 'South Sample');

export const CoveragePage = () => {
  const cities = [
    { name: 'Hanoi Sample Marker', coords: [21.0278, 105.8342], region: 'north', label: 'Hanoi', drivers: 'Sample data' },
    { name: 'Hai Phong Sample Marker', coords: [20.846, 106.6881], region: 'north', label: 'Hai Phong', drivers: 'Sample data' },
    { name: 'Quang Ninh Sample Marker', coords: [20.9718, 107.0417], region: 'north', label: 'Quang Ninh', drivers: 'Sample data' },
    { name: 'Da Nang Sample Marker', coords: [16.0544, 108.2022], region: 'central', label: 'Da Nang', drivers: 'Sample data' },
    { name: 'Hue Sample Marker', coords: [16.4619, 107.595], region: 'central', label: 'Hue', drivers: 'Sample data' },
    { name: 'Nha Trang Sample Marker', coords: [12.2388, 109.1967], region: 'central', label: 'Nha Trang', drivers: 'Sample data' },
    { name: 'HCMC Sample Marker', coords: [10.8231, 106.6297], region: 'south', label: 'HCMC', drivers: 'Sample data' },
    { name: 'Can Tho Sample Marker', coords: [10.0458, 105.7469], region: 'south', label: 'Can Tho', drivers: 'Sample data' },
    { name: 'Vung Tau Sample Marker', coords: [10.4044, 107.1369], region: 'south', label: 'Vung Tau', drivers: 'Sample data' },
  ];

  const headquarters = {
    name: 'Sample Ho Chi Minh City Marker',
    address: 'Demonstration location',
    city: 'Ho Chi Minh City',
    phone: 'No live phone',
    email: 'No live email',
    coords: [10.7757, 106.7009],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', padding: '36px 0 64px 0' }}>
      <div className="container">
        <PageHeader
          badge={<Badge variant="brand">Sample Map</Badge>}
          title="Representative Routes and Locations"
          description="These markers demonstrate the mapping interface and do not represent owned facilities, active drivers, or service coverage."
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
                Demonstration Locations
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 'var(--text-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
                <span>Sample primary marker</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                <span>North samples</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
                <span>Central samples</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }} />
                <span>South samples</span>
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
                        {city.region.toUpperCase()} SAMPLE MARKER
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Driver count: <strong>{city.drivers}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-success-600)', marginTop: '2px' }}>
                        Representative logistics location
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
              Scenario: <strong>sample northern route</strong>
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
              Scenario: <strong>sample central route</strong>
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
              Scenario: <strong>sample southern route</strong>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', padding: '32px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', margin: '0 0 4px 0' }}>
              Explore the Tracking Demonstration
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
              Use sample records to review the map and shipment status interfaces.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/track">
              <Button variant="primary">Open Tracking Demo</Button>
            </Link>
            <Link to="/business">
              <Button variant="outline">View Project Workflows</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CoveragePage;
