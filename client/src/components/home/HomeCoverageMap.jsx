import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createHubPin = (label, type = 'gateway') => {
  const el = document.createElement('div');
  el.textContent = label;
  el.style.cssText = `
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
  `;
  return divIcon({
    className: 'custom-hub-pin',
    html: el.outerHTML,
    iconSize: [90, 24],
    iconAnchor: [45, 12],
    popupAnchor: [0, -12],
  });
};

const tradeLanes = {
  northSouthTrunk: [
    [21.0278, 105.8342],
    [18.6796, 105.6813],
    [16.4637, 107.5909],
    [16.0544, 108.2022],
    [13.783, 109.2197],
    [12.2388, 109.1967],
    [10.8231, 106.6297],
  ],
};

export const HomeCoverageMap = () => (
  <MapContainer
    center={[16.0544, 107.5]}
    zoom={5.2}
    style={{ height: '100%', width: '100%' }}
    scrollWheelZoom={false}
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
);

export default HomeCoverageMap;
