import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService } from '../../services';
import './dispatch.css';

const TripAssignPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

      // Load drivers + recommendations
      loadDrivers();
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
    try {
      await tripService.assignTrip(trip.tripId, { driverId: Number(selectedDriver), vehicleId: null });
      // Navigate to trip detail page after successful assignment with state to trigger reload
      navigate(`/dispatch/trips/${trip.tripId}`, { state: { reload: true } });
    } catch (ex) {
      console.error(ex);
      const errorMsg = ex?.response?.data?.message || ex?.response?.data?.error || ex?.error || ex?.message || 'Assignment failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Assign Trip #{tripId}</h2>
      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          background: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          color: '#dc2626',
          fontWeight: '500'
        }}>
          ⚠️ {error}
        </div>
      )}
      {!trip && <div>Loading trip...</div>}
      {trip && (
        <div>
          {(() => {
            const required = trip.vehicleRequiredLicense;
            const selected = drivers.find(d => Number(d.driverId) === Number(selectedDriver));
            if (!required || !selected) return null;
            const compatible = isLicenseCompatible(selected.licenseType, required);
            if (compatible) return null;
            const driverLicense = selected.licenseType || selected.license_type || 'N/A';
            return (
              <div style={{ color: 'red', marginBottom: 8 }}>
                Driver license ({driverLicense}) does not match vehicle requirement ({required})
              </div>
            );
          })()}

          <div><strong>Route:</strong> {trip.routeName}</div>
          <div><strong>Scheduled Departure:</strong> {trip.scheduledDeparture}</div>
          <div><strong>Vehicle:</strong> {trip.vehicleLicensePlate} ({trip.vehicleType})</div>
          <div><strong>Required License:</strong> {trip.vehicleRequiredLicense || 'N/A'}</div>

          {/* Display Orders with Pickup Types */}
          {trip.orders && trip.orders.length > 0 && (
            <div style={{ marginTop: 12, padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
              <strong>Orders in this Trip:</strong>
              <table className="table" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Pickup Address</th>
                    <th>Pickup Type</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.orders.map((order, idx) => (
                    <tr key={order.orderId || idx}>
                      <td>{order.orderId}</td>
                      <td>{order.customerName}</td>
                      <td>{order.pickupAddress}</td>
                      <td>
                        <span style={{
                          backgroundColor: order.pickupType === 'PORT_TERMINAL' ? '#fef3c7' : '#dbeafe',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.25rem',
                          fontWeight: '600',
                          color: order.pickupType === 'PORT_TERMINAL' ? '#92400e' : '#0c4a6e'
                        }}>
                          {order.pickupType || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: 12 }}>
            <label><strong>Recommended Drivers</strong></label>
            <button 
              style={{ marginLeft: '1rem', padding: '0.5rem 1rem' }} 
              onClick={() => { loadDrivers(); loadRecommendations(); }}
              disabled={driversLoading}
            >
              {driversLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
            </button>
            <label style={{ marginLeft: '1rem', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={showEligibleOnly}
                onChange={e => setShowEligibleOnly(e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Show eligible only
            </label>
            {recommended && recommended.length > 0 && (
              <div style={{ maxHeight: 240, overflow: 'auto', marginTop: '0.5rem', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                <table className="table">
                  <thead>
                    <tr><th></th><th>Name</th><th>Score</th><th>Eligible</th><th>Proximity</th><th>Reasons</th></tr>
                  </thead>
                  <tbody>
                    {(showEligibleOnly ? (recommended || []).filter(r => r.eligible) : recommended).map(r => {
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
                        <td>{r.fullName || `Driver #${r.driverId}`}</td>
                        <td>{typeof r.score === 'number' ? r.score.toFixed(1) : r.score}</td>
                        <td style={{ color: r.eligible ? 'green' : 'red', fontWeight: 'bold' }}>
                          {r.eligible ? '✓ Eligible' : `✗ Ineligible${firstGating ? ' — ' + firstGating : ''}`}
                        </td>
                        <td>
                          {typeof r.distanceToPickupKm === 'number' ? `${r.distanceToPickupKm.toFixed(1)} km` : 'N/A'}
                        </td>
                        <td style={{ maxWidth: 420 }}>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {ordered.slice(0, 4).map((x, idx) => <li key={idx}>{x}</li>)}
                          </ul>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {recommended && recommended.length > 0 && showEligibleOnly && (recommended.filter(r => r.eligible).length === 0) && (
              <div style={{ marginTop: 8, color: '#b91c1c' }}>
                No eligible drivers based on current rules. Try changing vehicle/license or free up a driver.
              </div>
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={onAssign} disabled={loading}>{loading ? 'Assigning...' : 'Assign Trip'}</button>
            <button className="btn" style={{ marginLeft: 8 }} onClick={() => navigate('/dispatch/trips')}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripAssignPage;
