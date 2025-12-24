import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, tripService, orderService, dispatchVehicleService, dispatchRouteService} from '../../services';
import RouteMapCard from './RouteMapCard';
import './dispatch.css';
import './modern-dispatch.css';

const TripCreatePage = () => {
    const navigate = useNavigate();
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [tripType, setTripType] = useState('delivery');
    const [scheduledDeparture, setScheduledDeparture] = useState('');
    const [scheduledArrival, setScheduledArrival] = useState('');
    const [pendingOrders, setPendingOrders] = useState([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [orderTypeFilter, setOrderTypeFilter] = useState(''); // '', 'PORT_TERMINAL', 'WAREHOUSE'
    const [distanceEstimate, setDistanceEstimate] = useState(null);
    const [feeEstimate, setFeeEstimate] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [creatingRoute, setCreatingRoute] = useState(false);

    const toLocalDateTimeInputValue = (date) => {
        if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        const yyyy = date.getFullYear();
        const mm = pad(date.getMonth() + 1);
        const dd = pad(date.getDate());
        const hh = pad(date.getHours());
        const min = pad(date.getMinutes());
        return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    };

    const nowMin = useMemo(() => toLocalDateTimeInputValue(new Date()), []);
    const arrivalMin = useMemo(() => {
        if (scheduledDeparture) return scheduledDeparture;
        return nowMin;
    }, [scheduledDeparture, nowMin]);

    useEffect(() => {
        const loadData = async () => {
            setLoadingOrders(true);
            try {
                const [ordersRes, vehiclesRes, routesRes] = await Promise.all([
                    orderService.getOrders({ status: 'PENDING', page: 0, size: 200 }),
                    dispatchVehicleService.getAvailableVehicles(),
                    dispatchRouteService.getAllRoutes(),
                ]);
                setPendingOrders(ordersRes?.orders || []);
                setVehicles(vehiclesRes || []);
                setRoutes(routesRes || []);
            } catch (ex) {
                console.error(ex);
                setError(ex?.response?.data?.error || 'Failed to load data');
            } finally {
                setLoadingOrders(false);
            }
        };
        loadData();
    }, []);

    const toggleOrder = (orderId) => {
        setSelectedOrderIds((prev) =>
            prev.includes(orderId)
                ? prev.filter(id => id !== orderId)
                : [...prev, orderId]
        );
    };

    const handleDistanceChange = (km, fee) => {
        setDistanceEstimate(km);
        setFeeEstimate(fee);
    };

    const formatMoney = (amount) => {
        if (amount == null) return '—';
        try {
            return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
        } catch (_err) {
            return `${amount} USD`;
        }
    };

    // --- AI route auto-selection by customer addresses ---
    const normalizeText = (s) => {
        if (!s) return '';
        return String(s)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    };

    const tokenSet = (s) => new Set(normalizeText(s).split(' ').filter(Boolean));

    const overlapScore = (a, b) => {
        const ta = tokenSet(a);
        const tb = tokenSet(b);
        if (ta.size === 0 || tb.size === 0) return 0;
        let hit = 0;
        for (const t of ta) {
            if (tb.has(t)) hit += 1;
        }
        // Jaccard-like score
        return hit / Math.max(ta.size, tb.size);
    };

    const computeRouteScore = (order, route) => {
        const pickupSim = overlapScore(order.pickupAddress, route.originAddress);
        const deliverySim = overlapScore(order.deliveryAddress, route.destinationAddress);
        // Weighted: prefer origin match slightly
        return (pickupSim * 0.6) + (deliverySim * 0.4);
    };

    // Haversine distance calculation (same as mobile app)
    const calculateHaversineDistance = (lat1, lng1, lat2, lng2) => {
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const geocodeAddressVN = async (address) => {
        if (!address) return null;
        // Prefer backend geocode to avoid client-side rate limits and ensure auth
        const ensureVN = (q) => {
            const s = String(q);
            if (/viet\s*nam|việt\s*nam/i.test(s)) return s;
            return s + ', Việt Nam';
        };
        const sanitize = (s) => String(s)
            .replace(/\s+/g, ' ')
            .trim();

        const primary = ensureVN(address);
        const alt = ensureVN(sanitize(address));
        try {
            // Try server geocode first
            const res = await api.get('/maps/geocode', { params: { address: primary } });
            const data = res?.data;
            let lat = Number(data?.latitude);
            let lng = Number(data?.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                const res2 = await api.get('/maps/geocode', { params: { address: alt } });
                lat = Number(res2?.data?.latitude);
                lng = Number(res2?.data?.longitude);
            }
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                const inVN = lat >= 8.5 && lat <= 23.4 && lng >= 102.1 && lng <= 109.5;
                return inVN ? { lat, lng } : null;
            }
            return null;
        } catch (_err) {
            return null;
        }
        // Strip English suffixes that often harm VN geocoding (requested: remove "Street").
        const normalizeForGeocode = (s) => {
            let out = String(s);
            out = out.replace(/\bstreet\b/gi, '');
            out = out.replace(/\s+/g, ' ').trim();
            out = out.replace(/\s+,/g, ',');
            out = out.replace(/,\s*,/g, ',');
            out = out.replace(/,\s+/g, ', ');
            out = out.replace(/^,\s*/g, '');
            out = out.replace(/,\s*$/g, '');
            return out;
        };

        const addStreetIfMissing = (s) => {
            const raw = String(s);
            if (/\bstreet\b/i.test(raw)) return raw;
            if (!/\d/.test(raw)) return raw;
            return raw.replace(/^\s*([^,]+)(\s*,\s*|\s*$)/, (_m, first, sep) => {
                const cleanedFirst = String(first).trim();
                if (!cleanedFirst) return raw;
                return `${cleanedFirst} Street${sep || ''}`;
            });
        };

        // Fallback queries if the original form doesn't geocode well.
        const withStreetPrimary = ensureVN(addStreetIfMissing(address));
        const withStreetAlt = ensureVN(addStreetIfMissing(sanitize(address)));
        const fallbackPrimary = ensureVN(normalizeForGeocode(address));
        const fallbackAlt = ensureVN(normalizeForGeocode(sanitize(address)));

        const tryGeocode = async (q) => {
            try {
                const res = await api.get('/maps/geocode', { params: { address: q } });
                const data = res?.data;
                const lat = Number(data?.latitude);
                const lng = Number(data?.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                return { lat, lng };
            } catch (_e) {
                return null;
            }
        };

        const candidates = [primary, alt, withStreetPrimary, withStreetAlt, fallbackPrimary, fallbackAlt]
            .map((s) => String(s || '').trim())
            .filter(Boolean)
            .filter((value, index, self) => self.indexOf(value) === index);

        for (const q of candidates) {
            const coords = await tryGeocode(q);
            if (!coords) continue;
            const { lat, lng } = coords;
            const inVN = lat >= 8.5 && lat <= 23.4 && lng >= 102.1 && lng <= 109.5;
            if (inVN) return { lat, lng };
        }

        return null;
    };

    const autoCreateRouteFromOrder = async (order) => {
        if (creatingRoute) return null;
        setCreatingRoute(true);
        try {
            // Debug: Check coordinates
            console.log('Order coordinates:', {
                pickupLat: order.pickupLat,
                pickupLng: order.pickupLng,
                deliveryLat: order.deliveryLat,
                deliveryLng: order.deliveryLng
            });

            // Use existing coordinates and distance from the order (already calculated in mobile app)
            const origin = {
                lat: order.pickupLat || 0,
                lng: order.pickupLng || 0
            };
            const dest = {
                lat: order.deliveryLat || 0,
                lng: order.deliveryLng || 0
            };

            // Validate coordinates are in Vietnam bounds
            const VIETNAM_BOUNDS = { minLat: 8.5, maxLat: 23.4, minLng: 102.1, maxLng: 109.5 };
            const originInVietnam = origin.lat >= VIETNAM_BOUNDS.minLat && origin.lat <= VIETNAM_BOUNDS.maxLat &&
                                  origin.lng >= VIETNAM_BOUNDS.minLng && origin.lng <= VIETNAM_BOUNDS.maxLng;
            const destInVietnam = dest.lat >= VIETNAM_BOUNDS.minLat && dest.lat <= VIETNAM_BOUNDS.maxLat &&
                                dest.lng >= VIETNAM_BOUNDS.minLng && dest.lng <= VIETNAM_BOUNDS.maxLng;

            console.log('Vietnam validation:', { originInVietnam, destInVietnam });

            if (!originInVietnam || !destInVietnam) {
                setError(`Coordinates validation failed. Origin: ${origin.lat},${origin.lng} (${originInVietnam ? 'OK' : 'OUTSIDE VN'}), Dest: ${dest.lat},${dest.lng} (${destInVietnam ? 'OK' : 'OUTSIDE VN'})`);
                return null;
            }

            // Use the distance and fee already calculated in the order
            const distanceKm = order.distanceKm || calculateHaversineDistance(origin.lat, origin.lng, dest.lat, dest.lng);

            const routeData = {
                routeName: `${order.pickupAddress} → ${order.deliveryAddress}`.slice(0, 180),
                originAddress: order.pickupAddress,
                originLat: origin.lat,
                originLng: origin.lng,
                destinationAddress: order.deliveryAddress,
                destinationLat: dest.lat,
                destinationLng: dest.lng,
                distanceKm,
                estimatedDurationHours: undefined, // Let server calculate if needed
                routeType: 'standard'
            };

            // Prefer dispatcher endpoint; it shouldn't require admin role
            let created = null;
            try {
                created = await dispatchRouteService.createRoute(routeData);
            } catch (errCreate) {
                // Fallback to admin endpoint if dispatcher creation not available
                try {
                    created = await adminRouteService.createRoute(routeData);
                } catch (errAdmin) {
                    const status = errAdmin?.response?.status;
                    if (status === 403) {
                        setError('No permission to auto-create route (403). Please use an account with permission or add the route manually.');
                    } else {
                        setError('Route creation failed. Please check server or permissions.');
                    }
                    return null;
                }
            }
            if (created?.routeId) {
                setRoutes(prev => [...prev, created]);
                setSelectedRoute(created);
                setError(null);
                return created;
            }
            setError('Tạo route thất bại, vui lòng kiểm tra server.');
            return null;
        } catch (_err) {
            const status = _err?.response?.status;
            if (status === 403) {
                setError('No permission to auto-create route (403). Please use an account with permission or add the route manually.');
            } else {
                setError('Unable to auto-create route. Please add a route manually.');
            }
            return null;
        } finally {
            setCreatingRoute(false);
        }
    };

    const selectedOrdersData = useMemo(() => {
        const selected = pendingOrders.filter(o => selectedOrderIds.includes(o.orderId));
        if (selected.length === 0) return null;

        // Calculate totals for all selected orders
        const totalDistance = selected.reduce((sum, order) => sum + (order.distanceKm || 0), 0);
        const totalFee = selected.reduce((sum, order) => sum + (order.shippingFee || 0), 0);
        const orderCount = selected.length;

        return {
            orders: selected,
            totalDistance,
            totalFee,
            orderCount
        };
    }, [selectedOrderIds, pendingOrders]);

    const primarySelectedOrder = useMemo(() => {
        if (selectedOrderIds.length === 0) return null;
        const first = pendingOrders.find(o => o.orderId === selectedOrderIds[0]);
        return first || null;
    }, [selectedOrderIds, pendingOrders]);

    useEffect(() => {
        // When orders change, auto-pick best matching route or create one
        if (!primarySelectedOrder) {
            setSelectedRoute(null);
            return;
        }
        let best = null;
        let bestScore = 0;
        if (routes.length > 0) {
            for (const r of routes) {
                const s = computeRouteScore(primarySelectedOrder, r);
                if (s > bestScore) {
                    bestScore = s;
                    best = r;
                }
            }
        }
        // Apply a minimum threshold to avoid random picks
        if (best && bestScore >= 0.25) {
            setSelectedRoute(best);
            setError(null);
        } else {
            // Try auto-creating a route when none fits or none exist
            (async () => {
                const created = await autoCreateRouteFromOrder(primarySelectedOrder);
                if (!created) {
                    setSelectedRoute(null);
                    // Do not override a specific error message already set inside autoCreateRouteFromOrder
                    // Keep existing error state for clarity
                }
            })();
        }
    }, [primarySelectedOrder, routes]);

    const onSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!selectedVehicle || !scheduledDeparture || !scheduledArrival || selectedOrderIds.length === 0) {
            setError('Please fill all required fields and select at least one order');
            return;
        }

        if (!selectedRoute) {
            setError('AI could not select a suitable route from customer addresses.');
            return;
        }

        // Validate selected orders have pickupType and required dependent fields
        const selectedOrders = pendingOrders.filter(o => selectedOrderIds.includes(o.orderId));
        const invalids = [];
        for (const o of selectedOrders) {
            if (!o.pickupType) {
                invalids.push(`#${o.orderId} missing pickup type`);
                continue;
            }
            if (o.pickupType === 'PORT_TERMINAL' && (!o.containerNumber || !String(o.containerNumber).trim())) {
                invalids.push(`#${o.orderId} requires container number for port pickup`);
            }
            if (o.pickupType === 'WAREHOUSE' && (!o.dockInfo || !String(o.dockInfo).trim())) {
                invalids.push(`#${o.orderId} requires dock info for warehouse pickup`);
            }
        }
        if (invalids.length > 0) {
            setError(`Some orders are incomplete: ${invalids.join('; ')}`);
            return;
        }

        const payload = {
            vehicleId: Number(selectedVehicle.vehicleId),
            routeId: Number(selectedRoute.routeId),
            tripType,
            scheduledDeparture: new Date(scheduledDeparture).toISOString(),
            scheduledArrival: new Date(scheduledArrival).toISOString(),
            orderIds: selectedOrderIds,
        };

        setLoading(true);
        try {
            await tripService.createTrip(payload);
            setSuccess('Trip created successfully');
            setTimeout(() => navigate('/dispatch/trips'), 800);
        } catch (ex) {
            console.error(ex);
            setError(ex?.response?.data?.error || ex?.message || 'Failed to create trip');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modern-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Create Trip</h1>
                    <p className="page-subtitle">Enter trip details and assign orders</p>
                </div>
                <div className="header-actions">
                    <button type="button" onClick={() => navigate('/dispatch/trips')} className="btn-secondary">
                        ← Back to Trips
                    </button>
                </div>
            </div>

            <form className="detail-card" style={{ padding: '1.5rem' }} onSubmit={onSubmit}>
                <div className="card-body" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
                    <div className="form-group">
                        <label>Vehicle</label>
                        <select value={selectedVehicle ? selectedVehicle.vehicleId : ''} onChange={e => {
                            const v = vehicles.find(x => x.vehicleId === Number(e.target.value));
                            setSelectedVehicle(v || null);
                        }}>
                            <option value="">-- Select Vehicle --</option>
                            {vehicles.map(v => (
                                <option key={v.vehicleId} value={v.vehicleId}>
                                    {v.vehicleType} ({v.capacity} kg)
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Route selection removed — AI auto-selects based on order addresses */}
                    <div className="form-group">
                        <label>Trip Type</label>
                        <select value={tripType} onChange={e => setTripType(e.target.value)}>
                            <option value="delivery">Delivery</option>
                            <option value="pickup">Pickup</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Scheduled Departure</label>
                        <input
                            type="datetime-local"
                            value={scheduledDeparture}
                            min={nowMin}
                            onChange={e => setScheduledDeparture(e.target.value)}
                        />
                    </div>
                    <div className="form-group">
                        <label>Scheduled Arrival</label>
                        <input
                            type="datetime-local"
                            value={scheduledArrival}
                            min={arrivalMin}
                            onChange={e => setScheduledArrival(e.target.value)}
                        />
                    </div>
                </div>

                {selectedOrdersData && selectedOrdersData.orders.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                        <div className="info-pill" style={{ marginBottom: '0.5rem' }}>
                            Selected Orders: {selectedOrdersData.orderCount}
                        </div>
                        <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                            {selectedOrdersData.orders.map(order => (
                                <div key={order.orderId} className="info-pill" style={{
                                    backgroundColor: '#f0f9ff',
                                    border: '1px solid #0ea5e9',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    fontSize: '13px'
                                }}>
                                    <div>
                                        <strong>#{order.orderId}</strong> - {order.customerName}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <span>📍 {order.distanceKm ? `${order.distanceKm.toFixed(1)}km` : '—'}</span>
                                        <span>💰 {order.shippingFee ? formatMoney(order.shippingFee) : '—'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <div className="info-pill" style={{ backgroundColor: '#065f46', color: 'white' }}>
                                Total Distance: {selectedOrdersData.totalDistance > 0 ? `${selectedOrdersData.totalDistance.toFixed(1)} km` : '—'}
                            </div>
                            <div className="info-pill" style={{ backgroundColor: '#065f46', color: 'white' }}>
                                Total Fee: {selectedOrdersData.totalFee > 0 ? formatMoney(selectedOrdersData.totalFee) : '—'}
                            </div>
                        </div>
                    </div>
                )}

                <div className="detail-card" style={{ marginTop: '1rem', padding: '1rem' }}>
                    <h3 style={{ marginBottom: '0.75rem' }}>Select Pending Orders</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <label style={{ fontSize: 14, color: '#475569' }}>Filter by pickup type:</label>
                        <select value={orderTypeFilter} onChange={e => setOrderTypeFilter(e.target.value)}>
                            <option value="">All</option>
                            <option value="PORT_TERMINAL">PORT_TERMINAL</option>
                            <option value="WAREHOUSE">WAREHOUSE</option>
                        </select>
                    </div>
                    {loadingOrders && <div>Loading pending orders...</div>}
                    {!loadingOrders && pendingOrders.length === 0 && (
                        <div>No pending orders available.</div>
                    )}
                    {!loadingOrders && pendingOrders.length > 0 && (
                        <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {pendingOrders
                                .filter(o => !orderTypeFilter || o.pickupType === orderTypeFilter)
                                .map((o) => (
                                    <label key={o.orderId} className="order-item-compact" style={{ cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedOrderIds.includes(o.orderId)}
                                            onChange={() => toggleOrder(o.orderId)}
                                            style={{ marginRight: '0.75rem' }}
                                        />
                                        <div className="order-info">
                                            <div className="order-customer">#{o.orderId} — {o.customerName}</div>
                                            <div className="order-route-compact">
                                                <span className="pickup-compact">📍 {o.pickupAddress}</span>
                                                <span className="arrow">→</span>
                                                <span className="delivery-compact">🎯 {o.deliveryAddress}</span>
                                            </div>
                                            <div style={{ color: '#475569', fontSize: '0.85rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span>
                        {o.weightTons ? `⚖️ ${o.weightTons} t` : (o.weightKg ? `⚖️ ${o.weightKg} kg` : '')}
                          {o.packageDetails ? ` • ${o.packageDetails}` : ''}
                      </span>
                                                {o.pickupType && (
                                                    <span style={{
                                                        backgroundColor: o.pickupType === 'PORT_TERMINAL' ? '#fef3c7' : '#dbeafe',
                                                        color: o.pickupType === 'PORT_TERMINAL' ? '#92400e' : '#0c4a6e',
                                                        padding: '0.1rem 0.5rem',
                                                        borderRadius: 6,
                                                        fontWeight: 600,
                                                        fontSize: 12
                                                    }}>
                          {o.pickupType}
                        </span>
                                                )}
                                                {o.pickupType === 'PORT_TERMINAL' && o.containerNumber && (
                                                    <span style={{ fontSize: 12, color: '#334155' }}>🧾 {o.containerNumber}</span>
                                                )}
                                                {o.pickupType === 'WAREHOUSE' && o.dockInfo && (
                                                    <span style={{ fontSize: 12, color: '#334155' }}>🏭 {o.dockInfo}</span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                        </div>
                    )}
                </div>

                {selectedOrdersData && selectedOrdersData.orders.length > 0 && (
                    <>
                        <div className="info-pill" style={{ marginTop: '1rem' }}>
                            Trip Route: {selectedOrdersData.orders.length} order{selectedOrdersData.orders.length > 1 ? 's' : ''} selected
                        </div>
                        <RouteMapCard
                            orders={selectedOrdersData.orders}
                            onDistanceChange={handleDistanceChange}
                        />
                    </>
                )}
                {!selectedRoute && primarySelectedOrder && (
                    <div className="info-pill" style={{ marginTop: '1rem' }}>
                        Using order #{primarySelectedOrder.orderId} addresses to select/create a route.
                    </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    <button className="btn-primary" type="submit" disabled={loading}>
                        {loading ? 'Creating...' : 'Create Trip'}
                    </button>
                    <button className="btn-secondary" type="button" onClick={() => navigate('/dispatch/trips')}>
                        Cancel
                    </button>
                </div>

                {error && <div className="error" style={{ marginTop: '1rem' }}>{error}</div>}
                {success && <div className="success" style={{ marginTop: '1rem' }}>{success}</div>}
            </form>
        </div>
    );
};

export default TripCreatePage;
