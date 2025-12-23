import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for drivers
const activeDriverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const inactiveDriverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Vietnam regional boundaries (approximate polygons)
const VIETNAM_REGIONS = {
  north: {
    name: 'Northern Region',
    cities: 'Hanoi, Hai Phong, Quang Ninh',
    bounds: [
      [21.5, 105.5], [22.5, 105.5], [22.5, 107.5], [21.5, 107.5]
    ],
    color: '#3b82f6',
    fillColor: '#3b82f620'
  },
  central: {
    name: 'Central Region',
    cities: 'Da Nang, Hue, Nha Trang',
    bounds: [
      [15.5, 107.5], [18.5, 107.5], [18.5, 109.5], [15.5, 109.5]
    ],
    color: '#10b981',
    fillColor: '#10b98120'
  },
  south: {
    name: 'Southern Region',
    cities: 'Ho Chi Minh, Can Tho, Vung Tau',
    bounds: [
      [10.0, 106.0], [11.5, 106.0], [11.5, 107.5], [10.0, 107.5]
    ],
    color: '#f59e0b',
    fillColor: '#f59e0b20'
  }
};

// Component to fit map bounds to Vietnam
const FitBounds = ({ bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds);
    }
  }, [map, bounds]);

  return null;
};

const AdminRegionalMap = ({ activeDrivers = [], onRegionClick }) => {
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Calculate regional statistics
  const regionalStats = React.useMemo(() => {
    const northDrivers = activeDrivers.filter(d => parseFloat(d.latitude) > 20).length;
    const centralDrivers = activeDrivers.filter(d => {
      const lat = parseFloat(d.latitude);
      return lat >= 12 && lat <= 20;
    }).length;
    const southDrivers = activeDrivers.filter(d => parseFloat(d.latitude) < 12).length;

    return {
      north: { drivers: northDrivers, deliveries: Math.floor(northDrivers * 2.3) },
      central: { drivers: centralDrivers, deliveries: Math.floor(centralDrivers * 1.8) },
      south: { drivers: southDrivers, deliveries: Math.floor(southDrivers * 2.1) }
    };
  }, [activeDrivers]);

  const handleRegionClick = (regionKey) => {
    setSelectedRegion(regionKey);
    if (onRegionClick) {
      onRegionClick(regionKey, regionalStats[regionKey]);
    }
  };

  // Vietnam bounds for initial view
  const vietnamBounds = [[8.5, 102.1], [23.4, 109.5]];

  return (
    <div style={{ height: '500px', width: '100%', position: 'relative' }}>
      <MapContainer
        center={[15.8, 107.0]}
        zoom={6}
        style={{ height: '100%', width: '100%', borderRadius: '8px' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Regional polygons */}
        {Object.entries(VIETNAM_REGIONS).map(([key, region]) => (
          <Polygon
            key={key}
            positions={region.bounds}
            pathOptions={{
              color: region.color,
              fillColor: region.fillColor,
              fillOpacity: selectedRegion === key ? 0.4 : 0.2,
              weight: selectedRegion === key ? 3 : 2
            }}
            eventHandlers={{
              click: () => handleRegionClick(key),
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  fillOpacity: 0.4,
                  weight: 3
                });
              },
              mouseout: (e) => {
                const layer = e.target;
                layer.setStyle({
                  fillOpacity: selectedRegion === key ? 0.4 : 0.2,
                  weight: selectedRegion === key ? 3 : 2
                });
              }
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 8px 0', color: region.color }}>
                  {region.name}
                </h3>
                <div style={{ fontSize: '13px', color: '#666' }}>
                  {region.cities}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Active Drivers:</span>
                    <strong>{regionalStats[key]?.drivers || 0}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Current Deliveries:</span>
                    <strong>{regionalStats[key]?.deliveries || 0}</strong>
                  </div>
                </div>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Driver markers */}
        {activeDrivers.map((driver) => {
          const lat = parseFloat(driver.latitude);
          const lng = parseFloat(driver.longitude);
          const isValidCoords = !isNaN(lat) && !isNaN(lng) && lat >= 8 && lat <= 24 && lng >= 102 && lng <= 110;

          if (!isValidCoords) return null;

          return (
            <Marker
              key={`${driver.driverId}-${driver.tripId}`}
              position={[lat, lng]}
              icon={driver.tripStatus === 'in_progress' ? activeDriverIcon : inactiveDriverIcon}
            >
              <Popup>
                <div style={{ minWidth: '220px' }}>
                  <h4 style={{ margin: '0 0 8px 0' }}>
                    👤 {driver.driverName}
                  </h4>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                    📞 {driver.driverPhone || 'No phone'}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Trip:</span>
                      <strong>#{driver.tripId}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Status:</span>
                      <span style={{
                        backgroundColor: driver.tripStatus === 'in_progress' ? '#dcfce7' : '#f3f4f6',
                        color: driver.tripStatus === 'in_progress' ? '#166534' : '#374151',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {driver.tripStatus?.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span>Vehicle:</span>
                      <strong>{driver.vehiclePlate || 'N/A'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Route:</span>
                      <strong>{driver.routeName || 'N/A'}</strong>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                    📍 {lat.toFixed(6)}, {lng.toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <FitBounds bounds={vietnamBounds} />
      </MapContainer>

      {/* Legend */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'white',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontSize: '12px',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: '600', marginBottom: '8px' }}>🗺️ Legend</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
            <span>Northern Region</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
            <span>Central Region</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'column', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: '#f59e0b', borderRadius: '2px' }}></div>
            <span>Southern Region</span>
          </div>
          <div style={{ borderTop: '1px solid #eee', margin: '4px 0', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png"
                   style={{ width: '16px', height: '16px' }} alt="active" />
              <span>Active Driver</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png"
                   style={{ width: '16px', height: '16px' }} alt="inactive" />
              <span>Inactive Driver</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegionalMap;
