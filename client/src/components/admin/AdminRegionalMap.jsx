import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Clean modern colors
const COLORS = {
  north: '#3b82f6', // Blue
  central: '#10b981', // Emerald
  south: '#f59e0b', // Amber
  bg: '#f8fafc',
  card: '#ffffff'
};

const VIETNAM_REGIONS = {
  north: {
    name: 'Northern Region',
    cities: 'Hanoi, Hai Phong, Quang Ninh',
    bounds: [[21.0, 105.0], [23.5, 105.0], [23.5, 108.0], [21.0, 108.0]],
    center: [21.5, 105.8]
  },
  central: {
    name: 'Central Region',
    cities: 'Da Nang, Hue, Nha Trang',
    bounds: [[14.0, 107.0], [19.0, 107.0], [19.0, 110.0], [14.0, 110.0]],
    center: [16.0, 108.2]
  },
  south: {
    name: 'Southern Region',
    cities: 'HCM City, Can Tho, Vung Tau',
    bounds: [[8.5, 104.5], [12.0, 104.5], [12.0, 107.5], [8.5, 107.5]],
    center: [10.8, 106.6]
  }
};

// Component to handle map view animations
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 7, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
};

const AdminRegionalMap = ({ activeDrivers = [], activeTrips = [], onRegionClick }) => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [mapView, setMapView] = useState({ center: [15.8, 107.0], zoom: 6 });

  const stats = useMemo(() => {
    const counts = { north: 0, central: 0, south: 0, total: activeDrivers.length };
    activeDrivers.forEach(d => {
      const lat = parseFloat(d.latitude);
      if (lat > 20) counts.north++;
      else if (lat >= 13) counts.central++;
      else counts.south++;
    });
    return counts;
  }, [activeDrivers]);

  const handleRegionSelect = (key) => {
    setSelectedRegion(key);
    setMapView({ center: VIETNAM_REGIONS[key].center, zoom: 7 });
    if (onRegionClick) onRegionClick(key, VIETNAM_REGIONS[key]);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '20px', 
      fontFamily: 'Inter, system-ui, sans-serif',
      backgroundColor: COLORS.bg,
      padding: '20px',
      borderRadius: '16px'
    }}>
      
      {/* Header Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
        <StatCard title="Total Drivers" value={stats.total} color="#64748b" />
        <StatCard title="North" value={stats.north} color={COLORS.north} onClick={() => handleRegionSelect('north')} />
        <StatCard title="Central" value={stats.central} color={COLORS.central} onClick={() => handleRegionSelect('central')} />
        <StatCard title="South" value={stats.south} color={COLORS.south} onClick={() => handleRegionSelect('south')} />
      </div>

      <div style={{ display: 'flex', gap: '20px', height: '600px' }}>
        
        {/* Sidebar List */}
        <div style={{ 
          width: '300px', 
          backgroundColor: COLORS.card, 
          borderRadius: '12px', 
          padding: '15px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          overflowY: 'auto'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '15px' }}>Active Fleet</h3>
          {activeDrivers.slice(0, 10).map((driver) => (
            <div 
              key={driver.driverId} 
              style={{ 
                padding: '10px', 
                borderBottom: '1px solid #f1f5f9', 
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
              onMouseEnter={() => setMapView({ center: [driver.latitude, driver.longitude], zoom: 10 })}
            >
              <div style={{ fontWeight: '600', fontSize: '13px' }}>{driver.driverName}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{driver.vehiclePlate} • {driver.tripStatus}</div>
            </div>
          ))}
          <div style={{ padding: '10px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
            Showing {Math.min(activeDrivers.length, 10)} of {activeDrivers.length}
          </div>
        </div>

        {/* Map Container */}
        <div style={{ flex: 1, position: 'relative', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}>
          <MapContainer
            center={mapView.center}
            zoom={mapView.zoom}
            style={{ height: '100%', width: '100%' }}
          >
            {/* Using CartoDB Positron for a modern "Light" look */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OpenStreetMap'
            />

            <MapController center={mapView.center} zoom={mapView.zoom} />

            {Object.entries(VIETNAM_REGIONS).map(([key, region]) => (
              <Polygon
                key={key}
                positions={region.bounds}
                pathOptions={{
                  color: 'transparent',
                  fillColor: 'transparent',
                  fillOpacity: 0,
                  weight: 0,
                  dashArray: '0'
                }}
                eventHandlers={{
                  click: () => setSelectedRegion(key)
                }}
              >
                <Popup>
                  <div style={{ padding: '5px' }}>
                    <strong style={{ color: COLORS[key] }}>{region.name}</strong><br/>
                    <span style={{ fontSize: '11px' }}>{region.cities}</span>
                  </div>
                </Popup>
              </Polygon>
            ))}

            {activeDrivers.map((driver) => {
              // Find the corresponding trip for this driver
              const driverTrip = activeTrips.find(trip =>
                trip.driver && trip.driver.name === driver.driverName
              );

              return (
                <Marker
                  key={driver.driverId}
                  position={[driver.latitude, driver.longitude]}
                  icon={createCustomIcon(driver.tripStatus === 'in_progress' ? COLORS.central : '#94a3b8')}
                >
                  <Popup>
                    <DriverPopup driver={driver} trip={driverTrip} />
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Floating Legend */}
          <div style={{
            position: 'absolute', bottom: '20px', right: '20px', zIndex: 1000,
            backgroundColor: 'rgba(255,255,255,0.9)', padding: '12px', borderRadius: '8px',
            fontSize: '11px', backdropFilter: 'blur(4px)', border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>STATUS</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS.central }}></span> Moving
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></span> Idle
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components for cleaner code
const StatCard = ({ title, value, color, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      backgroundColor: COLORS.card, padding: '15px', borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)', borderLeft: `4px solid ${color}`,
      cursor: onClick ? 'pointer' : 'default'
    }}
  >
    <div style={{ color: '#64748b', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase' }}>{title}</div>
    <div style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b' }}>{value}</div>
  </div>
);

const DriverPopup = ({ driver, trip }) => (
  <div style={{ minWidth: '250px', padding: '8px', maxWidth: '300px' }}>
    <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', borderBottom: '1px solid #e5e7eb', paddingBottom: '5px' }}>
      {driver.driverName}
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#64748b' }}>Plate:</span>
        <span>{driver.vehiclePlate}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ color: '#64748b' }}>Status:</span>
        <span style={{
          color: driver.tripStatus === 'in_progress' ? '#059669' : '#475569',
          fontWeight: 'bold'
        }}>{driver.tripStatus?.replace('_', ' ')}</span>
      </div>

      {trip && (
        <>
          <div style={{ borderTop: '1px solid #e5e7eb', margin: '8px 0', paddingTop: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#374151', marginBottom: '5px' }}>
              Trip #{trip.tripId}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ color: '#64748b' }}>Route:</span>
              <span style={{ fontSize: '11px' }}>{trip.originCity} → {trip.destinationCity}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ color: '#64748b' }}>ETA:</span>
              <span style={{ fontSize: '11px' }}>
                {trip.eta ? new Date(trip.eta).toLocaleTimeString() : 'N/A'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
              <span style={{ color: '#64748b' }}>Orders:</span>
              <span style={{ fontSize: '11px' }}>{trip.orders?.length || 0} items</span>
            </div>
            {trip.delayReason && (
              <div style={{ marginTop: '5px', padding: '3px', backgroundColor: '#fef2f2', borderRadius: '3px', border: '1px solid #fecaca' }}>
                <span style={{ color: '#dc2626', fontSize: '10px', fontWeight: 'bold' }}>
                  🚨 {trip.delayReason}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  </div>
);

// Helper to create a more modern Marker (Dot style)
const createCustomIcon = (color) => L.divIcon({
  html: `<div style="
    background-color: ${color};
    width: 12px;
    height: 12px;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 0 4px rgba(0,0,0,0.3);
  "></div>`,
  className: '',
  iconSize: [12, 12],
});

export default AdminRegionalMap;
