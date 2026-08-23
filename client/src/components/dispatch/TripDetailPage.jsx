import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { tripService, trackingClient } from '../../services';
import RouteMapCard from './RouteMapCard';
import ChatPopup from '../common/ChatPopup';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { divIcon } from 'leaflet';
import {
  Button,
  Card,
  Badge,
  PageHeader,
  Alert,
  LoadingSpinner,
} from '@/components/ui';
import {
  LuTruck,
  LuUser,
  LuCalendar,
  LuClock,
  LuMapPin,
  LuArrowLeft,
  LuCircleCheck,
  LuCircleX,
  LuTriangleAlert,
  LuCreditCard,
  LuNavigation,
} from 'react-icons/lu';

const createDriverMarker = () =>
  divIcon({
    className: 'custom-driver-marker',
    html: `
      <div style="
        background-color: #7c3aed;
        color: white;
        border: 2px solid white;
        border-radius: 9999px;
        padding: 4px 10px;
        font-size: 11px;
        font-weight: 700;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        🚐 Live Driver
      </div>
    `,
    iconSize: [90, 26],
    iconAnchor: [45, 13],
  });

export const TripDetailPage = () => {
  const { tripId } = useParams();
  const location = useLocation();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [deliveryConfirmation, setDeliveryConfirmation] = useState(null);
  const [podLoading, setPodLoading] = useState(false);
  const [podError, setPodError] = useState(null);

  const [liveLocation, setLiveLocation] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [routeWaypoints, setRouteWaypoints] = useState([]);
  const [delayInfo, setDelayInfo] = useState(null);

  const loadTrip = async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await tripService.getTripById(Number(tripId));
      setTrip(t);

      setDeliveryConfirmation(null);
      setPodError(null);
      if ((t?.status || '').toUpperCase() === 'COMPLETED') {
        try {
          setPodLoading(true);
          const pod = await tripService.getDeliveryConfirmation(Number(tripId));
          if (pod?.confirmationId) {
            setDeliveryConfirmation(pod);
          } else {
            setPodError('No electronic delivery confirmation uploaded.');
          }
        } catch {
          setPodError('Proof of Delivery record not found.');
        } finally {
          setPodLoading(false);
        }
      }

      if (t?.currentLat != null && t?.currentLng != null) {
        setLiveLocation({
          latitude: t.currentLat,
          longitude: t.currentLng,
          driverId: t.driverId,
          tripId: String(t.tripId),
        });
      }

      if (t?.route?.waypoints && Array.isArray(t.route.waypoints)) {
        setRouteWaypoints(t.route.waypoints);
      } else {
        setRouteWaypoints([]);
      }

      setDelayInfo(null);
      if (t?.delayReason || t?.delayStatus) {
        setDelayInfo({
          delayReason: t.delayReason,
          delayStatus: t.delayStatus,
          slaExtensionMinutes: t.slaExtensionMinutes,
        });
      } else {
        try {
          const delayData = await tripService.getTripDelayInfo(Number(tripId));
          if (delayData) setDelayInfo(delayData);
        } catch {
          // non-critical
        }
      }
    } catch {
      setError('Trip not found or insufficient access permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrip();
  }, [tripId, location.state]);

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
        console.warn('Tracking WS connection idle', e);
      }
    };

    if (tripId) run();

    return () => {
      mounted = false;
      try {
        trackingClient.unsubscribeTripLocation(tripId);
      } catch {
        // ignore
      }
    };
  }, [tripId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning" dot>Pending</Badge>;
      case 'SCHEDULED':
        return <Badge variant="brand" dot>Scheduled</Badge>;
      case 'ASSIGNED':
        return <Badge variant="brand" dot>Assigned</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info" dot>In Progress</Badge>;
      case 'COMPLETED':
        return <Badge variant="success" dot>Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral" dot>Cancelled</Badge>;
      default:
        return <Badge variant="neutral" dot>{status || 'Unknown'}</Badge>;
    }
  };

  const handleCancel = async () => {
    setActionError(null);
    if (!cancelReason.trim()) {
      setActionError('Please provide an operational cancellation justification.');
      return;
    }
    setCancelling(true);
    try {
      await tripService.cancelTrip(Number(tripId), { reason: cancelReason });
      setCancelReason('');
      setShowCancelModal(false);
      await loadTrip();
    } catch (e) {
      setActionError(e?.response?.data?.error || 'Failed to cancel trip manifest.');
    } finally {
      setCancelling(false);
    }
  };

  const mapCenter = useMemo(() => {
    if (liveLocation?.latitude && liveLocation?.longitude) {
      return [Number(liveLocation.latitude), Number(liveLocation.longitude)];
    }
    return [16.0471, 108.2068];
  }, [liveLocation]);

  const timeline = useMemo(() => {
    const events = trip?.progressEvents || [];
    return [...events].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }, [trip]);

  if (loading) {
    return <LoadingSpinner fullPage text="Retrieving trip manifest details..." />;
  }

  if (error || !trip) {
    return (
      <div className="container" style={{ padding: '48px 16px', maxWidth: '600px' }}>
        <Alert variant="danger">{error || 'Trip record not found.'}</Alert>
        <div style={{ marginTop: '16px' }}>
          <Link to="/dispatch/trips">
            <Button variant="outline" leftIcon={<LuArrowLeft size={14} />}>
              Back to Trips
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={`Trip #${trip.tripId}`}
        description={`${trip.routeName || 'Consolidated Route'} • Scheduled: ${
          trip.scheduledDeparture
            ? new Date(trip.scheduledDeparture).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
            : 'Unscheduled'
        }`}
        badge={getStatusBadge(trip.status)}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/dispatch/trips">
              <Button variant="outline" size="sm" leftIcon={<LuArrowLeft size={14} />}>
                Trips Roster
              </Button>
            </Link>
            {!trip.driverName && trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
              <Link to={`/dispatch/trips/${trip.tripId}/assign`}>
                <Button variant="primary" size="sm" leftIcon={<LuUser size={14} />}>
                  Assign Driver
                </Button>
              </Link>
            )}
            {trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
              <Button variant="danger" size="sm" onClick={() => setShowCancelModal(true)}>
                Cancel Trip
              </Button>
            )}
          </div>
        }
      />

      {actionError && (
        <Alert variant="danger" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {/* Cancellation Prompt Modal */}
      {showCancelModal && (
        <Card style={{ padding: '20px', border: '1px solid var(--color-danger-300)', backgroundColor: 'var(--color-danger-50)' }}>
          <h4 style={{ margin: '0 0 8px 0', color: 'var(--color-danger-900)' }}>Cancel Trip #{trip.tripId}</h4>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger-800)', margin: '0 0 12px 0' }}>
            Cancelling will release assigned orders back to the pending queue and update carrier status.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Reason for cancellation (required)..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                fontSize: 'var(--text-xs)',
              }}
            />
            <Button variant="danger" size="sm" onClick={handleCancel} loading={cancelling}>
              Confirm Cancellation
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCancelModal(false)}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Consolidated Orders Grid */}
      {trip.orders && trip.orders.length > 0 && (
        <Card style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
                Consolidated Cargo Orders ({trip.orders.length})
              </h3>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                Total Payload: {trip.orders.reduce((sum, o) => sum + (o.weightTons || 0), 0).toFixed(1)} T • Total Revenue:{' '}
                {trip.orders.reduce((sum, o) => sum + (o.shippingFee || 0), 0).toLocaleString()} VND
              </span>
            </div>
            <Badge variant="brand" size="sm">
              {trip.orders.reduce((sum, o) => sum + (o.distanceKm || 0), 0).toFixed(1)} km est.
            </Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {trip.orders.map((order) => (
              <div
                key={order.orderId}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-surface-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Link
                    to={`/dispatch/orders/${order.orderId}`}
                    style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-brand-700)' }}
                  >
                    Order #{order.orderId}
                  </Link>
                  <Badge variant="neutral" size="sm">
                    {order.orderStatus}
                  </Badge>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {order.customerName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <div>📍 <strong>Pickup:</strong> {order.pickupAddress}</div>
                  <div>🎯 <strong>Drop:</strong> {order.deliveryAddress}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>{order.weightTons ? `${order.weightTons} T` : '—'}</span>
                  <span>{order.shippingFee ? `${Number(order.shippingFee).toLocaleString()} VND` : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Corridor Map */}
      {trip.orders && trip.orders.length > 0 && <RouteMapCard orders={trip.orders} />}

      {/* Assignment & Operational Specs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Assignment details */}
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            Resource Allocations
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LuUser size={18} />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Assigned Driver</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {trip.driverName || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-brand-50)', color: 'var(--color-brand-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LuTruck size={18} />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Vehicle License</span>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {trip.vehicleLicensePlate || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Schedule & Telemetry */}
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            Schedule Timetable
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: 'var(--text-xs)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Scheduled Departure:</span>
              <strong>{trip.scheduledDeparture ? new Date(trip.scheduledDeparture).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Actual Departure:</span>
              <strong>{trip.actualDeparture ? new Date(trip.actualDeparture).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Pending departure'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Actual Arrival:</span>
              <strong>{trip.actualArrival ? new Date(trip.actualArrival).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'In fulfillment'}</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* Live In-Progress Map */}
      {trip.status?.toUpperCase() === 'IN_PROGRESS' && (
        <Card style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LuNavigation size={18} color="var(--color-brand-600)" />
              <strong style={{ fontSize: 'var(--text-sm)' }}>Active GPS Telemetry Beacon</strong>
            </div>
            {liveLocation && (
              <Badge variant="brand" size="sm">
                Lat {Number(liveLocation.latitude).toFixed(4)}, Lng {Number(liveLocation.longitude).toFixed(4)}
              </Badge>
            )}
          </div>
          <div style={{ height: '320px', width: '100%' }}>
            <MapContainer center={mapCenter} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {routeWaypoints.length > 0 && (
                <Polyline
                  positions={routeWaypoints.map((wp) => [wp.latitude, wp.longitude])}
                  color="#2563eb"
                  weight={3}
                />
              )}
              {liveLocation && (
                <Marker position={[Number(liveLocation.latitude), Number(liveLocation.longitude)]} icon={createDriverMarker()} />
              )}
            </MapContainer>
          </div>
        </Card>
      )}

      {/* Proof of Delivery (POD) for completed trips */}
      {trip.status?.toUpperCase() === 'COMPLETED' && (
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            Proof of Delivery (POD) Verification
          </h3>

          {podLoading ? (
            <LoadingSpinner text="Retrieving delivery receipt..." />
          ) : podError ? (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{podError}</div>
          ) : deliveryConfirmation ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Confirmation Type</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '2px' }}>{deliveryConfirmation.confirmationType}</div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginTop: '12px' }}>Recipient Name</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '2px' }}>{deliveryConfirmation.recipientName || '—'}</div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginTop: '12px' }}>Confirmed At</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginTop: '2px' }}>
                  {new Date(deliveryConfirmation.confirmedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>

              {deliveryConfirmation.signatureData && (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>
                    Recipient Signature
                  </div>
                  <img
                    src={`data:image/png;base64,${deliveryConfirmation.signatureData}`}
                    alt="Signature"
                    style={{ maxWidth: '320px', width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}
                  />
                </div>
              )}
            </div>
          ) : null}
        </Card>
      )}

      {/* Floating Driver Dispatch Chat */}
      <ChatPopup tripId={tripId} driverId={trip?.driverId} trip={trip} />
    </div>
  );
};

export default TripDetailPage;
