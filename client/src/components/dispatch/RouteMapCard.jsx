import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { divIcon, latLngBounds } from 'leaflet';
import { dispatchRouteService } from '../../services';
import { apiBaseUrl } from '../../config/env';
import { Card, Badge, Alert } from '@/components/ui';
import { LuMapPin, LuNavigation, LuCreditCard } from 'react-icons/lu';

// Vietnam boundaries
const VIETNAM_BOUNDS = {
  minLat: 8.5,
  maxLat: 23.4,
  minLng: 102.1,
  maxLng: 109.5,
};

const isInVietnam = (lat, lng) => {
  const numLat = Number(lat);
  const numLng = Number(lng);
  return (
    numLat >= VIETNAM_BOUNDS.minLat &&
    numLat <= VIETNAM_BOUNDS.maxLat &&
    numLng >= VIETNAM_BOUNDS.minLng &&
    numLng <= VIETNAM_BOUNDS.maxLng
  );
};

const createMapPin = (color, label) =>
  divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background-color: ${color};
        color: white;
        border: 2px solid white;
        border-radius: 9999px;
        padding: 2px 8px;
        font-size: 11px;
        font-weight: 700;
        font-family: Inter, sans-serif;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);
        white-space: nowrap;
      ">
        ${label}
      </div>
    `,
    iconSize: [60, 24],
    iconAnchor: [30, 12],
    popupAnchor: [0, -12],
  });

const haversineDistanceKm = (a, b) => {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
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

const getVietnameseWaypoints = (originLat, originLng, destLat, destLng) => {
  const waypoints = [{ lat: originLat, lng: originLng }];
  const distance = Math.sqrt(
    Math.pow(destLat - originLat, 2) + Math.pow(destLng - originLng, 2)
  );

  if (distance > 5) {
    const vnWaypoints = [
      { name: 'Thanh Hoa', lat: 19.8067, lng: 105.7851 },
      { name: 'Vinh', lat: 18.6793, lng: 105.6811 },
      { name: 'Dong Hoi', lat: 17.4833, lng: 106.6 },
      { name: 'Hue', lat: 16.4637, lng: 107.5909 },
      { name: 'Da Nang', lat: 16.0544, lng: 108.2022 },
      { name: 'Quang Ngai', lat: 15.1214, lng: 108.8044 },
      { name: 'Quy Nhon', lat: 13.7829, lng: 109.2196 },
      { name: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
      { name: 'Phan Thiet', lat: 10.928, lng: 108.102 },
    ];

    const minLat = Math.min(originLat, destLat);
    const maxLat = Math.max(originLat, destLat);

    vnWaypoints.forEach((wp) => {
      if (wp.lat > minLat && wp.lat < maxLat) {
        waypoints.push({ lat: wp.lat, lng: wp.lng });
      }
    });

    waypoints.sort((a, b) => (originLat > destLat ? b.lat - a.lat : a.lat - b.lat));
  }

  waypoints.push({ lat: destLat, lng: destLng });
  return waypoints;
};

const getOSRMRoute = async (originLng, originLat, destLng, destLat) => {
  try {
    const waypoints = getVietnameseWaypoints(originLat, originLng, destLat, destLng);
    const coordsString = waypoints.map((wp) => `${wp.lng},${wp.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const coordinates = data.routes[0].geometry.coordinates;
      return coordinates.map((coord) => [coord[1], coord[0]]);
    }
    return null;
  } catch {
    return null;
  }
};

const FitBounds = ({ path, route, points }) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (points && points.length > 0) {
      const bounds = latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], animate: false });
    } else if (path && path.length > 1) {
      const bounds = latLngBounds(path);
      map.fitBounds(bounds, { padding: [50, 50], animate: false });
    } else if (route?.originLat && route?.destinationLat) {
      const bounds = latLngBounds([
        [Number(route.originLat), Number(route.originLng)],
        [Number(route.destinationLat), Number(route.destinationLng)],
      ]);
      map.fitBounds(bounds, { padding: [50, 50], animate: false });
    }
  }, [map, path, route, points]);

  return null;
};

