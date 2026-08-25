import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { divIcon } from 'leaflet';
import { tripsOversightService } from '../../services';
import {
  Button,
  Card,
  Badge,
  Modal,
  Input,
  PageHeader,
  Alert,
  LoadingSpinner,
} from '@/components/ui';
import {
  LuTruck,
  LuUser,
  LuMapPin,
  LuCalendar,
  LuClock,
  LuTriangleAlert,
  LuCheck,
  LuX,
  LuArrowLeft,
  LuZap,
} from 'react-icons/lu';

const createPin = (color, label) =>
  divIcon({
    html: `
      <div style="
        background-color: ${color};
        color: white;
        border: 2px solid white;
        border-radius: 9999px;
        padding: 2px 8px;
        font-size: 10px;
        font-weight: 700;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        white-space: nowrap;
      ">
        ${label}
      </div>
    `,
    iconSize: [60, 22],
    iconAnchor: [30, 11],
  });

export const AdminTripsOversightDetailsPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);
  const [showApprovalInput, setShowApprovalInput] = useState(false);
  const [showUpdateSlaInput, setShowUpdateSlaInput] = useState(false);
  const [customSlaExtension, setCustomSlaExtension] = useState(30);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadTrip = async () => {
    try {
      setLoading(true);
      setError(null);
      const tripData = await tripsOversightService.getTripOversight(tripId);
      setTrip(tripData);
    } catch (err) {
      setError('Trip record not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const handleDelayResponse = async (response, customExtensionMinutes = null) => {
    if (!window.confirm(`Confirm ${response} decision for Trip #${trip.tripId} delay report?`)) return;
    setActingId(trip.tripId);
    try {
      await tripsOversightService.respondToTripDelayReport(
        trip.tripId,
        response,
        response === 'APPROVED' ? customExtensionMinutes : null
      );
      await loadTrip();
      setShowApprovalInput(false);
      setShowUpdateSlaInput(false);
    } catch {
      alert('Failed to submit SLA decision.');
    } finally {
      setActingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage text="Retrieving comprehensive trip telemetry..." />;
  }

  if (error || !trip) {
    return (
      <div style={{ padding: '24px', maxWidth: '600px' }}>
        <Alert variant="danger">{error || 'Trip not found.'}</Alert>
        <div style={{ marginTop: '16px' }}>
          <Link to="/admin/trips-oversight">
            <Button variant="outline" leftIcon={<LuArrowLeft size={14} />}>
              Back to Oversight
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const orders = trip.orders || [];
  const pickupPoints = [];
  const deliveryPoints = [];

  orders.forEach((o) => {
    if (o.pickupLat && o.pickupLng) {
      pickupPoints.push({
        id: `p-${o.orderId}`,
        lat: Number(o.pickupLat),
        lng: Number(o.pickupLng),
        label: `P#${o.orderId}`,
        name: o.customerName,
        address: o.pickupAddress,
        type: 'pickup',
      });
    }
    if (o.deliveryLat && o.deliveryLng) {
      deliveryPoints.push({
        id: `d-${o.orderId}`,
        lat: Number(o.deliveryLat),
        lng: Number(o.deliveryLng),
        label: `D#${o.orderId}`,
        name: o.customerName,
        address: o.deliveryAddress,
        type: 'delivery',
      });
    }
  });

  const allMapPoints = [...pickupPoints, ...deliveryPoints];
  const mapCenter =
    allMapPoints.length > 0
      ? [
          allMapPoints.reduce((s, p) => s + p.lat, 0) / allMapPoints.length,
          allMapPoints.reduce((s, p) => s + p.lng, 0) / allMapPoints.length,
        ]
      : [16.0471, 108.2068];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={`Trip #${trip.tripId} Oversight`}
        description={`${trip.originCity || 'Origin'} → ${trip.destinationCity || 'Dest'} • ${(trip.totalWeightTon || 0).toFixed(1)} T Payload`}
        badge={<Badge variant="brand">{trip.tripStatus || 'IN SERVICE'}</Badge>}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/admin/trips-oversight">
              <Button variant="outline" size="sm" leftIcon={<LuArrowLeft size={14} />}>
                Trips Oversight Roster
              </Button>
            </Link>
          </div>
        }
      />

      {/* Delay Exception Review Banner */}
      {trip.delayReason && (
        <Card style={{ padding: '24px', border: '1px solid var(--color-warning-300)', backgroundColor: 'var(--color-warning-50)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LuTriangleAlert size={20} color="var(--color-warning-800)" />
              <h3 style={{ margin: 0, fontSize: 'var(--text-md)', color: 'var(--color-warning-900)' }}>
                Driver Delay Exception Report
              </h3>
            </div>
            {trip.delayStatus && (
              <Badge variant={trip.delayStatus === 'APPROVED' ? 'success' : trip.delayStatus === 'REJECTED' ? 'danger' : 'warning'} size="md">
                {trip.delayStatus}
              </Badge>
            )}
          </div>

          <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-warning-200)', fontSize: 'var(--text-xs)', color: 'var(--color-slate-900)', marginBottom: '16px' }}>
            <strong>Carrier Delay Reason:</strong> {trip.delayReason}
          </div>

          {trip.slaExtensionMinutes > 0 && (
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-success-50)', border: '1px solid var(--color-success-200)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--color-success-900)', marginBottom: '16px', fontWeight: 600 }}>
              ✓ SLA Extension Authorized: +{trip.slaExtensionMinutes} minutes granted.
            </div>
          )}

          {/* Action Decision Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {!showApprovalInput && !showUpdateSlaInput ? (
              <>
                {!trip.slaExtensionMinutes && (
                  <Button variant="primary" size="sm" onClick={() => setShowApprovalInput(true)} disabled={actingId === trip.tripId}>
                    Authorize SLA Extension
                  </Button>
                )}
                {trip.slaExtensionMinutes > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowUpdateSlaInput(true)} disabled={actingId === trip.tripId}>
                    Adjust SLA Minutes
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={() => handleDelayResponse('REJECTED')} disabled={actingId === trip.tripId}>
                  Reject Delay Report
                </Button>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Input
                  type="number"
                  min="0"
                  max="600"
                  value={customSlaExtension}
                  onChange={(e) => setCustomSlaExtension(parseInt(e.target.value) || 0)}
                  placeholder="Minutes"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDelayResponse('APPROVED', customSlaExtension)}
                  loading={actingId === trip.tripId}
                >
                  Confirm +{customSlaExtension} min
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowApprovalInput(false);
                    setShowUpdateSlaInput(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Orders Grid */}
      <Card style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
              Consolidated Manifest Orders ({orders.length})
            </h3>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
              Total Weight: {(trip.totalWeightTon || 0).toFixed(1)} T • Total Distance: {trip.totalDistanceKm ? `${trip.totalDistanceKm.toFixed(1)} km` : '—'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
          {orders.map((order) => (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'var(--color-brand-700)', fontSize: 'var(--text-xs)' }}>
                  Order #{order.orderId}
                </strong>
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--border-default)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {order.weightTon ? `${order.weightTon.toFixed(1)} T` : '—'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowOrderModal(true);
                  }}
                >
                  Order Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Corridor Map */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <strong style={{ fontSize: 'var(--text-sm)' }}>Nationwide Linehaul Waypoints Map</strong>
          <Badge variant="brand" size="sm">{allMapPoints.length} Checkpoints</Badge>
        </div>
        <div style={{ height: '360px', width: '100%' }}>
          <MapContainer center={mapCenter} zoom={allMapPoints.length > 1 ? 9 : 6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              subdomains={['a', 'b', 'c']}
              maxZoom={19}
              keepBuffer={8}
              crossOrigin="anonymous"
            />
            {allMapPoints.map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={createPin(p.type === 'pickup' ? '#2563eb' : '#059669', p.label)}
              >
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <strong style={{ fontSize: '12px' }}>{p.name}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.address}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </Card>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <Modal
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
          title={`Order #${selectedOrder.orderId} Manifest`}
          description={`Customer: ${selectedOrder.customerName} • Status: ${selectedOrder.orderStatus}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: 'var(--text-xs)' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Pickup Location:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{selectedOrder.pickupAddress}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Delivery Destination:</span>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{selectedOrder.deliveryAddress}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Payload Weight:</span>
                <div style={{ fontWeight: 600 }}>{selectedOrder.weightTon ? `${selectedOrder.weightTon.toFixed(1)} T` : '—'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Tariff Fee:</span>
                <div style={{ fontWeight: 600 }}>{selectedOrder.packageValue ? `${selectedOrder.packageValue.toLocaleString()} VND` : '—'}</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminTripsOversightDetailsPage;
