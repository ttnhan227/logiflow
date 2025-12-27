import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { tripsOversightService } from '../../services';
import Modal from './Modal';
import './admin.css';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for origin and destination
const originIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Driver current location icon (if available)
const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const statusColor = {
  PENDING: '#e0f2fe',
  ASSIGNED: '#dbeafe',
  IN_TRANSIT: '#fef9c3',
  DELIVERED: '#dcfce7',
  CANCELLED: '#fee2e2',
};

const riskTone = {
  ON_TRACK: { bg: '#ecfdf3', color: '#166534' },
  DUE_SOON: { bg: '#fef9c3', color: '#854d0e' },
  OVERDUE: { bg: '#fee2e2', color: '#991b1b' },
  COMPLETED: { bg: '#e5f5ff', color: '#003d7a' },
  UNKNOWN: { bg: '#e5e7eb', color: '#111827' },
};

const formatTime = (ts) => (ts ? new Date(ts).toLocaleString() : 'N/A');

const RiskTag = ({ risk }) => {
  const tone = riskTone[risk] || riskTone.UNKNOWN;
  return (
    <span className="order-risk-tag" style={{ backgroundColor: tone.bg, color: tone.color }}>
      {risk || 'UNKNOWN'}
    </span>
  );
};

const AdminTripsOversightDetailsPage = () => {
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

  useEffect(() => {
    const loadTrip = async () => {
      try {
        setLoading(true);
        setError(null);
        const tripData = await tripsOversightService.getTripOversight(tripId);
        setTrip(tripData);
      } catch (err) {
        setError('Trip not found or failed to load');
        console.error('Trip detail error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTrip();
  }, [tripId]);

  const handleOverride = async (targetStatus = 'ASSIGNED') => {
    if (!window.confirm(`Override and set trip ${trip.tripId} to ${targetStatus}?`)) return;
    setActingId(trip.tripId);
    try {
      await tripsOversightService.updateTripOrderStatus(trip.tripId, targetStatus);

      // Refresh trip data - force re-render by updating state
      setTrip(null); // Clear current data first
      const updatedTrip = await tripsOversightService.getTripOversight(trip.tripId);
      setTrip(updatedTrip);

      alert(`Trip ${trip.tripId} status updated to ${targetStatus}.`);
    } catch (err) {
      alert('Failed to override status.');
    } finally {
      setActingId(null);
    }
  };

  const handleDelayResponse = async (response, customExtensionMinutes = null) => {
    let confirmationMessage = `Are you sure you want to ${response.toLowerCase()} this trip delay report?`;
    if (response === 'APPROVED' && customExtensionMinutes !== null) {
      confirmationMessage = `Are you sure you want to APPROVE this delay and extend SLA by ${customExtensionMinutes} minutes?`;
    }

    if (!window.confirm(confirmationMessage)) return;
    setActingId(trip.tripId);
    try {
      // Pass custom extension minutes only for APPROVED responses
      await tripsOversightService.respondToTripDelayReport(
        trip.tripId,
        response,
        response === 'APPROVED' ? customExtensionMinutes : null
      );

      // Refresh trip data
      const updatedTrip = await tripsOversightService.getTripOversight(trip.tripId);
      setTrip(updatedTrip);

      alert(`Trip delay ${response.toLowerCase()} response sent to driver.`);
    } catch (err) {
      alert('Failed to respond to trip delay report.');
      console.error('Trip delay response error:', err);
    } finally {
      setActingId(null);
    }
  };

  if (loading) return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>🚛 Trip Details</h1>
      </div>
      <div className="loading-state">
        <span className="loading-spinner"></span> Loading trip details...
      </div>
    </div>
  );

  if (error || !trip) return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>🚛 Trip Details</h1>
      </div>
      <div className="error-banner">{error || 'Trip not found'}</div>
      <div style={{ padding: '20px' }}>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/admin/trips-oversight')}
        >
          ← Back to Trips Oversight
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>🚛 Trip #{trip.tripId}</h1>
            <p>{trip.originCity} → {trip.destinationCity} | {trip.orders?.length || 0} orders | {(trip.totalWeightTon || 0).toFixed(1)} tons</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <RiskTag risk={trip.risk} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-details-container">
        {/* Orders in Trip Card - Minimal Display Like Dispatch */}
        <div className="details-card">
          <div className="card-header">
            <h2>📦 Orders in Trip ({(trip.orders || []).length})</h2>
          </div>
          <div className="card-content">
            {(trip.orders && trip.orders.length > 0) ? (
              <>
                {/* Trip Summary Line */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  <strong>Trip Summary:</strong> {trip.orders.length} order{trip.orders.length > 1 ? 's' : ''} •
                  Total Weight: {trip.orders.reduce((sum, o) => sum + (o.weightTon || 0), 0).toFixed(1)} tons •
                  Total Distance: {trip.orders.reduce((sum, order) => sum + (order.distanceKm || 0), 0).toFixed(1)} km •
                  Total Value: ${(trip.orders.reduce((sum, order) => sum + (order.packageValue || 0), 0)).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
                </div>

                {/* Compact Order Grid */}
                <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                  {trip.orders.map(order => (
                    <div key={order.orderId} style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '16px' }}>#{order.orderId}</strong>
                          <span style={{
                            backgroundColor: order.orderStatus === 'DELIVERED' ? '#dcfce7' :
                                           order.orderStatus === 'IN_TRANSIT' ? '#dbeafe' :
                                           order.orderStatus === 'ASSIGNED' ? '#fef3c7' : '#fee2e2',
                            color: order.orderStatus === 'DELIVERED' ? '#166534' :
                                   order.orderStatus === 'IN_TRANSIT' ? '#1e40af' :
                                   order.orderStatus === 'ASSIGNED' ? '#92400e' : '#dc2626',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: '600',
                            fontSize: '11px'
                          }}>
                            {order.orderStatus}
                          </span>
                          {order.priorityLevel === 'URGENT' && (
                            <span style={{
                              backgroundColor: '#fee2e2',
                              color: '#dc2626',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: '600',
                              fontSize: '11px'
                            }}>
                              URGENT
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: '500', marginBottom: '6px' }}>{order.customerName}</div>
                        <div style={{ color: '#64748b', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div>📍 <strong>Pickup:</strong> {order.pickupAddress}</div>
                          <div>🎯 <strong>Delivery:</strong> {order.deliveryAddress}</div>
                          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                            <span>⚖️ {order.weightTon ? `${order.weightTon.toFixed(1)} t` : 'N/A'}</span>
                            <span>📏 {order.distanceKm ? `${order.distanceKm.toFixed(1)} km` : 'N/A'}</span>
                            <span>💰 {order.packageValue ? `$${order.packageValue}` : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ marginLeft: '16px' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowOrderModal(true);
                          }}
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                        >
                          👁️ Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#9ca3af'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>No Orders</div>
                <div>This trip has no orders assigned</div>
              </div>
            )}
          </div>
        </div>

        {/* Delay Information Card - Put URGENT ITEMS AT TOP */}
        {(trip.delayReason) && (
          <div className="details-card">
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ margin: 0 }}>⏰ Delay Report Review</h2>
                {trip.delayStatus && (
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      backgroundColor:
                        trip.delayStatus === 'APPROVED'
                          ? '#dcfce7'
                          : trip.delayStatus === 'REJECTED'
                          ? '#fee2e2'
                          : '#e0f2fe',
                      color:
                        trip.delayStatus === 'APPROVED'
                          ? '#166534'
                          : trip.delayStatus === 'REJECTED'
                          ? '#991b1b'
                          : '#1d4ed8',
                    }}
                  >
                    {trip.delayStatus}
                  </span>
                )}
              </div>
            </div>
            <div className="card-content">
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#374151' }}>🚫 Delay Reason</h3>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  borderLeft: '4px solid #dc2626'
                }}>
                  <p style={{ margin: 0, color: '#991b1b', fontSize: '14px' }}>
                    {trip.delayReason}
                  </p>
                </div>
              </div>

              {/* Current SLA Extension Status */}
              {trip.slaExtensionMinutes && trip.slaExtensionMinutes > 0 && (
                <div style={{
                  marginBottom: '16px',
                  padding: '12px',
                  backgroundColor: '#ECFDF5',
                  border: '2px solid #10B981',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ fontSize: '20px' }}>⏱️</div>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#065F46', fontSize: '14px' }}>
                        SLA EXTENDED: +{trip.slaExtensionMinutes} minutes
                      </div>
                      <div style={{ fontSize: '12px', color: '#059669' }}>
                        Driver has been notified and SLA is active
                      </div>
                    </div>
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#065F46'
                  }}>
                    ✅
                  </div>
                </div>
              )}

              {/* Admin comment, if any */}
              {trip.delayAdminComment && (
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '8px', color: '#374151' }}>🧾 Admin Decision</h3>
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: '#eff6ff',
                      borderRadius: '6px',
                      borderLeft: '4px solid #3b82f6',
                      fontSize: '13px',
                      color: '#1f2937',
                    }}
                  >
                    {trip.delayAdminComment}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#374151' }}>
                  ⚡ Admin Response Actions
                </h3>

                {/* Conditional action buttons based on approval status */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {!showApprovalInput && !showUpdateSlaInput ? (
                    <>
                      {/* Only allow first approval when no SLA extension yet */}
                      {!trip.slaExtensionMinutes && (
                        <button
                          className="btn btn-success"
                          onClick={() => setShowApprovalInput(true)}
                          disabled={actingId === trip.tripId || trip.delayStatus === 'APPROVED'}
                          style={{ flex: '1 1 150px' }}
                        >
                          ✅ APPROVE
                        </button>
                      )}
                      {/* Allow updating SLA only when already approved */}
                      {trip.slaExtensionMinutes && trip.slaExtensionMinutes > 0 && (
                        <button
                          className="btn btn-warning"
                          onClick={() => setShowUpdateSlaInput(true)}
                          disabled={actingId === trip.tripId || trip.delayStatus !== 'APPROVED'}
                          style={{ flex: '1 1 150px' }}
                        >
                          🟡 UPDATE SLA
                        </button>
                      )}
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelayResponse('REJECTED')}
                        disabled={actingId === trip.tripId || trip.delayStatus === 'REJECTED'}
                        style={{ flex: '1 1 150px' }}
                      >
                        ❌ REJECT
                      </button>
                    </>
                  ) : (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      width: '100%',
                      maxWidth: '350px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: '500' }}>
                          {showApprovalInput ? 'New SLA Extension:' : 'Additional SLA Extension:'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="600"
                          value={customSlaExtension}
                          onChange={(e) => setCustomSlaExtension(parseInt(e.target.value) || 0)}
                          placeholder="0"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            width: '80px',
                            fontSize: '14px'
                          }}
                        />
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>minutes</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success"
                          onClick={async () => {
                            await handleDelayResponse('APPROVED', customSlaExtension);
                            // Auto-close input after success
                            setShowApprovalInput(false);
                            setShowUpdateSlaInput(false);
                          }}
                          disabled={actingId === trip.tripId}
                          style={{ flex: '1' }}
                        >
                          ✓ {showApprovalInput ? 'Approve SLA Extension' : 'Update SLA Extension'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowApprovalInput(false);
                            setShowUpdateSlaInput(false);
                          }}
                          disabled={actingId === trip.tripId}
                          style={{ flex: '1' }}
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
                  {trip.slaExtensionMinutes && trip.slaExtensionMinutes > 0 ? (
                    <>
                      <div>💡 <strong>UPDATE SLA:</strong> Add additional extension minutes to the current {trip.slaExtensionMinutes}-minute extension</div>
                      <div style={{ marginTop: '4px' }}>💡 <strong>REJECT:</strong> Override and reject the delay (removes SLA extension)</div>
                    </>
                  ) : (
                    <div>💡 <strong>APPROVE:</strong> Extend SLA by the specified number of minutes</div>
                  )}
                  <div style={{ marginTop: '4px' }}>💡 Each approval adds to any existing SLA extensions cumulatively</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Combined Route Information & Map */}
        <div className="details-card">
          <div className="card-header" style={{ alignItems: 'center' }}>
            <div>
              <h2 className="card-title">🗺️ Trip Route & Checkpoints</h2>
              <p className="page-subtitle" style={{ margin: 0 }}>Route visualization with actual road paths</p>
            </div>
            {trip.totalDistanceKm != null && (
              <div className="badge" style={{ backgroundColor: '#0ea5e9', fontSize: '14px', fontWeight: '600' }}>
                {trip.totalDistanceKm.toFixed(1)} km
              </div>
            )}
          </div>
          <div className="card-content">
            {/* Route Summary - Combined with Trip Status */}
            <div className="route-summary" style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>📍</div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#1f2937', marginBottom: '4px' }}>
                    Trip #{trip.tripId} • {(trip.orders || []).length} orders • {(trip.totalWeightTon || 0).toFixed(1)} tons
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {trip.tripType ? trip.tripType.toUpperCase() : 'STANDARD'} • {trip.vehicle ? trip.vehicle.plate : 'No vehicle'}
                    {trip.hasUrgentOrders && (
                      <span style={{
                        marginLeft: '8px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626'
                      }}>
                        URGENT ORDERS
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Trip Status Badges */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  backgroundColor: statusColor[trip.tripStatus] || '#f3f4f6',
                  color: '#111827'
                }}>
                  🚛 {trip.tripStatus || 'UNKNOWN'}
                </span>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  backgroundColor: '#dbeafe',
                  color: '#2563eb'
                }}>
                  📦 {(trip.orders || []).length} orders
                </span>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1'
                }}>
                  ⚖️ {(trip.totalWeightTon || 0).toFixed(1)} tons
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
                <span>📏 {trip.totalDistanceKm ? `${trip.totalDistanceKm.toFixed(1)} km` : 'Distance N/A'}</span>
                <span>🏁 {trip.originCity || 'Unknown'} → {trip.destinationCity || 'Unknown'}</span>
              </div>
            </div>

            {/* Route Schedule */}
            <div className="details-grid" style={{ marginBottom: '24px' }}>
              <div className="detail-item">
                <label>🚀 Scheduled Departure</label>
                <div className="detail-value">
                  {trip.scheduledDeparture ? (
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                      {new Date(trip.scheduledDeparture).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  ) : (
                    <span className="muted">Not scheduled</span>
                  )}
                </div>
              </div>
              <div className="detail-item">
                <label>🏁 Scheduled Arrival</label>
                <div className="detail-value">
                  {trip.scheduledArrival ? (
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>
                      {new Date(trip.scheduledArrival).toLocaleString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  ) : (
                    <span className="muted">Not scheduled</span>
                  )}
                </div>
              </div>
            </div>

            {/* Trip Route Map - Order-based waypoints (like RouteMapCard) */}
            <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
              {(() => {
                // Handle multiple orders for trip visualization (same as RouteMapCard.jsx)
                const orders = trip.orders || [];
                if (!orders || orders.length === 0) {
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
                      No orders to display on map
                    </div>
                  );
                }

                const allPoints = [];
                const pickupPoints = [];
                const deliveryPoints = [];
                let totalDistance = 0;

                // Collect all pickup and delivery points (same logic as RouteMapCard)
                orders.forEach((order, index) => {
                  if (order.pickupLat && order.pickupLng) {
                    pickupPoints.push({
                      id: `pickup-${order.orderId}`,
                      lat: Number(order.pickupLat),
                      lng: Number(order.pickupLng),
                      address: order.pickupAddress,
                      orderId: order.orderId,
                      customerName: order.customerName,
                      type: 'pickup'
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
                      type: 'delivery'
                    });
                  }
                  // Add individual order distance
                  if (order.distanceKm) {
                    totalDistance += Number(order.distanceKm);
                  }
                });

                // Create connected route path: Order1 Pickup→Delivery → Order2 Pickup→Delivery → etc.
                const routeSegments = [];
                const sortedOrders = [...orders].sort((a, b) => a.orderId - b.orderId); // Sort by order ID

                sortedOrders.forEach((order, index) => {
                  if (order.pickupLat && order.pickupLng && order.deliveryLat && order.deliveryLng) {
                    // First order: Pickup → Delivery
                    if (index === 0) {
                      routeSegments.push([
                        [Number(order.pickupLat), Number(order.pickupLng)],
                        [Number(order.deliveryLat), Number(order.deliveryLng)]
                      ]);
                    } else {
                      // Subsequent orders: Previous Delivery → Current Pickup → Current Delivery
                      const prevOrder = sortedOrders[index - 1];
                      routeSegments.push([
                        [Number(prevOrder.deliveryLat), Number(prevOrder.deliveryLng)], // Previous delivery
                        [Number(order.pickupLat), Number(order.pickupLng)], // Current pickup
                        [Number(order.deliveryLat), Number(order.deliveryLng)] // Current delivery
                      ]);
                    }
                  }
                });

                // Combine all points for map centering
                const allPointsCombined = [...pickupPoints, ...deliveryPoints];
                const mapCenter = allPointsCombined.length > 0 ? [
                  allPointsCombined.reduce((sum, p) => sum + p.lat, 0) / allPointsCombined.length,
                  allPointsCombined.reduce((sum, p) => sum + p.lng, 0) / allPointsCombined.length
                ] : [15.8, 107.0]; // Vietnam center

                return (
                  <MapContainer
                    center={mapCenter}
                    zoom={allPointsCombined.length > 1 ? 10 : 8}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Show markers for all order locations (same as RouteMapCard) */}
                    {allPointsCombined.map(point => (
                      <Marker
                        key={point.id}
                        position={[point.lat, point.lng]}
                        icon={point.type === 'pickup' ? originIcon : destinationIcon}
                      >
                        <Popup>
                          <div style={{ minWidth: '200px' }}>
                            <strong style={{
                              fontSize: '14px',
                              color: point.type === 'pickup' ? '#10b981' : '#ef4444'
                            }}>
                              {point.type === 'pickup' ? '🟢' : '🔴'} Order #{point.orderId}
                            </strong><br />
                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>
                              {point.type === 'pickup' ? 'Pickup' : 'Delivery'}
                            </span><br />
                            <span style={{ fontSize: '12px', color: '#666' }}>{point.customerName}</span><br />
                            <span style={{ fontSize: '12px', color: '#666' }}>{point.address || 'No address'}</span><br />
                            <span style={{ fontSize: '11px', color: '#999' }}>
                              Lat: {point.lat.toFixed(4)}, Lng: {point.lng.toFixed(4)}
                            </span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}

                    {/* Driver Current Location (if available) */}
                    {trip.driver && trip.driver.currentLat && trip.driver.currentLng && (
                      <Marker
                        position={[parseFloat(trip.driver.currentLat), parseFloat(trip.driver.currentLng)]}
                        icon={driverIcon}
                      >
                        <Popup>
                          <div style={{ minWidth: '200px' }}>
                            <strong style={{ fontSize: '14px', color: '#2563eb' }}>🚗 Driver Location</strong><br />
                            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Driver:</span> {trip.driver.name}<br />
                            <span style={{ fontSize: '12px', color: '#666' }}>
                              Last updated: {new Date().toLocaleTimeString()}
                            </span>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Show route segments for multiple orders (same as RouteMapCard) */}
                    {routeSegments.map((segment, index) => (
                      <Polyline
                        key={`segment-${index}`}
                        positions={segment}
                        color={index % 2 === 0 ? "#2563eb" : "#dc2626"} // Alternate colors like RouteMapCard
                        weight={3}
                        opacity={0.7}
                        lineJoin="round"
                        lineCap="round"
                        dashArray="5, 5"
                      />
                    ))}
                  </MapContainer>
                );
              })()}
            </div>

            <div style={{
              marginTop: '16px',
              padding: '12px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bae6fd',
              fontSize: '13px',
              color: '#0369a1'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>🗺️ Trip Waypoints Legend</div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>🟢 Order Pickups (Green)</span>
                <span>🔴 Order Deliveries (Red)</span>
                <span>🚗 Driver Location (Blue - if available)</span>
                <span>🔗 Route Segments (Blue/Red connecting lines)</span>
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#0284c7' }}>
                Route shows sequential path: Order1 Pickup → Delivery → Order2 Pickup → Delivery → etc.
              </div>
            </div>

            {/* Distance and Fee Estimate Section (like RouteMapCard) */}
            {trip.totalDistanceKm != null && (
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
                    Trip Route Distance
                  </div>
                  <div style={{ fontSize: '13px', color: '#15803d' }}>
                    {trip.totalDistanceKm.toFixed(1)} km • Estimated fee: ${(Math.round(trip.totalDistanceKm * 12)).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline & SLA Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>⏰ Trip Timeline & SLA Status</h2>
          </div>
          <div className="card-content">
            <div className="timeline-container">
              {/* Trip Created */}
              <div className="timeline-item">
                <div className="timeline-icon">📝</div>
                <div className="timeline-content">
                  <div className="timeline-title">Trip Created</div>
                  <div className="timeline-time">{formatTime(trip.createdAt)}</div>
                  <div className="timeline-description">When the trip was planned and created</div>
                </div>
              </div>

              {/* SLA Deadline */}
              <div className="timeline-item">
                <div className="timeline-icon">⚠️</div>
                <div className="timeline-content">
                  <div className="timeline-title" style={{ color: '#dc2626' }}>
                    Trip SLA Deadline
                    {trip.hasUrgentOrders && (
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: '4px',
                        fontWeight: 600
                      }}>
                        URGENT ORDERS
                      </span>
                    )}
                  </div>
                  <div className="timeline-time" style={{ color: '#dc2626' }}>{formatTime(trip.slaDue)}</div>
                  <div className="timeline-description">All orders in this trip must be delivered by this time</div>
                </div>
              </div>

              {/* Expected Arrival */}
              <div className="timeline-item">
                <div className="timeline-icon">🚚</div>
                <div className="timeline-content">
                  <div className="timeline-title" style={{ color: '#059669' }}>Expected Arrival (ETA)</div>
                  <div className="timeline-time" style={{ color: '#059669' }}>{formatTime(trip.eta)}</div>
                  <div className="timeline-description">Estimated time of trip completion</div>
                </div>
              </div>
            </div>

            {/* Time Comparison Alert */}
            {trip.slaDue && trip.eta && (
              <div className="time-comparison-alert"
                style={{
                  marginTop: '20px',
                  padding: '16px',
                  backgroundColor:
                    new Date(trip.eta) > new Date(trip.slaDue) ? '#fee2e2' :
                    new Date(trip.eta).getTime() === new Date(trip.slaDue).getTime() ? '#fef3c7' :
                    '#dcfce7',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${
                    new Date(trip.eta) > new Date(trip.slaDue) ? '#dc2626' :
                    new Date(trip.eta).getTime() === new Date(trip.slaDue).getTime() ? '#f59e0b' :
                    '#16a34a'
                  }`
                }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                  {new Date(trip.eta) > new Date(trip.slaDue)
                    ? '⚠️ WARNING: ETA is after trip SLA deadline'
                    : new Date(trip.eta).getTime() === new Date(trip.slaDue).getTime()
                    ? '⚡ TIGHT: ETA equals trip SLA deadline (no buffer)'
                    : '✅ ON TRACK: ETA is before trip SLA deadline'}
                </div>
                <div style={{ fontSize: '13px', color: '#4b5563' }}>
                  {(() => {
                    const etaDate = new Date(trip.eta);
                    const slaDate = new Date(trip.slaDue);
                    const diffMinutes = Math.round((etaDate - slaDate) / 60000);
                    if (diffMinutes > 0) {
                      return `Trip will be ${diffMinutes} minutes late`;
                    } else if (diffMinutes === 0) {
                      return 'No time buffer - any delay will cause SLA miss';
                    } else {
                      return `${Math.abs(diffMinutes)} minutes buffer before SLA deadline`;
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>



        {/* Assignment Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>👤 Assignment Details</h2>
          </div>
          <div className="card-content">
            {(trip.driver || trip.vehicle) ? (
              <div>
                {/* Driver Section */}
                {trip.driver && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#374151' }}>👨‍✈️ Driver</h3>
                    <div className="details-grid">
                      <div className="detail-item">
                        <label>👤 Name</label>
                        <div className="detail-value">{trip.driver.name}</div>
                      </div>
                      {trip.driver.phone && (
                        <div className="detail-item">
                          <label>📞 Phone</label>
                          <div className="detail-value">{trip.driver.phone}</div>
                        </div>
                      )}
                      <div className="detail-item">
                        <label>📊 Status</label>
                        <div className="detail-value">
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: trip.driver.status === 'AVAILABLE' ? '#dcfce7' : '#dbeafe',
                            color: trip.driver.status === 'AVAILABLE' ? '#15803d' : '#2563eb'
                          }}>
                            {trip.driver.status || 'ASSIGNED'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vehicle Section */}
                {trip.vehicle && (
                  <div>
                    <h3 style={{ marginTop: 0, marginBottom: '12px', color: '#374151' }}>
                      {(() => {
                        switch (trip.vehicle.type?.toLowerCase()) {
                          case 'van': return '🚐';
                          case 'truck': return '🚚';
                          case 'container': return '📦';
                          default: return '🚗';
                        }
                      })()}
                      {' Vehicle'}
                    </h3>
                    <div className="details-grid">
                      <div className="detail-item">
                        <label>🚗 License Plate</label>
                        <div className="detail-value">
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#1f2937',
                            backgroundColor: '#fff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '2px solid #e5e7eb'
                          }}>
                            {trip.vehicle.plate}
                          </span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <label>🚛 Type</label>
                        <div className="detail-value">
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: (() => {
                              switch (trip.vehicle.type?.toLowerCase()) {
                                case 'van': return '#dbeafe';
                                case 'truck': return '#ede9fe';
                                case 'container': return '#d1fae5';
                                default: return '#f3f4f6';
                              }
                            })(),
                            color: (() => {
                              switch (trip.vehicle.type?.toLowerCase()) {
                                case 'van': return '#3b82f6';
                                case 'truck': return '#8b5cf6';
                                case 'container': return '#10b981';
                                default: return '#6b7280';
                              }
                            })()
                          }}>
                            {(() => {
                              switch (trip.vehicle.type?.toLowerCase()) {
                                case 'van': return '🚐 Van';
                                case 'truck': return '🚚 Truck';
                                case 'container': return '📦 Container';
                                default: return trip.vehicle.type;
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <label>⚖️ Capacity</label>
                        <div className="detail-value">
                          <span style={{ fontWeight: 600, fontSize: '16px' }}>{trip.vehicle.capacityTons || 0}</span>
                          <span style={{ fontWeight: 600, color: '#6b7280' }}> tons</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <label>📊 Status</label>
                        <div className="detail-value">
                          <span style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: trip.vehicle.status === 'AVAILABLE' ? '#dcfce7' : '#dbeafe',
                            color: trip.vehicle.status === 'AVAILABLE' ? '#15803d' : '#2563eb'
                          }}>
                            {trip.vehicle.status || 'ASSIGNED'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#9ca3af'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <div style={{ fontSize: '16px', marginBottom: '8px' }}>No Assignment Yet</div>
                <div>Driver and vehicle have not been assigned to this trip</div>
              </div>
            )}
          </div>
        </div>



      </div>

      {/* Action Buttons */}
      <div className="admin-details-actions">
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/admin/trips-oversight')}
        >
          ← Back to Trips Oversight
        </button>
      </div>

      {/* Order Detail Modal */}
      {showOrderModal && selectedOrder && (
        <Modal
          isOpen={showOrderModal}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedOrder(null);
          }}
          title={`📦 Order #${selectedOrder.orderId} Details`}
          size="large"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Order Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '16px' }}>👤 Customer Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div><strong>Name:</strong> {selectedOrder.customerName}</div>
                  {selectedOrder.customerPhone && <div><strong>Phone:</strong> {selectedOrder.customerPhone}</div>}
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '16px' }}>📊 Order Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div><strong>Status:</strong>
                    <span style={{
                      display: 'inline-block',
                      marginLeft: '8px',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: statusColor[selectedOrder.orderStatus] || '#f3f4f6',
                      color: '#111827'
                    }}>
                      {selectedOrder.orderStatus || 'UNKNOWN'}
                    </span>
                  </div>
                  <div><strong>Priority:</strong>
                    <span style={{
                      display: 'inline-block',
                      marginLeft: '8px',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: selectedOrder.priorityLevel === 'URGENT' ? '#fee2e2' : '#dbeafe',
                      color: selectedOrder.priorityLevel === 'URGENT' ? '#dc2626' : '#2563eb'
                    }}>
                      {selectedOrder.priorityLevel || 'STANDARD'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pickup Type Specific Information */}
            <div style={{ padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '2px solid #bae6fd' }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#0369a1', fontSize: '18px' }}>
                📍 Pickup Information
              </h3>

              {selectedOrder.pickupType === 'STANDARD' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: '#f3f4f6',
                      color: '#6b7280'
                    }}>
                      📍 STANDARD PICKUP
                    </span>
                  </div>
                  <p style={{ margin: '0', color: '#374151' }}>
                    Standard pickup from the customer's specified address.
                  </p>
                </div>
              )}

              {selectedOrder.pickupType === 'WAREHOUSE' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2'
                    }}>
                      🏭 WAREHOUSE PICKUP
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <strong>Warehouse Name:</strong><br />
                      <span style={{ fontSize: '16px', color: '#1e40af' }}>{selectedOrder.warehouseName || 'N/A'}</span>
                    </div>
                    <div>
                      <strong>Dock Number:</strong><br />
                      <span style={{ fontSize: '16px', color: '#1e40af', fontFamily: 'monospace' }}>{selectedOrder.dockNumber || 'N/A'}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <strong>Instructions:</strong> Driver must arrive at the specified warehouse and dock for pickup. Contact warehouse staff upon arrival.
                  </div>
                </div>
              )}

              {selectedOrder.pickupType === 'PORT_TERMINAL' && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '14px',
                      fontWeight: '600',
                      backgroundColor: '#e3f2fd',
                      color: '#1976d2'
                    }}>
                      🚢 PORT TERMINAL PICKUP
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <strong>Container Number:</strong><br />
                      <span style={{ fontSize: '16px', color: '#1e40af', fontFamily: 'monospace', fontWeight: 'bold' }}>{selectedOrder.containerNumber || 'N/A'}</span>
                    </div>
                    <div>
                      <strong>Terminal Name:</strong><br />
                      <span style={{ fontSize: '16px', color: '#1e40af' }}>{selectedOrder.terminalName || 'N/A'}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                    <strong>Instructions:</strong> Driver must arrive at the port terminal and locate the specified container. Terminal staff will assist with loading procedures. Security clearance may be required.
                  </div>
                </div>
              )}

              <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'white', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <strong>Pickup Address:</strong><br />
                <span style={{ color: '#374151' }}>{selectedOrder.pickupAddress}</span>
              </div>
            </div>

            {/* Package Details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '16px' }}>� Package Information</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div><strong>Description:</strong> {selectedOrder.packageDetails || 'No description provided'}</div>
                  <div><strong>Weight:</strong> {selectedOrder.weightTon ? `${selectedOrder.weightTon.toFixed(2)} tons` : 'N/A'}</div>
                  <div><strong>Value:</strong> {selectedOrder.packageValue ? `$${selectedOrder.packageValue}` : 'N/A'}</div>
                </div>
              </div>

              <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '16px' }}>⏰ Delivery Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div><strong>SLA Due:</strong> {selectedOrder.slaDue ? new Date(selectedOrder.slaDue).toLocaleString() : 'N/A'}</div>
                  <div><strong>ETA:</strong> {selectedOrder.eta ? new Date(selectedOrder.eta).toLocaleString() : 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '2px solid #f59e0b' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#92400e', fontSize: '16px' }}>🏠 Delivery Address</h3>
              <div style={{ fontSize: '16px', color: '#92400e', fontWeight: '500' }}>
                {selectedOrder.deliveryAddress}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminTripsOversightDetailsPage;
