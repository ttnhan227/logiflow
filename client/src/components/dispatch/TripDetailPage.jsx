import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { tripService, trackingClient } from '../../services';
import dispatchRouteService from '../../services/dispatch/routeService';
import RouteMapCard from './RouteMapCard';
import ChatPopup from '../common/ChatPopup';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './dispatch.css';
import './modern-dispatch.css';

const formatMoney = (amount) => {
  if (amount == null) return 'N/A';
  try {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  } catch (e) {
    return `${amount} USD`;
  }
};

// Fix default Leaflet icons in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const TripDetailPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [distanceEstimate, setDistanceEstimate] = useState(null);
  const [feeEstimate, setFeeEstimate] = useState(null);

  const [deliveryConfirmation, setDeliveryConfirmation] = useState(null);
  const [podLoading, setPodLoading] = useState(false);
  const [podError, setPodError] = useState(null);

  const [liveLocation, setLiveLocation] = useState(null); // {latitude, longitude, driverId, tripId}
  const [actionError, setActionError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [rerouting, setRerouting] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [newRouteId, setNewRouteId] = useState('');
  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    loadTrip();
  }, [tripId, location.state]);

  // Fetch all routes for the reroute dropdown
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const routeList = await dispatchRouteService.getAllRoutes();
        setRoutes(routeList || []);
      } catch (err) {
        console.error('Failed to load routes', err);
      }
    };
    fetchRoutes();
  }, []);

  // Connect + subscribe to trip-scoped live location topic
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        await trackingClient.connect();
        trackingClient.subscribeToTripLocation(tripId, (msg) => {
          if (!mounted || !msg) return;
          setLiveLocation(msg);
        });
      } catch (e) {
        console.warn('Tracking WS not connected', e);
      }
    };

    if (tripId) run();

    return () => {
      mounted = false;
      try {
        trackingClient.unsubscribeTripLocation(tripId);
      } catch (e) {
        // ignore
      }
    };
  }, [tripId]);

  // Reload trip when returning from assign page
  useEffect(() => {
    const handleFocus = () => {
      loadTrip();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadTrip = async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await tripService.getTripById(Number(tripId));
      setTrip(t);

      // Load POD for completed trips (dispatcher verification)
      setDeliveryConfirmation(null);
      setPodError(null);
      if ((t?.status || '').toUpperCase() === 'COMPLETED') {
        try {
          setPodLoading(true);
          const pod = await tripService.getDeliveryConfirmation(Number(tripId));
          // If confirmationId is null/undefined, treat as no confirmation found
          if (pod?.confirmationId) {
            setDeliveryConfirmation(pod);
          } else {
            setPodError('No delivery confirmation found');
          }
        } catch (e) {
          // If there is no POD record, keep page working and show a message
          setPodError(e?.response?.data?.error || 'No delivery confirmation found');
        } finally {
          setPodLoading(false);
        }
      }
      if (t?.currentLat != null && t?.currentLng != null) {
        setLiveLocation({ latitude: t.currentLat, longitude: t.currentLng, driverId: t.driverId, tripId: String(t.tripId) });
      }
      
      // Try to load route waypoints if route data is available
      if (t?.route?.waypoints) {
        setRouteWaypoints(t.route.waypoints);
      } else if (t?.routeId) {
        // If waypoints aren't in the trip data, they might be loaded separately in RouteMapCard
        // For now, we'll set an empty array and let the user see the route in RouteMapCard
        setRouteWaypoints([]);
      }
    } catch (err) {
      console.error('Failed to load trip', err);
      setError('Trip not found or you do not have permission to access it');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return '#f59e0b';
      case 'SCHEDULED': return '#06b6d4';
      case 'ASSIGNED': return '#3b82f6';
      case 'IN_PROGRESS': return '#8b5cf6';
      case 'COMPLETED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderPOD = () => {
    if ((trip?.status || '').toUpperCase() !== 'COMPLETED') return null;

    return (
      <div className="detail-card full-width" style={{ marginTop: '1rem' }}>
        <div className="card-header">
          <h2 className="card-title">Proof of Delivery (POD)</h2>
        </div>
        <div className="card-body">
          {podLoading && <div className="page-subtitle">Loading delivery confirmation…</div>}

          {!podLoading && podError && (
            <div className="page-subtitle" style={{ color: '#b91c1c' }}>
              {podError}
            </div>
          )}

          {!podLoading && !podError && deliveryConfirmation && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <div className="detail-label">Type</div>
                <div className="detail-value">{deliveryConfirmation.confirmationType}</div>

                <div className="detail-label" style={{ marginTop: '0.75rem' }}>Recipient</div>
                <div className="detail-value">{deliveryConfirmation.recipientName || 'N/A'}</div>

                <div className="detail-label" style={{ marginTop: '0.75rem' }}>Confirmed at</div>
                <div className="detail-value">{formatDateTime(deliveryConfirmation.confirmedAt)}</div>

                <div className="detail-label" style={{ marginTop: '0.75rem' }}>Notes</div>
                <div className="detail-value">{deliveryConfirmation.notes || '—'}</div>
              </div>

              <div>
                {deliveryConfirmation.confirmationType === 'SIGNATURE' && deliveryConfirmation.signatureData && (
                  <>
                    <div className="detail-label">Signature</div>
                    <img
                      src={`data:image/png;base64,${deliveryConfirmation.signatureData}`}
                      alt="Signature"
                      style={{ width: '100%', maxWidth: 420, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
                    />
                  </>
                )}

                {deliveryConfirmation.confirmationType === 'PHOTO' && deliveryConfirmation.photoData && (
                  <>
                    <div className="detail-label">Delivery photo</div>
                    <img
                      src={`data:image/jpeg;base64,${deliveryConfirmation.photoData}`}
                      alt="Delivery photo"
                      style={{ width: '100%', maxWidth: 420, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff' }}
                    />
                  </>
                )}

                {deliveryConfirmation.confirmationType === 'OTP' && (
                  <>
                    <div className="detail-label">OTP Code</div>
                    <div className="detail-value" style={{ fontFamily: 'monospace', fontSize: '1.1rem' }}>
                      {deliveryConfirmation.otpCode || 'N/A'}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const timeline = useMemo(() => {
    const events = trip?.progressEvents || [];
    return [...events].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [trip]);

  const mapCenter = useMemo(() => {
    if (liveLocation?.latitude && liveLocation?.longitude) return [Number(liveLocation.latitude), Number(liveLocation.longitude)];
    return [16.0471, 108.2068];
  }, [liveLocation]);

  if (loading) {
    return (
      <div className="modern-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading trip details...</p>
        </div>
      </div>
    );
  }

  const handleCancel = async () => {
    setActionError(null);
    if (!cancelReason.trim()) {
      setActionError('Please enter a cancellation reason');
      return;
    }
    setCancelling(true);
    try {
      await tripService.cancelTrip(Number(tripId), { reason: cancelReason });
      setCancelReason('');
      await loadTrip();
    } catch (e) {
      setActionError(e?.response?.data?.error || 'Failed to cancel trip');
    } finally {
      setCancelling(false);
    }
  };

  const handleReroute = async () => {
    setActionError(null);
    const rid = Number(newRouteId);
    if (!rid) {
      setActionError('Please enter a valid routeId');
      return;
    }
    setRerouting(true);
    try {
      await tripService.rerouteTrip(Number(tripId), { routeId: rid });
      setNewRouteId('');
      await loadTrip();
    } catch (e) {
      setActionError(e?.response?.data?.error || 'Failed to reroute trip');
    } finally {
      setRerouting(false);
    }
  };

  if (error || !trip) {
    return (
      <div className="modern-container">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h3>{error || 'Trip not found'}</h3>
          <Link to="/dispatch/trips" className="btn-primary">Back to Trips</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trip #{trip.tripId}</h1>
          <p className="page-subtitle">{trip.routeName}</p>
        </div>
        <div className="header-actions">
          {trip.status?.toUpperCase() !== 'COMPLETED' && trip.status?.toUpperCase() !== 'CANCELLED' && trip.status?.toUpperCase() !== 'ARRIVED' && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? 'Cancelling...' : '✖ Cancel'}
              </button>
              <button className="btn-secondary" onClick={handleReroute} disabled={rerouting}>
                {rerouting ? 'Rerouting...' : '↪ Reroute'}
              </button>
            </div>
          )}

          {!trip.driverName && trip.status?.toUpperCase() !== 'COMPLETED' && trip.status?.toUpperCase() !== 'CANCELLED' && trip.status?.toUpperCase() !== 'ARRIVED' && (
            <Link 
              to={`/dispatch/trips/${trip.tripId}/assign`} 
              className="btn-primary"
            >
              👥 Assign Driver
            </Link>
          )}
          <Link to="/dispatch/trips" className="btn-secondary">
            ← Back to Trips
          </Link>
        </div>
      </div>

      {actionError && (
        <div className="error" style={{ marginBottom: '1rem' }}>{actionError}</div>
      )}

      {(trip.status?.toUpperCase() !== 'COMPLETED' && trip.status?.toUpperCase() !== 'CANCELLED' && trip.status?.toUpperCase() !== 'ARRIVED') && (
        <div className="detail-card full-width" style={{ marginBottom: '1rem' }}>
          <div className="card-header">
            <h2 className="card-title">Actions</h2>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 260px' }}>
              <div className="detail-label">Cancel reason</div>
              <input
                className="input"
                style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer request / vehicle issue"
              />
            </div>
            <div style={{ flex: '1 1 260px' }}>
              <div className="detail-label">New Route</div>
              <select
                style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #e2e8f0' }}
                value={newRouteId}
                onChange={(e) => setNewRouteId(e.target.value)}
              >
                <option value="">-- Select Route --</option>
                {routes.map(route => (
                  <option key={route.routeId} value={route.routeId}>
                    {route.routeName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="detail-grid">
        <div className="detail-card main-card">
          <div className="card-header">
            <h2 className="card-title">Trip Information</h2>
            <span 
              className="badge" 
              style={{ backgroundColor: getStatusColor(trip.status) }}
            >
              {trip.status}
            </span>
          </div>
          
          <div className="card-body">
            <div className="detail-section">
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-icon">🗺️</div>
                  <div>
                    <div className="detail-label">Route Name</div>
                    <div className="detail-value">{trip.routeName}</div>
                  </div>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-icon">📅</div>
                  <div>
                    <div className="detail-label">Scheduled Departure</div>
                    <div className="detail-value">{formatDateTime(trip.scheduledDeparture)}</div>
                  </div>
                </div>

                {trip.actualDeparture && (
                  <div className="detail-item">
                    <div className="detail-icon">🕐</div>
                    <div>
                      <div className="detail-label">Actual Departure</div>
                      <div className="detail-value">{formatDateTime(trip.actualDeparture)}</div>
                    </div>
                  </div>
                )}
              </div>

              {trip.actualArrival && (
                <div className="detail-row">
                  <div className="detail-item">
                    <div className="detail-icon">✓</div>
                    <div>
                      <div className="detail-label">Actual Arrival</div>
                      <div className="detail-value">{formatDateTime(trip.actualArrival)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-icon">📏</div>
                  <div>
                    <div className="detail-label">Estimated Distance</div>
                    <div className="detail-value">{distanceEstimate != null ? `${distanceEstimate} km` : 'N/A'}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">💵</div>
                  <div>
                    <div className="detail-label">Estimated Fee</div>
                    <div className="detail-value">{feeEstimate != null ? formatMoney(feeEstimate) : 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <div className="card-header">
            <h2 className="card-title">Assignment</h2>
          </div>
          
          <div className="card-body">
            <div className="assignment-section">
              <div className="assignment-item">
                <div className="assignment-icon driver-icon">👤</div>
                <div>
                  <div className="detail-label">Driver</div>
                  <div className="detail-value">
                    {trip.driverName || (
                      <span className="not-assigned">Not assigned</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="assignment-item">
                <div className="assignment-icon vehicle-icon">🚗</div>
                <div>
                  <div className="detail-label">Vehicle</div>
                  <div className="detail-value">
                    {trip.vehicleLicensePlate || (
                      <span className="not-assigned">Not assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {!trip.driverName && trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
                <Link 
                  to={`/dispatch/trips/${trip.tripId}/assign`} 
                  className="btn-action primary"
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  👥 Assign Driver & Vehicle
                </Link>
              )}
            </div>
          </div>
        </div>

        {trip.status?.toUpperCase() === 'IN_PROGRESS' && (
          <div className="detail-card" style={{ marginTop: '1rem' }}>
            <div className="card-header" style={{ alignItems: 'center' }}>
              <div>
                <h2 className="card-title">Live Location</h2>
                <p className="page-subtitle" style={{ margin: 0 }}>Real-time driver marker with current route</p>
              </div>
              {liveLocation && (
                <div className="badge" style={{ backgroundColor: '#8b5cf6' }}>
                  {Number(liveLocation.latitude).toFixed(5)},{Number(liveLocation.longitude).toFixed(5)}
                </div>
              )}
            </div>
            <div style={{ height: '320px', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {routeWaypoints.length > 0 && (
                  <Polyline
                    positions={routeWaypoints.map(wp => [wp.latitude, wp.longitude])}
                    color="#3b82f6"
                    weight={3}
                    opacity={0.7}
                  />
                )}
                {liveLocation && (
                  <Marker
                    position={[Number(liveLocation.latitude), Number(liveLocation.longitude)]}
                    icon={driverIcon}
                  />
                )}
              </MapContainer>
            </div>
          </div>
        )}

        {trip.routeId && (
          <RouteMapCard 
            routeId={trip.routeId} 
            feePerKm={12} 
            onDistanceChange={(km, fee) => { setDistanceEstimate(km); setFeeEstimate(fee); }}
          />
        )}

        <div className="detail-card full-width">
          <div className="card-header">
            <h2 className="card-title">Progress Timeline</h2>
          </div>
          <div className="card-body">
            {timeline.length === 0 ? (
              <div className="page-subtitle">No events yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {timeline.map((e) => (
                  <div key={e.eventId || `${e.eventType}-${e.createdAt}`} className="order-item-compact">
                    <div className="order-number">{e.eventType}</div>
                    <div className="order-info">
                      <div className="order-customer">{e.message || '—'}</div>
                      <div className="order-route-compact">
                        <span className="pickup-compact">🕒 {formatDateTime(e.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {renderPOD()}

        {trip.orders && trip.orders.length > 0 && (
          <div className="detail-card full-width">
            <div className="card-header">
              <h2 className="card-title">Orders ({trip.orders.length})</h2>
            </div>
            
            <div className="card-body">
              <div className="orders-list">
                {trip.orders.map((order, idx) => (
                  <div key={idx} className="order-item-compact">
                    <div className="order-number">#{order.orderId || idx + 1}</div>
                    <div className="order-info">
                      <div className="order-customer">{order.customerName}</div>
                      <div className="order-route-compact">
                        <span className="pickup-compact">📍 {order.pickupAddress}</span>
                        <span className="arrow">→</span>
                        <span className="delivery-compact">🎯 {order.deliveryAddress}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Popup */}
      <ChatPopup tripId={tripId} driverId={trip?.driverId} trip={trip} />
    </div>
  );
};

export default TripDetailPage;
