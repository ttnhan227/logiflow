import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { dispatchRouteService } from '../../services';

// Vietnam boundaries (approximate)
const VIETNAM_BOUNDS = {
    minLat: 8.5,
    maxLat: 23.4,
    minLng: 102.1,
    maxLng: 109.5
};

const isInVietnam = (lat, lng) => {
    const numLat = Number(lat);
    const numLng = Number(lng);
    return numLat >= VIETNAM_BOUNDS.minLat &&
        numLat <= VIETNAM_BOUNDS.maxLat &&
        numLng >= VIETNAM_BOUNDS.minLng &&
        numLng <= VIETNAM_BOUNDS.maxLng;
};

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

const buildServerDirectionsUrl = (coords, profile = 'truck') => {
    const [a, b] = coords;
    const params = new URLSearchParams({
        originLat: String(a[0]),
        originLng: String(a[1]),
        destLat: String(b[0]),
        destLng: String(b[1]),
        includeGeometry: 'true',
        profile,
    });
    return `http://localhost:8080/api/maps/directions?${params.toString()}`;
};

// Get OSRM route (same as admin page)
const getOSRMRoute = async (originLng, originLat, destLng, destLat) => {
    try {
        // Add intermediate waypoints for long-distance routes
        const waypoints = getVietnameseWaypoints(originLat, originLng, destLat, destLng);

        // Build coordinates string with waypoints
        const coordsString = waypoints.map(wp => `${wp.lng},${wp.lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const coordinates = data.routes[0].geometry.coordinates;
            // Convert from [lng, lat] to [lat, lng] for Leaflet
            return coordinates.map(coord => [coord[1], coord[0]]);
        }
        return null;
    } catch (err) {
        if (err.name === 'AbortError') {
            console.warn('OSRM request timed out');
        } else {
            console.error('OSRM routing error:', err);
        }
        return null;
    }
};

// Helper to add waypoints for long routes
const getVietnameseWaypoints = (originLat, originLng, destLat, destLng) => {
    const waypoints = [{ lat: originLat, lng: originLng }];

    // Calculate distance to determine if we need intermediate waypoints
    const distance = Math.sqrt(
        Math.pow(destLat - originLat, 2) + Math.pow(destLng - originLng, 2)
    );

    // For long routes (> 5 degrees, roughly > 550km), add waypoints along Vietnam's coast
    if (distance > 5) {
        const vnWaypoints = [
            { name: 'Thanh Hoa', lat: 19.8067, lng: 105.7851 },
            { name: 'Vinh', lat: 18.6793, lng: 105.6811 },
            { name: 'Dong Hoi', lat: 17.4833, lng: 106.6000 },
            { name: 'Hue', lat: 16.4637, lng: 107.5909 },
            { name: 'Da Nang', lat: 16.0544, lng: 108.2022 },
            { name: 'Quang Ngai', lat: 15.1214, lng: 108.8044 },
            { name: 'Quy Nhon', lat: 13.7829, lng: 109.2196 },
            { name: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
            { name: 'Phan Thiet', lat: 10.9280, lng: 108.1020 },
        ];

        // Add waypoints that are between origin and destination
        const minLat = Math.min(originLat, destLat);
        const maxLat = Math.max(originLat, destLat);

        vnWaypoints.forEach(wp => {
            if (wp.lat > minLat && wp.lat < maxLat) {
                waypoints.push({ lat: wp.lat, lng: wp.lng });
            }
        });

        // Sort waypoints by latitude
        waypoints.sort((a, b) => {
            return originLat > destLat ? b.lat - a.lat : a.lat - b.lat;
        });
    }

    waypoints.push({ lat: destLat, lng: destLng });
    return waypoints;
};

// Component to auto-fit map bounds to show entire route
const FitBounds = ({ path, route }) => {
    const map = useMap();

    useEffect(() => {
        if (path && path.length > 1) {
            const bounds = L.latLngBounds(path);
            map.fitBounds(bounds, { padding: [50, 50] });
        } else if (route?.originLat && route?.destinationLat) {
            const bounds = L.latLngBounds([
                [Number(route.originLat), Number(route.originLng)],
                [Number(route.destinationLat), Number(route.destinationLng)]
            ]);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, path, route]);

    return null;
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
        } catch (_err) {
            return `${amount} USD`;
        }
    };

    const mapCenter = useMemo(() => {
        if (route?.originLat && route?.originLng) {
            return [Number(route.originLat), Number(route.originLng)];
        }
        // Center of Vietnam (around Da Nang)
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

            // Validate that route is within Vietnam boundaries
            const originInVietnam = isInVietnam(data.originLat, data.originLng);
            const destInVietnam = isInVietnam(data.destinationLat, data.destinationLng);

            if (!originInVietnam || !destInVietnam) {
                const originName = !originInVietnam ? 'Điểm xuất phát' : '';
                const destName = !destInVietnam ? 'Điểm đến' : '';
                const both = !originInVietnam && !destInVietnam;

                if (both) {
                    setError('⚠️ Route này có cả điểm xuất phát và điểm đến nằm ngoài Việt Nam. Vui lòng chọn route khác trong nước.');
                } else {
                    setError(`⚠️ ${originName || destName} nằm ngoài lãnh thổ Việt Nam. Chỉ hỗ trợ giao hàng nội địa.`);
                }
                setRoute(null);
                setPath([]);
                setDistanceKm(null);
                return;
            }

            setRoute(data);
            setError(null); // Clear any previous errors
        } catch (err) {
            console.error('Failed to load route', err);
            const status = err?.response?.status;
            if (status === 403) {
                setError('You dont have performance to select this route (403).');
            } else if (status === 404) {
                setError('Invalid route (404).');
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

        // Calculate straight-line distance
        const straightLineDistance = calculatePathDistance(coords);

        // For long-distance routes in Vietnam (> 300km), use OSRM routing with waypoints
        // This prevents routes from going through Laos/Cambodia
        setLoadingPath(true);
        try {
            const path = await getOSRMRoute(
                Number(currentRoute.originLng),
                Number(currentRoute.originLat),
                Number(currentRoute.destinationLng),
                Number(currentRoute.destinationLat)
            );

            if (path && path.length > 1) {
                // Validate that ALL points in the route geometry are within Vietnam
                const allPointsInVietnam = path.every(point => isInVietnam(point[0], point[1]));

                if (allPointsInVietnam) {
                    // Route is entirely within Vietnam
                    const distanceKm = calculatePathDistance(path);
                    setPath(path);
                    setDistanceKm(Number(distanceKm.toFixed(2)));
                    setError(null);
                } else {
                    // Route goes outside Vietnam, use straight line instead
                    console.warn('Route path goes outside Vietnam boundaries, using direct path');
                    setPath(coords);
                    setDistanceKm(Number(straightLineDistance.toFixed(2)));
                }
            } else {
                // OSRM failed, use straight line
                setPath(coords);
                setDistanceKm(Number(straightLineDistance.toFixed(2)));
            }
        } catch (err) {
            console.error('OSRM fetch failed', err);
            // Fallback: try server directions endpoint
            try {
                const url = buildServerDirectionsUrl(coords, 'truck');
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                const res = await fetch(url, { signal: controller.signal });
                clearTimeout(timeoutId);
                const data = await res.json();

                if (data?.distanceMeters != null && Array.isArray(data.geometry) && data.geometry.length > 1) {
                    // Parse GeoJSON coordinates: [lng, lat] -> [lat, lng] for Leaflet
                    const geo = data.geometry.map((c) => [c[1], c[0]]);

                    // Validate that ALL points are within Vietnam
                    const allPointsInVietnam = geo.every(point => isInVietnam(point[0], point[1]));

                    if (allPointsInVietnam) {
                        setPath(geo);
                        const km = data.distanceMeters / 1000;
                        setDistanceKm(Number(km.toFixed(2)));
                    } else {
                        setPath(coords);
                        setDistanceKm(Number(straightLineDistance.toFixed(2)));
                    }
                    setError(null);
                } else {
                    setPath(coords);
                    setDistanceKm(Number(straightLineDistance.toFixed(2)));
                }
            } catch (err2) {
                console.error('Server directions endpoint also failed', err2);
                setPath(coords);
                setDistanceKm(Number(straightLineDistance.toFixed(2)));
            }
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
                    <h2 className="card-title">🗺️ Route on Map</h2>
                    <p className="page-subtitle" style={{ margin: 0 }}>Route visualization with actual road paths</p>
                </div>
                {distanceKm != null && (
                    <div className="badge" style={{ backgroundColor: '#0ea5e9', fontSize: '14px', fontWeight: '600' }}>
                        {distanceKm} km
                    </div>
                )}
            </div>

            {error && <div className="error" style={{ marginBottom: '0.5rem' }}>{error}</div>}
            {loading && <div style={{ padding: '12px', color: '#666' }}>⏳ Loading route...</div>}
            {loadingPath && <div style={{ padding: '12px', color: '#666', fontSize: '13px' }}>🔄 Calculating route path...</div>}

            <div style={{ height: '400px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <MapContainer center={mapCenter} zoom={6} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {route && (
                        <>
                            <Marker
                                position={[Number(route.originLat), Number(route.originLng)]}
                                icon={originIcon}
                            >
                                <Popup>
                                    <div style={{ minWidth: '200px' }}>
                                        <strong style={{ fontSize: '14px', color: '#10b981' }}>🟢 {route.routeName}</strong><br />
                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Origin</span><br />
                                        <span style={{ fontSize: '12px', color: '#666' }}>{route.originAddress || 'No address'}</span><br />
                                        <span style={{ fontSize: '11px', color: '#999' }}>
                      Lat: {Number(route.originLat).toFixed(4)}, Lng: {Number(route.originLng).toFixed(4)}
                    </span>
                                    </div>
                                </Popup>
                            </Marker>
                            <Marker
                                position={[Number(route.destinationLat), Number(route.destinationLng)]}
                                icon={destinationIcon}
                            >
                                <Popup>
                                    <div style={{ minWidth: '200px' }}>
                                        <strong style={{ fontSize: '14px', color: '#ef4444' }}>🔴 {route.routeName}</strong><br />
                                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Destination</span><br />
                                        <span style={{ fontSize: '12px', color: '#666' }}>{route.destinationAddress || 'No address'}</span><br />
                                        <span style={{ fontSize: '11px', color: '#999' }}>
                      Lat: {Number(route.destinationLat).toFixed(4)}, Lng: {Number(route.destinationLng).toFixed(4)}
                    </span>
                                    </div>
                                </Popup>
                            </Marker>
                        </>
                    )}
                    {path.length > 1 && (
                        <Polyline
                            positions={path}
                            color="#2563eb"
                            weight={4}
                            opacity={0.8}
                            lineJoin="round"
                            lineCap="round"
                            dashArray="0"
                        />
                    )}
                    <FitBounds path={path} route={route} />
                </MapContainer>
            </div>

            {distanceKm != null && (
                <div style={{
                    marginTop: '12px',
                    padding: '12px 16px',
                    backgroundColor: '#f0fdf4',
                    borderRadius: '8px',
                    border: '1px solid #86efac',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '18px' }}>📍</span>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#166534', fontSize: '14px' }}>
                            Route Distance
                        </div>
                        <div style={{ fontSize: '13px', color: '#15803d' }}>
                            {distanceKm} km • Estimated fee: {formatMoney(feeEstimate)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RouteMapCard;
