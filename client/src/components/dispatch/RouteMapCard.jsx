import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { dispatchRouteService } from '../../services';

// Fix default Leaflet icons in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const haversineDistanceKm = (a, b) => {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

const calculatePathDistance = (path = []) => {
  if (!Array.isArray(path) || path.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < path.length; i += 1) {
    total += haversineDistanceKm(path[i - 1], path[i]);
  }
  return total;
};

const buildOsrmUrl = (coords) => {
  const coordString = coords.map((c) => `${c[1]},${c[0]}`).join(';');
  return `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
};

const RouteMapCard = ({ routeId, feePerKm = 12, onDistanceChange }) => {
  const [route, setRoute] = useState(null);
  const [path, setPath] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingPath, setLoadingPath] = useState(false);

  const formatMoney = (amount) => {
    if (amount == null) return '—';
    try {
      return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
    } catch (e) {
      return `${amount} USD`;
    }
  };

  const mapCenter = useMemo(() => {
    if (route?.originLat && route?.originLng) {
      return [Number(route.originLat), Number(route.originLng)];
    }
    return [16.0471, 108.2068];
  }, [route]);

  const feeEstimate = useMemo(() => {
    if (distanceKm == null) return null;
    return Math.round(distanceKm * feePerKm);
  }, [distanceKm, feePerKm]);

  useEffect(() => {
    if (onDistanceChange) {
      onDistanceChange(distanceKm, feeEstimate);
    }
  }, [distanceKm, feeEstimate, onDistanceChange]);

  const loadRoute = useCallback(async (id) => {
    if (!id) {
      setRoute(null);
      setPath([]);
      setDistanceKm(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await dispatchRouteService.getRouteById(Number(id));
      setRoute(data);
    } catch (err) {
      console.error('Failed to load route', err);
      const status = err?.response?.status;
      if (status === 403) {
        setError('Không có quyền lấy route này (403).');
      } else if (status === 404) {
        setError('Route không tồn tại (404).');
      } else {
        setError('Không tải được route. Kiểm tra Route ID hoặc quyền truy cập.');
      }
      setRoute(null);
      setPath([]);
      setDistanceKm(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPathFromRoute = useCallback(async (currentRoute) => {
    if (!currentRoute?.originLat || !currentRoute?.destinationLat) {
      setPath([]);
      setDistanceKm(null);
      return;
    }

    const coords = [
      [Number(currentRoute.originLat), Number(currentRoute.originLng)],
      [Number(currentRoute.destinationLat), Number(currentRoute.destinationLng)],
    ];

    if (coords.length < 2) return;

    setLoadingPath(true);
    try {
      const url = buildOsrmUrl(coords);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (data.code === 'Ok' && data.routes?.length) {
        const geo = data.routes[0].geometry.coordinates.map((c) => [c[1], c[0]]);
        setPath(geo);
        const km = calculatePathDistance(geo);
        setDistanceKm(Number(km.toFixed(2)));
      } else {
        setPath(coords);
        setDistanceKm(Number(calculatePathDistance(coords).toFixed(2)));
      }
    } catch (err) {
      console.error('OSRM fetch failed', err);
      setPath(coords);
      setDistanceKm(Number(calculatePathDistance(coords).toFixed(2)));
    } finally {
      setLoadingPath(false);
    }
  }, []);

  useEffect(() => {
    loadRoute(routeId);
  }, [loadRoute, routeId]);

  useEffect(() => {
    if (route) {
      fetchPathFromRoute(route);
    }
  }, [route, fetchPathFromRoute]);

  return (
    <div className="detail-card" style={{ marginTop: '1rem' }}>
      <div className="card-header" style={{ alignItems: 'center' }}>
        <div>
          <h2 className="card-title">Đường đi & ước tính</h2>
          <p className="page-subtitle" style={{ margin: 0 }}>Chọn Route ID để xem tuyến.</p>
        </div>
        {distanceKm != null && (
          <div className="badge" style={{ backgroundColor: '#0ea5e9' }}>
            {distanceKm} km
          </div>
        )}
      </div>

      {error && <div className="error" style={{ marginBottom: '0.5rem' }}>{error}</div>}
      {loading && <div>Đang tải route...</div>}

      <div style={{ height: '320px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
        <MapContainer center={mapCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {route && (
            <>
              <Marker position={[Number(route.originLat), Number(route.originLng)]} icon={originIcon} />
              <Marker position={[Number(route.destinationLat), Number(route.destinationLng)]} icon={destinationIcon} />
            </>
          )}
          {path.length > 1 && (
            <Polyline positions={path} color="#0ea5e9" weight={4} opacity={0.9} />
          )}
        </MapContainer>
      </div>
    </div>
  );
};

export default RouteMapCard;
