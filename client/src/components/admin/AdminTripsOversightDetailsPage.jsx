import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { tripsOversightService } from '../../services';
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

        {/* Trip Status Overview Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>🚛 Trip Status Overview</h2>
          </div>
          <div className="card-content">
            <div className="details-grid">
              <div className="detail-item">
                <label>🚛 Trip Status</label>
                <div className="detail-value">
                  <span
                    className="order-badge"
                    style={{
                      backgroundColor: statusColor[trip.tripStatus] || '#f3f4f6',
                      color: '#111827',
                    }}
                  >
                    {trip.tripStatus || 'UNKNOWN'}
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <label>📋 Trip Type</label>
                <div className="detail-value">
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: '#dbeafe',
                    color: '#2563eb'
                  }}>
                    {trip.tripType || 'STANDARD'}
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <label>📦 Order Count</label>
                <div className="detail-value">
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: trip.hasUrgentOrders ? '#fee2e2' : '#dbeafe',
                    color: trip.hasUrgentOrders ? '#dc2626' : '#2563eb'
                  }}>
                    {(trip.orders || []).length} orders
                    {trip.hasUrgentOrders && ' • URGENT'}
                  </span>
                </div>
              </div>
              <div className="detail-item">
                <label>⚖️ Total Weight</label>
                <div className="detail-value">
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1'
                  }}>
                    {(trip.totalWeightTon || 0).toFixed(1)} tons
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Route Information Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>🗺️ Route Information</h2>
          </div>
          <div className="card-content">
            <div className="route-summary" style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>📍</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: '#1f2937' }}>
                  {trip.originCity || trip.originAddress || 'Unknown'} → {trip.destinationCity || trip.destinationAddress || 'Unknown'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '14px', color: '#6b7280' }}>
                <span>📏 {trip.totalDistanceKm ? `${trip.totalDistanceKm} km` : 'Distance N/A'}</span>
                <span>⚡ {trip.totalWeightTon ? `${trip.totalWeightTon.toFixed(1)} tons` : 'Weight N/A'}</span>
                <span>🕐 {trip.tripType ? trip.tripType.toUpperCase() : 'STANDARD'}</span>
              </div>
            </div>

            <div className="details-grid">
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
          </div>
        </div>

        {/* Trip Route Map */}
        <div className="details-card">
          <div className="card-header">
            <h2>🗺️ Trip Route Map</h2>
          </div>
          <div className="card-content">
            <div style={{ height: '400px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '2px solid #e5e7eb' }}>
              <MapContainer
                center={[
                  (parseFloat(trip.originLat || 0) + parseFloat(trip.destinationLat || 0)) / 2 || 15.8,
                  (parseFloat(trip.originLng || 0) + parseFloat(trip.destinationLng || 0)) / 2 || 107.0
                ]}
                zoom={8}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Origin Marker */}
                {trip.originLat && trip.originLng && (
                  <Marker
                    position={[parseFloat(trip.originLat), parseFloat(trip.originLng)]}
                    icon={originIcon}
                  >
                    <Popup>
                      <div style={{ minWidth: '200px' }}>
                        <strong style={{ fontSize: '14px', color: '#16a34a' }}>🟢 Origin</strong><br />
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Departure:</span><br />
                        <span style={{ fontSize: '12px', color: '#666' }}>{trip.originAddress || trip.originCity}</span>
                        {trip.scheduledDeparture && (
                          <div style={{ marginTop: '4px', fontSize: '12px' }}>
                            <strong>Scheduled:</strong> {new Date(trip.scheduledDeparture).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Destination Marker */}
                {trip.destinationLat && trip.destinationLng && (
                  <Marker
                    position={[parseFloat(trip.destinationLat), parseFloat(trip.destinationLng)]}
                    icon={destinationIcon}
                  >
                    <Popup>
                      <div style={{ minWidth: '200px' }}>
                        <strong style={{ fontSize: '14px', color: '#dc2626' }}>🔴 Destination</strong><br />
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Arrival:</span><br />
                        <span style={{ fontSize: '12px', color: '#666' }}>{trip.destinationAddress || trip.destinationCity}</span>
                        {trip.scheduledArrival && (
                          <div style={{ marginTop: '4px', fontSize: '12px' }}>
                            <strong>Scheduled:</strong> {new Date(trip.scheduledArrival).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                )}

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

                {/* Route Line - Direct line between origin and destination */}
                {trip.originLat && trip.originLng && trip.destinationLat && trip.destinationLng && (
                  <Polyline
                    positions={[
                      [parseFloat(trip.originLat), parseFloat(trip.originLng)],
                      [parseFloat(trip.destinationLat), parseFloat(trip.destinationLng)]
                    ]}
                    color="#3b82f6"
                    weight={3}
                    opacity={0.7}
                  />
                )}
              </MapContainer>
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
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>🗺️ Map Legend</div>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>🟢 Origin (Green)</span>
                <span>🔴 Destination (Red)</span>
                <span>🚗 Driver Location {trip.driver && trip.driver.currentLat && trip.driver.currentLng ?
                  `(${parseFloat(trip.driver.currentLat).toFixed(6)}, ${parseFloat(trip.driver.currentLng).toFixed(6)})` :
                  '(Blue - if available)'}</span>
                <span>🔵 Route Path</span>
              </div>
            </div>
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
                          <span style={{ fontWeight: 600, fontSize: '16px' }}>{(trip.vehicle.capacity / 1000).toFixed(1)}</span>
                          <span style={{ fontWeight: 600, color: '#6b7280' }}> tons</span>
                          <span style={{ color: '#9ca3af', fontSize: '12px', marginLeft: '8px' }}>
                            ({trip.vehicle.capacity} toones)
                          </span>
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

        {/* Orders in Trip Card */}
        <div className="details-card">
          <div className="card-header">
            <h2>📦 Orders in Trip ({(trip.orders || []).length})</h2>
          </div>
          <div className="card-content">
            {(trip.orders && trip.orders.length > 0) ? (
              <div className="admin-table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Package</th>
                      <th>Priority</th>
                      <th>SLA Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trip.orders.map((order) => (
                      <tr key={order.orderId}>
                        <td>
                          <span style={{ fontWeight: 600 }}>{order.orderId}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{order.customerName}</div>
                          {order.customerPhone && (
                            <div className="muted small">📞 {order.customerPhone}</div>
                          )}
                        </td>
                        <td>
                          <div className="muted small">{order.packageDetails}</div>
                          <div className="muted small">{order.weightTon?.toFixed(1)} Tons • {order.packageValue ? `$${order.packageValue}` : 'N/A'}</div>
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: order.priorityLevel === 'URGENT' ? '#fee2e2' : '#dbeafe',
                            color: order.priorityLevel === 'URGENT' ? '#dc2626' : '#2563eb'
                          }}>
                            {order.priorityLevel || 'STANDARD'}
                          </span>
                        </td>
                        <td>
                          {order.slaDue ? (
                            <>
                              <div style={{ fontSize: '13px', fontWeight: 500 }}>
                                {new Date(order.slaDue).toLocaleDateString()}
                              </div>
                              <div className="muted small">
                                {new Date(order.slaDue).toLocaleTimeString()}
                              </div>
                            </>
                          ) : (
                            <span className="muted">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
    </div>
  );
};

export default AdminTripsOversightDetailsPage;
