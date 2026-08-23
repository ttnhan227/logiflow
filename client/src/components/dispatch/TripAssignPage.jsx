import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { tripService } from '../../services';
import {
  Button,
  Card,
  Badge,
  PageHeader,
  Alert,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  LoadingSpinner,
} from '@/components/ui';
import {
  LuUser,
  LuTruck,
  LuCalendar,
  LuCheck,
  LuX,
  LuArrowLeft,
  LuTriangleAlert,
} from 'react-icons/lu';

export const TripAssignPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

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
      setDrivers(drv || []);
    } catch (ex) {
      setError(`Failed to load driver roster: ${ex?.response?.data?.error || ex?.message || 'Network error'}`);
    } finally {
      setDriversLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const rec = await tripService.getRecommendedDrivers(tripId, 20);
      setRecommended(rec || []);
    } catch (ex) {
      console.warn('Driver recommendations non-blocking warning', ex);
    }
  };

  useEffect(() => {
    const load = async () => {
      setError(null);
      try {
        const tripDetail = await tripService.getTripById(tripId);
        if (!tripDetail) {
          setError('Trip not found.');
          return;
        }
        setTrip(tripDetail);
      } catch (ex) {
        setError(`Failed to load trip: ${ex?.response?.data?.error || ex?.message || 'Error'}`);
        return;
      }

      await loadDrivers();
      loadRecommendations();
    };
    load();
  }, [tripId]);

  const isLicenseCompatible = (driverLicense, requiredLicense) => {
    if (!requiredLicense) return true;
    if (!driverLicense) return false;
    return driverLicense.toUpperCase() === requiredLicense.toUpperCase();
  };

  const onAssign = async () => {
    if (!selectedDriver) return setError('Please select a driver to assign.');
    const rec = (recommended || []).find((r) => Number(r.driverId) === Number(selectedDriver));
    if (rec && rec.eligible === false) {
      return setError('The selected driver is evaluated as ineligible. Please pick an eligible carrier.');
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await tripService.assignTrip(trip.tripId, { driverId: Number(selectedDriver), vehicleId: null });
      setSuccess('Driver assigned successfully! Returning to trip manifest...');
      setTimeout(() => {
        navigate(`/dispatch/trips/${trip.tripId}`, { state: { reload: true } });
      }, 1200);
    } catch (ex) {
      setError(ex?.response?.data?.message || ex?.response?.data?.error || 'Driver assignment failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title={`Assign Driver • Trip #${tripId}`}
        description="Match and allocate qualified commercial driver to this linehaul trip manifest."
        badge={<Badge variant="brand">Driver Allocation</Badge>}
        actions={
          <Link to={`/dispatch/trips/${tripId}`}>
            <Button variant="outline" size="sm" leftIcon={<LuArrowLeft size={14} />}>
              Back to Trip
            </Button>
          </Link>
        }
      />

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {!trip && !error && (
        <div style={{ padding: '48px 0' }}>
          <LoadingSpinner text="Loading trip details..." />
        </div>
      )}

      {trip && (
        <>
          {/* Trip Summary Card */}
          <Card style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: 'var(--text-xs)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Corridor Route:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{trip.routeName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Scheduled Departure:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {new Date(trip.scheduledDeparture).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Assigned Vehicle:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {trip.vehicleLicensePlate} ({trip.vehicleType || 'Truck'})
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Required Driver License:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-brand-700)', marginTop: '2px' }}>
                  {trip.vehicleRequiredLicense || 'Class C / Standard'}
                </div>
              </div>
            </div>
          </Card>

          {/* Driver Selection Card */}
          <Card style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
                Available Driver Candidates
              </h3>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showEligibleOnly}
                  onChange={(e) => setShowEligibleOnly(e.target.checked)}
                />
                Show eligible drivers only
              </label>
            </div>

            {driversLoading ? (
              <div style={{ padding: '32px 0' }}>
                <LoadingSpinner text="Evaluating driver roster and match scores..." />
              </div>
            ) : recommended && recommended.length > 0 ? (
              <div style={{ border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: '48px' }}></TableHead>
                      <TableHead>Driver Name</TableHead>
                      <TableHead>Compatibility Score</TableHead>
                      <TableHead>Status / Eligibility</TableHead>
                      <TableHead>Proximity to Origin</TableHead>
                      <TableHead>Gating Criteria / Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(showEligibleOnly ? recommended.filter((r) => r.eligible) : recommended).map((r) => {
                      const isSelected = Number(selectedDriver) === Number(r.driverId);
                      return (
                        <TableRow
                          key={r.driverId}
                          onClick={() => setSelectedDriver(r.driverId)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--color-brand-50)' : undefined,
                            opacity: r.eligible ? 1 : 0.65,
                          }}
                        >
                          <TableCell>
                            <input
                              type="radio"
                              name="driver"
                              checked={isSelected}
                              onChange={() => setSelectedDriver(r.driverId)}
                            />
                          </TableCell>
                          <TableCell style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {r.fullName || `Driver #${r.driverId}`}
                          </TableCell>
                          <TableCell style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                            {typeof r.score === 'number' ? `${r.score.toFixed(0)}%` : r.score}
                          </TableCell>
                          <TableCell>
                            {r.eligible ? (
                              <Badge variant="success" size="sm" dot>Eligible</Badge>
                            ) : (
                              <Badge variant="danger" size="sm" dot>Ineligible</Badge>
                            )}
                          </TableCell>
                          <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {typeof r.distanceToPickupKm === 'number' ? `${r.distanceToPickupKm.toFixed(1)} km` : '—'}
                          </TableCell>
                          <TableCell style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                            {Array.isArray(r.reasons) && r.reasons.length > 0 ? (
                              r.reasons.slice(0, 2).join('; ')
                            ) : (
                              'Clear to dispatch'
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                No driver matches currently registered in the dispatch database.
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <Button variant="outline" onClick={() => navigate(`/dispatch/trips/${tripId}`)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" onClick={onAssign} disabled={!selectedDriver || loading} loading={loading}>
                Confirm Driver Assignment
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default TripAssignPage;
