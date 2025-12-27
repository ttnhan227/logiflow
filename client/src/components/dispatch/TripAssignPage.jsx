import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService, dispatchDriverService } from '../../services';
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
      const drv = await dispatchDriverService.getAllDrivers();
      console.log('All drivers loaded:', drv);
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

    const driver = driverLicense.toUpperCase();
    const required = requiredLicense.toUpperCase();

    // License hierarchy: higher licenses can operate lower-class vehicles
    // A1 > B2 > C > D > E > FC
    const licenseHierarchy = {
      'A1': 6,   // Highest - can operate all vehicles
      'B2': 5,   // Can operate B2, C, D, E, FC vehicles
      'C': 4,    // Can operate C, D, E, FC vehicles
      'D': 3,    // Can operate D, E, FC vehicles
      'E': 2,    // Can operate E, FC vehicles
      'FC': 1    // Can only operate FC vehicles (lowest)
    };

    const driverLevel = licenseHierarchy[driver];
    const requiredLevel = licenseHierarchy[required];

    // Invalid license types
    if (driverLevel === undefined || requiredLevel === undefined) {
      return false;
    }

    // Driver can operate this vehicle if their license level is >= required level
    return driverLevel >= requiredLevel;
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
                  <strong>All Drivers:</strong> {showEligibleOnly ?
                    `${(drivers.filter(driver => {
                      const rec = (recommended || []).find(r => Number(r.driverId) === Number(driver.driverId));
                      const requiredLicense = trip?.vehicleRequiredLicense;
                      const driverLicense = driver.licenseType;
                      const isLicenseCompatible = isLicenseCompatible(driverLicense, requiredLicense);
                      return rec ? rec.eligible : (driver.status === 'available' && isLicenseCompatible);
                    })).length} eligible driver${(drivers.filter(driver => {
                      const rec = (recommended || []).find(r => Number(r.driverId) === Number(driver.driverId));
                      const requiredLicense = trip?.vehicleRequiredLicense;
                      const driverLicense = driver.licenseType;
                      const isLicenseCompatible = isLicenseCompatible(driverLicense, requiredLicense);
                      return rec ? rec.eligible : (driver.status === 'available' && isLicenseCompatible);
                    })).length !== 1 ? 's' : ''} shown`
                    : `${drivers.length} driver${drivers.length !== 1 ? 's' : ''} available for consideration`}
                  {recommended && recommended.length > 0 && (
                    <span style={{ marginLeft: '1rem' }}>
                      Smart recommendations loaded ({recommended.length} evaluated).
                    </span>
                  )}
                  {(!recommended || recommended.length === 0) && (
                    <span style={{ marginLeft: '1rem', color: '#64748b' }}>
                      Loading smart recommendations...
                    </span>
                  )}
                </div>
              </div>
            )}

            {!driversLoading && drivers && drivers.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '1rem',
                maxHeight: '500px',
                overflowY: 'auto',
                padding: '1rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                backgroundColor: '#f9fafb'
              }}>
                {(showEligibleOnly ? drivers.filter(driver => {
                  const rec = (recommended || []).find(r => Number(r.driverId) === Number(driver.driverId));
                  const requiredLicense = trip?.vehicleRequiredLicense;
                  const driverLicense = driver.licenseType;
                  const isLicenseCompatible = isLicenseCompatible(driverLicense, requiredLicense);
                  return rec ? rec.eligible : (driver.status === 'available' && isLicenseCompatible);
                }) : drivers).map(driver => {
                  // Find recommendation data for this driver
                  const rec = (recommended || []).find(r => Number(r.driverId) === Number(driver.driverId));

                  // Determine license compatibility with selected vehicle
                  const requiredLicense = trip?.vehicleRequiredLicense;
                  const driverLicense = driver.licenseType;
                  const isLicenseCompatible = !requiredLicense || (driverLicense && driverLicense.toUpperCase() === requiredLicense.toUpperCase());

                  // Determine overall eligibility
                  const isEligible = rec ? rec.eligible : (driver.status === 'available' && isLicenseCompatible);
                  const canSelect = isEligible;

                  // Status styling
                  let statusIcon = '✅';
                  let statusText = 'Available';
                  let statusColor = '#10b981';
                  let cardOpacity = 1;
                  let cardBorder = '2px solid #10b981';

                  if (!isEligible) {
                    cardOpacity = 0.7;
                    cardBorder = '2px solid #9ca3af';
                    if (!isLicenseCompatible) {
                      statusIcon = '🚫';
                      statusText = 'License Mismatch';
                      statusColor = '#ef4444';
                      cardBorder = '2px solid #ef4444';
                    } else if (driver.status !== 'available') {
                      statusIcon = '⏸️';
                      statusText = driver.status || 'Unavailable';
                      statusColor = '#f59e0b';
                    }
                  }

                  const isSelected = selectedDriver === driver.driverId.toString();

                  return (
                    <div
                      key={driver.driverId}
                      onClick={() => canSelect && setSelectedDriver(driver.driverId.toString())}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #3b82f6' : cardBorder,
                        backgroundColor: isSelected ? '#eff6ff' : 'white',
                        opacity: cardOpacity,
                        cursor: canSelect ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        position: 'relative'
                      }}
                      onMouseEnter={(e) => {
                        if (canSelect) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (canSelect) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = isSelected ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 1px 3px rgba(0, 0, 0, 0.1)';
                        }
                      }}
                    >
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          ✓
                        </div>
                      )}

                      {/* Header */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem'
                      }}>
                        <div style={{
                          fontSize: '1.1rem',
                          fontWeight: '600',
                          color: '#1e293b'
                        }}>
                          {driver.fullName || `Driver #${driver.driverId}`}
                        </div>
                        <div style={{
                          fontSize: '0.9rem',
                          color: statusColor,
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <span>{statusIcon}</span>
                          <span>{statusText}</span>
                        </div>
                      </div>

                      {/* License Info */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>
                          License: <strong>{driverLicense || 'None'}</strong>
                          {requiredLicense && (
                            <span style={{
                              marginLeft: '0.5rem',
                              color: isLicenseCompatible ? '#10b981' : '#ef4444',
                              fontWeight: '500'
                            }}>
                              {isLicenseCompatible ? '✓ Compatible' : `✗ Requires ${requiredLicense} or higher`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Recommendation Score (if available) */}
                      {rec && (
                        <div style={{
                          marginBottom: '0.75rem',
                          padding: '0.5rem',
                          backgroundColor: rec.eligible ? '#f0fdf4' : '#fef2f2',
                          borderRadius: '4px',
                          border: `1px solid ${rec.eligible ? '#bbf7d0' : '#fecaca'}`
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.85rem'
                          }}>
                            <span style={{ color: '#6b7280' }}>Recommendation Score:</span>
                            <span style={{
                              fontWeight: '600',
                              color: rec.eligible ? '#166534' : '#dc2626'
                            }}>
                              {typeof rec.score === 'number' ? rec.score.toFixed(1) : rec.score}
                            </span>
                          </div>
                          {rec.distanceToPickupKm && (
                            <div style={{
                              marginTop: '0.25rem',
                              fontSize: '0.8rem',
                              color: '#6b7280'
                            }}>
                              Distance to pickup: {rec.distanceToPickupKm.toFixed(1)} km
                            </div>
                          )}
                        </div>
                      )}

                      {/* Contact Info */}
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#9ca3af'
                      }}>
                        📞 {driver.phone || 'No phone'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!driversLoading && showEligibleOnly && (() => {
              const eligibleDrivers = drivers.filter(driver => {
                const rec = (recommended || []).find(r => Number(r.driverId) === Number(driver.driverId));
                const requiredLicense = trip?.vehicleRequiredLicense;
                const driverLicense = driver.licenseType;
                const isLicenseCompatible = isLicenseCompatible(driverLicense, requiredLicense);
                return rec ? rec.eligible : (driver.status === 'available' && isLicenseCompatible);
              });
              return eligibleDrivers.length === 0;
            })() && (
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
                  No drivers meet the current eligibility criteria. Try unchecking "Show eligible only" to see all drivers, or adjust vehicle requirements.
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
