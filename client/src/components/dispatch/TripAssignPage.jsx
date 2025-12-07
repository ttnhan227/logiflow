import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripService } from '../../services';
import './dispatch.css';

const TripAssignPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

      try {
        // Load available drivers
        const drv = await tripService.getAvailableDrivers();
        console.log('Drivers loaded:', drv);
        setDrivers(drv || []);
      } catch (ex) {
        console.error('Failed to load drivers', ex?.response?.data || ex);
        setError(`Failed to load drivers: ${ex?.response?.data?.error || ex?.message || 'Unknown error'}`);
      }
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
    setLoading(true);
    setError(null);
    try {
      await tripService.assignTrip(trip.tripId, { driverId: Number(selectedDriver), vehicleId: null });
      // Navigate to trip detail page after successful assignment with state to trigger reload
      navigate(`/dispatch/trips/${trip.tripId}`, { state: { reload: true } });
    } catch (ex) {
      console.error(ex);
      setError(ex?.error || ex?.message || 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Assign Trip #{tripId}</h2>
      {error && <div className="error">{error}</div>}
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

          <div style={{ marginTop: 12 }}>
            <label><strong>Available Drivers</strong></label>
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              <table className="table">
                <thead>
                  <tr><th></th><th>Name</th><th>Phone</th><th>License</th><th>Status</th><th>Rest Hrs</th><th>Next Available</th></tr>
                </thead>
                <tbody>
                  {drivers.map(d => {
                    const requiredLicense = trip.vehicleRequiredLicense;
                    const driverLicense = d.licenseType || d.license_type;
                    const compatible = isLicenseCompatible(driverLicense, requiredLicense);
                    return (
                      <tr key={d.driverId}>
                        <td><input type="radio" name="driver" value={d.driverId} onChange={e => setSelectedDriver(e.target.value)} /></td>
                        <td>{d.fullName}</td>
                        <td>{d.phone}</td>
                        <td>{driverLicense || 'N/A'}</td>
                        <td style={{ color: compatible ? 'green' : 'red', fontWeight: 'bold' }}>
                          {compatible ? '✓ Compatible' : '✗ Incompatible'}
                        </td>
                        <td>{d.restRequiredHours ? d.restRequiredHours.toString() : '0'}</td>
                        <td>{d.nextAvailableTime ? d.nextAvailableTime : 'now'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
