import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { divIcon } from 'leaflet';
import { Card, Badge } from '@/components/ui';

const VIETNAM_REGIONS = {
  north: {
    name: 'Northern Corridors',
    cities: 'Hanoi, Hai Phong, Quang Ninh',
    bounds: [
      [21.0, 105.0],
      [23.5, 105.0],
      [23.5, 108.0],
      [21.0, 108.0],
    ],
    center: [21.5, 105.8],
  },
  central: {
    name: 'Central Coastline',
    cities: 'Da Nang, Hue, Nha Trang',
    bounds: [
      [14.0, 107.0],
      [19.0, 107.0],
      [19.0, 110.0],
      [14.0, 110.0],
    ],
    center: [16.0, 108.2],
  },
  south: {
    name: 'Southern Commercial Hub',
    cities: 'Ho Chi Minh City, Can Tho, Vung Tau',
    bounds: [
      [8.5, 104.5],
      [12.0, 104.5],
      [12.0, 107.5],
      [8.5, 107.5],
    ],
    center: [10.8, 106.6],
  },
};

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 6, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

const createDotMarker = (color) =>
  divIcon({
    html: `<div style="
      background-color: ${color};
      width: 14px;
      height: 14px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    "></div>`,
    className: '',
    iconSize: [14, 14],
  });

export const AdminRegionalMap = ({ activeDrivers = [], activeTrips = [], onRegionClick }) => {
  const [mapView, setMapView] = useState({ center: [16.0471, 108.2068], zoom: 6 });

  const stats = useMemo(() => {
    const counts = { north: 0, central: 0, south: 0, total: activeDrivers.length };
    activeDrivers.forEach((d) => {
      const lat = parseFloat(d.latitude);
      if (lat > 20) counts.north++;
      else if (lat >= 13) counts.central++;
      else counts.south++;
    });
    return counts;
  }, [activeDrivers]);

  const handleRegionSelect = (key) => {
    setMapView({ center: VIETNAM_REGIONS[key].center, zoom: 7 });
    if (onRegionClick) onRegionClick(key, VIETNAM_REGIONS[key]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Regional Quick Pill Selectors */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        <button
          onClick={() => setMapView({ center: [16.0471, 108.2068], zoom: 6 })}
          style={{
            padding: '12px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Nationwide
          </span>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {stats.total} Drivers
          </div>
        </button>

        <button
          onClick={() => handleRegionSelect('north')}
          style={{
            padding: '12px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--color-brand-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            North Hub
          </span>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {stats.north} Active
          </div>
        </button>

        <button
          onClick={() => handleRegionSelect('central')}
          style={{
            padding: '12px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--color-success-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            Central Corridor
          </span>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {stats.central} Active
          </div>
        </button>

        <button
          onClick={() => handleRegionSelect('south')}
          style={{
            padding: '12px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--color-warning-600)', textTransform: 'uppercase', fontWeight: 600 }}>
            South Commercial
          </span>
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
            {stats.south} Active
          </div>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '16px', height: '480px' }}>
        {/* Active Fleet Sidebar */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Active Carrier Telemetry
          </div>

          {activeDrivers.slice(0, 15).map((driver) => (
            <div
              key={driver.driverId}
              onClick={() => setMapView({ center: [driver.latitude, driver.longitude], zoom: 11 })}
              style={{
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-surface-subtle)',
                cursor: 'pointer',
                transition: 'background var(--transition-fast)',
              }}
            >
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {driver.driverName}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {driver.vehiclePlate} • {driver.tripStatus}
              </div>
            </div>
          ))}
          {activeDrivers.length === 0 && (
            <div style={{ textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '24px' }}>
              No vehicles currently transmitting GPS telemetry.
            </div>
          )}
        </div>

        {/* Map */}
        <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-default)', position: 'relative' }}>
          <MapContainer center={mapView.center} zoom={mapView.zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController center={mapView.center} zoom={mapView.zoom} />

            {activeDrivers.map((driver) => {
              const driverTrip = activeTrips.find(
                (trip) => trip.driver && trip.driver.name === driver.driverName
              );

              return (
                <Marker
                  key={driver.driverId}
                  position={[driver.latitude, driver.longitude]}
                  icon={createDotMarker(driver.tripStatus === 'in_progress' ? '#059669' : '#2563eb')}
                >
                  <Popup>
                    <div style={{ padding: '6px', minWidth: '200px' }}>
                      <strong style={{ fontSize: '13px' }}>{driver.driverName}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Vehicle: {driver.vehiclePlate}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Status: <strong>{driver.tripStatus}</strong>
                      </div>
                      {driverTrip && (
                        <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-default)', fontSize: '11px' }}>
                          <div>Trip #{driverTrip.tripId}</div>
                          <div>{driverTrip.originCity} → {driverTrip.destinationCity}</div>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminRegionalMap;