export const RouteMapCard = ({ routeId, orders, feePerKm = 12, onDistanceChange }) => {
  const [route, setRoute] = useState(null);
  const [path, setPath] = useState([]);
  const [distanceKm, setDistanceKm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingPath, setLoadingPath] = useState(false);

  const tripData = useMemo(() => {
    if (!orders || orders.length === 0) return null;

    const pickupPoints = [];
    const deliveryPoints = [];
    let totalDistance = 0;

    orders.forEach((order) => {
      if (order.pickupLat && order.pickupLng) {
        pickupPoints.push({
          id: `pickup-${order.orderId}`,
          lat: Number(order.pickupLat),
          lng: Number(order.pickupLng),
          address: order.pickupAddress,
          orderId: order.orderId,
          customerName: order.customerName,
          type: 'pickup',
        });
      }
      if (order.deliveryLat && order.deliveryLng) {
        deliveryPoints.push({
          id: `delivery-${order.orderId}`,
          lat: Number(order.deliveryLat),
          lng: Number(order.deliveryLng),
          address: order.deliveryAddress,
          orderId: order.orderId,
          customerName: order.customerName,
          type: 'delivery',
        });
      }
      if (order.distanceKm) {
        totalDistance += Number(order.distanceKm);
      }
    });

    const routeSegments = [];
    const sortedOrders = [...orders].sort((a, b) => a.orderId - b.orderId);

    sortedOrders.forEach((order, index) => {
      if (order.pickupLat && order.pickupLng && order.deliveryLat && order.deliveryLng) {
        if (index === 0) {
          routeSegments.push([
            [Number(order.pickupLat), Number(order.pickupLng)],
            [Number(order.deliveryLat), Number(order.deliveryLng)],
          ]);
        } else {
          const prevOrder = sortedOrders[index - 1];
          routeSegments.push([
            [Number(prevOrder.deliveryLat), Number(prevOrder.deliveryLng)],
            [Number(order.pickupLat), Number(order.pickupLng)],
            [Number(order.deliveryLat), Number(order.deliveryLng)],
          ]);
        }
      }
    });

    return {
      points: [...pickupPoints, ...deliveryPoints],
      routeSegments,
      totalDistance,
      orderCount: orders.length,
    };
  }, [orders]);

  const mapCenter = useMemo(() => {
    if (tripData?.points && tripData.points.length > 0) {
      const lats = tripData.points.map((p) => p.lat);
      const lngs = tripData.points.map((p) => p.lng);
      return [lats.reduce((a, b) => a + b, 0) / lats.length, lngs.reduce((a, b) => a + b, 0) / lngs.length];
    } else if (route?.originLat && route?.originLng) {
      return [Number(route.originLat), Number(route.originLng)];
    }
    return [16.0471, 108.2068];
  }, [route, tripData]);

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
      const originInVietnam = isInVietnam(data.originLat, data.originLng);
      const destInVietnam = isInVietnam(data.destinationLat, data.destinationLng);

      if (!originInVietnam || !destInVietnam) {
        setError('Route coordinates are outside supported domestic Vietnam corridors.');
        setRoute(null);
        setPath([]);
        setDistanceKm(null);
        return;
      }

      setRoute(data);
    } catch {
      setError('Unable to load route geometry.');
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
    const straightLineDistance = calculatePathDistance(coords);

    setLoadingPath(true);
    try {
      const osrm = await getOSRMRoute(
        Number(currentRoute.originLng),
        Number(currentRoute.originLat),
        Number(currentRoute.destinationLng),
        Number(currentRoute.destinationLat)
      );

      if (osrm && osrm.length > 1) {
        const allInVn = osrm.every((pt) => isInVietnam(pt[0], pt[1]));
        if (allInVn) {
          const d = calculatePathDistance(osrm);
          setPath(osrm);
          setDistanceKm(Number(d.toFixed(2)));
        } else {
          setPath(coords);
          setDistanceKm(Number(straightLineDistance.toFixed(2)));
        }
      } else {
        setPath(coords);
        setDistanceKm(Number(straightLineDistance.toFixed(2)));
      }
    } catch {
      setPath(coords);
      setDistanceKm(Number(straightLineDistance.toFixed(2)));
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
    <Card style={{ overflow: 'hidden', border: '1px solid var(--border-default)' }}>
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-default)',
          backgroundColor: 'var(--bg-surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LuNavigation size={18} color="var(--color-brand-600)" />
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Corridor Road Routing
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Live telemetry polyline visualization
            </div>
          </div>
        </div>

        {distanceKm != null && (
          <Badge variant="brand" size="md">
            {distanceKm} km
          </Badge>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 20px' }}>
          <Alert variant="warning">{error}</Alert>
        </div>
      )}

      <div style={{ height: '400px', width: '100%', position: 'relative' }}>
        <MapContainer center={mapCenter} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            subdomains={['a', 'b', 'c']}
            maxZoom={19}
            minZoom={4}
            keepBuffer={8}
            updateWhenZooming={true}
            updateWhenIdle={false}
            crossOrigin="anonymous"
            eventHandlers={{
              tileerror: (error) => {
                if (error.tile && !error.tile._retried) {
                  error.tile._retried = true;
                  const currentSrc = error.tile.src;
                  setTimeout(() => {
                    error.tile.src = currentSrc;
                  }, 600);
                }
              }
            }}
          />

          {/* Multiple Orders */}
          {tripData?.points &&
            tripData.points.map((point) => (
              <Marker
                key={point.id}
                position={[point.lat, point.lng]}
                icon={createMapPin(point.type === 'pickup' ? '#2563eb' : '#059669', point.type === 'pickup' ? `P#${point.orderId}` : `D#${point.orderId}`)}
              >
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <strong style={{ fontSize: '12px' }}>
                      Order #{point.orderId} ({point.type.toUpperCase()})
                    </strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {point.customerName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {point.address}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Single Route for Backward Compatibility */}
          {route && !tripData && (
            <>
              <Marker
                position={[Number(route.originLat), Number(route.originLng)]}
                icon={createMapPin('#2563eb', 'Origin')}
              >
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <strong>{route.routeName} (Origin)</strong>
                    <p style={{ fontSize: '11px', margin: '4px 0 0 0' }}>{route.originAddress}</p>
                  </div>
                </Popup>
              </Marker>
              <Marker
                position={[Number(route.destinationLat), Number(route.destinationLng)]}
                icon={createMapPin('#059669', 'Destination')}
              >
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <strong>{route.routeName} (Destination)</strong>
                    <p style={{ fontSize: '11px', margin: '4px 0 0 0' }}>{route.destinationAddress}</p>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Polylines */}
          {tripData?.routeSegments &&
            tripData.routeSegments.map((segment, index) => (
              <Polyline
                key={`segment-${index}`}
                positions={segment}
                color={index % 2 === 0 ? '#2563eb' : '#059669'}
                weight={3}
                opacity={0.8}
              />
            ))}

          {path.length > 1 && !tripData && (
            <Polyline positions={path} color="#2563eb" weight={4} opacity={0.85} />
          )}

          <FitBounds path={path} route={route} points={tripData?.points} />
        </MapContainer>
      </div>
    </Card>
  );
};

export default RouteMapCard;
