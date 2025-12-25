import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService } from '../../services';
import './dispatch.css';
import './modern-dispatch.css';

const TripAssignPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const formatMoney = (amount) => {
    if (amount == null) return 'N/A';
    try {
      return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 });
    } catch (_err) {
      return `${amount} VND`;
    }
  };
  const [trip, setTrip] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [driversLoading, setDriversLoading] = useState(false);
  const [showEligibleOnly, setShowEligibleOnly] = useState(false);

  const loadDrivers = async () => {
    setDriversLoading(true);
    try {
      const drv = await tripService.getAvailableDrivers();
      console.log('Drivers loaded:', drv);
      setDrivers(drv || []);
    } catch (ex) {
      console.error('Failed to load drivers', ex?.response?.data || ex);
      setError(`Failed to load drivers: ${ex?.response?.data?.error || ex?.message || 'Unknown error'}`);
    } finally {
      setDriversLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const rec = await tripService.getRecommendedDrivers(tripId, 20);
      setRecommended(rec || []);
    } catch (ex) {
      console.error('Failed to load recommendations', ex?.response?.data || ex);
      // keep non-blocking; dispatcher can still use old list
    }
  };

  useEffect(() => {
    const load = async () => {
      setError(null);

      try {
        // Load trip with full details
        const tripDetail = await tripService.getTripById(tripId);
        if (!tripDetail) {
          setError('Trip not found');
          return;
        }
        setTrip(tripDetail);
      } catch (ex) {
        console.error('Failed to load trip', ex?.response?.data || ex);
        setError(`Failed to load trip: ${ex?.response?.data?.error || ex?.message || 'Unknown error'}`);
        return;
      }

      // Load drivers immediately (fast)
      await loadDrivers();
      // Load recommendations in background (can be slow)
      loadRecommendations();
    };
    load();
  }, [tripId]);

  const isLicenseCompatible = (driverLicense, requiredLicense) => {
    if (!requiredLicense) return true; // No requirement
    if (!driverLicense) return false; // Driver has no license
    return driverLicense.toUpperCase() === requiredLicense.toUpperCase();
  };

  const onAssign = async () => {
    if (!selectedDriver) return setError('Select a driver');
    const rec = (recommended || []).find(r => Number(r.driverId) === Number(selectedDriver));
    if (rec && rec.eligible === false) {
      return setError('Selected driver is not eligible (see reasons). Please choose an eligible driver.');
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await tripService.assignTrip(trip.tripId, { driverId: Number(selectedDriver), vehicleId: null });
      setSuccess('Driver assigned successfully! Redirecting to trip details...');
      // Navigate to trip detail page after showing success message
      setTimeout(() => {
        navigate(`/dispatch/trips/${trip.tripId}`, { state: { reload: true } });
      }, 1500);
    } catch (ex) {
      console.error(ex);
      const errorMsg = ex?.response?.data?.message || ex?.response?.data?.error || ex?.error || ex?.message || 'Assignment failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Assign Trip #{tripId}</h1>
          <p className="page-subtitle">Select a driver for this delivery trip</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate('/dispatch/trips')}>
            ← Back to Trips
          </button>
        </div>
      </div>

      {error && (
        <div className="error-state" style={{ marginBottom: '1.5rem' }}>
          <div className="error-icon">❌</div>
          <h3>Assignment Error</h3>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="success-state" style={{ marginBottom: '1.5rem' }}>
          <div className="success-icon">✅</div>
          <h3>Assignment Successful</h3>
          <p>{success}</p>
        </div>
      )}

      {!trip && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading trip details...</p>
        </div>
      )}

      {trip && (
        <>
          {/* Trip Information Card */}
          <div className="detail-card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div>
                <strong>Route:</strong> {trip.routeName}
              </div>
              <div>
                <strong>Scheduled Departure:</strong> {new Date(trip.scheduledDeparture).toLocaleString('en-GB')}
              </div>
              <div>
                <strong>Vehicle:</strong> {trip.vehicleLicensePlate} ({trip.vehicleType})
              </div>
              <div>
                <strong>Required License:</strong> {trip.vehicleRequiredLicense || 'None'}
              </div>
            </div>
          </div>

          {/* License Warning */}
          {(() => {
            const required = trip.vehicleRequiredLicense;
            const selected = drivers.find(d => Number(d.driverId) === Number(selectedDriver));
            if (!required || !selected) return null;
            const compatible = isLicenseCompatible(selected.licenseType, required);
            if (compatible) return null;
            const driverLicense = selected.licenseType || selected.license_type || 'N/A';
            return (
              <div style={{
                padding: '1rem',
                marginBottom: '1.5rem',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                color: '#dc2626',
                fontWeight: '500'
              }}>
                ⚠️ Driver license ({driverLicense}) does not match vehicle requirement ({required})
              </div>
            );
          })()}

          {/* Orders Section */}
          {trip.orders && trip.orders.length > 0 && (
            <div className="detail-card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.25rem', fontWeight: '600' }}>
                Orders in this Trip ({trip.orders.length})
              </h3>
              <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Pickup Address</th>
                      <th>Pickup Type</th>
                      <th>Weight</th>
                      <th>Distance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trip.orders.map((order, idx) => (
                      <tr key={order.orderId || idx}>
                        <td className="cell-id">#{order.orderId}</td>
                        <td className="cell-text">{order.customerName}</td>
                        <td className="cell-text" style={{ maxWidth: '200px' }} title={order.pickupAddress}>
                          {order.pickupAddress}
                        </td>
                        <td className="cell-text">
                          <span style={{
                            backgroundColor: order.pickupType === 'PORT_TERMINAL' ? '#fef3c7' : '#dbeafe',
                            color: order.pickupType === 'PORT_TERMINAL' ? '#92400e' : '#0c4a6e',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {order.pickupType || 'STANDARD'}
                          </span>
                        </td>
                        <td className="cell-text">{order.weightTons ? `${order.weightTons.toFixed(1)} t` : '-'}</td>
                        <td className="cell-text">{order.distanceKm ? `${order.distanceKm.toFixed(1)} km` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Trip Summary */}
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '0.5rem'
              }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#1e293b', fontSize: '1rem', fontWeight: '600' }}>
                  Trip Summary
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                  <div><strong>Total Orders:</strong> {trip.orders.length}</div>
                  <div><strong>Total Weight:</strong> {trip.orders.reduce((sum, o) => sum + (o.weightTons || 0), 0).toFixed(1)} tons</div>
                  <div><strong>Total Distance:</strong> {trip.route?.distanceKm ? `${trip.route.distanceKm.toFixed(1)} km` : 'N/A'}</div>
                  <div><strong>Total Fee:</strong> {trip.route?.totalFee ? formatMoney(trip.route.totalFee) : 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Driver Selection Section */}
          <div className="detail-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem', fontWeight: '600' }}>
                Select Driver
              </h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={showEligibleOnly}
                  onChange={e => setShowEligibleOnly(e.target.checked)}
                />
                Show eligible only
              </label>
            </div>

            {driversLoading && (
              <div className="loading-state" style={{ padding: '2rem' }}>
                <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
                <p>Loading available drivers...</p>
              </div>
            )}

            {!driversLoading && drivers && drivers.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '0.5rem',
                  fontSize: '0.9rem',
                  color: '#0c4a6e'
                }}>
                  <strong>Available Vehicles:</strong> {drivers.length} vehicle{drivers.length !== 1 ? 's' : ''} with compatible drivers found.
                  {recommended && recommended.length > 0 && (
                    <span style={{ marginLeft: '1rem' }}>
                      Driver recommendations loaded ({recommended.length} evaluated).
                    </span>
                  )}
                  {(!recommended || recommended.length === 0) && (
                    <span style={{ marginLeft: '1rem', color: '#64748b' }}>
                      Loading driver recommendations...
                    </span>
                  )}
                </div>
              </div>
            )}

            {!driversLoading && drivers && drivers.length > 0 && (
              <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}></th>
                      <th>Name</th>
                      <th style={{ width: '80px' }}>Score</th>
                      <th style={{ width: '120px' }}>Eligible</th>
                      <th style={{ width: '100px' }}>Proximity</th>
                      <th>Reasons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recommended && recommended.length > 0 ? (
                      // Show recommendations when available
                      (showEligibleOnly ? recommended.filter(r => r.eligible) : recommended).map(r => {
                        const reasons = Array.isArray(r.reasons) ? r.reasons : [];
                        const gatingPrefixes = [
                          'Not available',
                          'Not fit',
                          'Rest required',
                          'License mismatch',
                          'Over capacity',
                          'Already has active assignment'
                        ];
                        const gating = reasons.filter(x => gatingPrefixes.some(p => (x || '').startsWith(p)));
                        const nonGating = reasons.filter(x => !gating.includes(x));
                        const ordered = [...gating, ...nonGating];
                        const firstGating = gating.length > 0 ? gating[0] : null;

                        return (
                          <tr key={r.driverId} style={{ opacity: r.eligible ? 1 : 0.6 }}>
                            <td>
                              <input
                                type="radio"
                                name="driver"
                                value={r.driverId}
                                onChange={e => setSelectedDriver(e.target.value)}
                              />
                            </td>
                            <td className="cell-text">{r.fullName || `Driver #${r.driverId}`}</td>
                            <td className="cell-text">{typeof r.score === 'number' ? r.score.toFixed(1) : r.score}</td>
                            <td className="cell-text">
                              <span style={{
                                color: r.eligible ? '#10b981' : '#ef4444',
                                fontWeight: '600',
                                fontSize: '12px'
                              }}>
                                {r.eligible ? '✓ Eligible' : `✗ Ineligible`}
                              </span>
                              {firstGating && (
                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                  {firstGating}
                                </div>
                              )}
                            </td>
                            <td className="cell-text">
                              {typeof r.distanceToPickupKm === 'number' ? `${r.distanceToPickupKm.toFixed(1)} km` : 'N/A'}
                            </td>
                            <td className="cell-text" style={{ maxWidth: '300px' }}>
                              {ordered.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: '1rem', fontSize: '12px' }}>
                                  {ordered.slice(0, 3).map((reason, idx) => (
                                    <li key={idx} style={{ marginBottom: '2px' }}>{reason}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span style={{ color: '#6b7280', fontSize: '12px' }}>No issues</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      // Show basic driver list while recommendations load
                      drivers.slice(0, 10).map((driver, index) => (
                        <tr key={driver.vehicleId || index}>
                          <td>
                            <input
                              type="radio"
                              name="driver"
                              value={driver.vehicleId}
                              onChange={e => setSelectedDriver(e.target.value)}
                              disabled={true}
                            />
                          </td>
                          <td className="cell-text">Loading driver details...</td>
                          <td className="cell-text">-</td>
                          <td className="cell-text">
                            <span style={{ color: '#64748b', fontSize: '12px' }}>Evaluating...</span>
                          </td>
                          <td className="cell-text">-</td>
                          <td className="cell-text">
                            <span style={{ color: '#64748b', fontSize: '12px' }}>Please wait</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {!driversLoading && recommended && recommended.length > 0 && showEligibleOnly && (recommended.filter(r => r.eligible).length === 0) && (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚫</div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#dc2626' }}>No eligible drivers</h4>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  No drivers meet the current eligibility criteria. Try adjusting requirements or freeing up drivers.
                </p>
              </div>
            )}

            {!driversLoading && (!recommended || recommended.length === 0) && (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>No drivers available</h4>
                <p style={{ margin: 0, color: '#64748b' }}>
                  There are no drivers available for assignment at this time.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn-secondary" onClick={() => navigate('/dispatch/trips')} disabled={loading}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={onAssign}
              disabled={loading || !selectedDriver}
            >
              {loading ? 'Assigning...' : 'Assign Trip'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TripAssignPage;
