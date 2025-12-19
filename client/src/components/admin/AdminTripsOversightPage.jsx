import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripsOversightService } from '../../services';
import notificationService from '../../services/admin/notificationService';
import './admin.css';

const statusOptions = ['ALL', 'PENDING', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'];
const riskOptions = ['ALL', 'ON_TRACK', 'DUE_SOON', 'OVERDUE', 'COMPLETED', 'UNKNOWN'];

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

const AdminTripsOversightPage = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [delayReports, setDelayReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDelays, setLoadingDelays] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [actingId, setActingId] = useState(null);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const { items, meta: m } = await tripsOversightService.getTripsOversight({ size: 1000 });
        setTrips(items);
        setMeta(m);
      } catch (err) {
        setError('Failed to load trips oversight data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load delay reports
  useEffect(() => {
    const loadDelayReports = async () => {
      try {
        setLoadingDelays(true);
        const reports = await tripsOversightService.getTripsWithDelayReports();
        setDelayReports(reports);
      } catch (err) {
        console.error('Failed to load delay reports:', err);
      } finally {
        setLoadingDelays(false);
      }
    };
    loadDelayReports();

    // Refresh delay reports every 30 seconds
    const interval = setInterval(loadDelayReports, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load unread notification count
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const { unreadCount } = await notificationService.getUnreadCount();
        setUnreadCount(unreadCount);
      } catch (err) {
        console.error('Failed to load unread notification count:', err);
      }
    };
    loadUnreadCount();

    // Refresh count periodically every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOverride = async (tripId, targetStatus = 'ASSIGNED') => {
    if (!window.confirm(`Override and set trip ${tripId} to ${targetStatus}?`)) return;
    setActingId(tripId);
    try {
      await tripsOversightService.updateTripOrderStatus(tripId, targetStatus);

      // Refresh trips list from backend to get updated data
      const { items } = await tripsOversightService.getTripsOversight({ size: 1000 });
      setTrips(items);

      alert(`Trip ${tripId} status updated to ${targetStatus}.`);
    } catch (err) {
      alert('Failed to override status.');
    } finally {
      setActingId(null);
    }
  };

  const filtered = useMemo(() => {
    const riskOrder = ['OVERDUE', 'DUE_SOON', 'ON_TRACK', 'UNKNOWN', 'COMPLETED'];
    const getRiskPriority = (risk) => {
      if (!risk) return riskOrder.length;
      const idx = riskOrder.indexOf(String(risk).toUpperCase());
      return idx === -1 ? riskOrder.length : idx;
    };

    const statusOrder = ['in_progress', 'arrived', 'scheduled', 'assigned', 'completed', 'cancelled'];
    const getStatusPriority = (status) => {
      if (!status) return statusOrder.length;
      const idx = statusOrder.indexOf(String(status).toLowerCase());
      return idx === -1 ? statusOrder.length : idx;
    };

    return trips
      .filter((trip) => (statusFilter === 'ALL' ? true : trip.tripStatus === statusFilter))
      .filter((trip) => (riskFilter === 'ALL' ? true : trip.risk === riskFilter))
      .filter((trip) => {
        if (!search) return true;
        const term = search.toLowerCase();
        return (
          String(trip.tripId || '').toLowerCase().includes(term) ||
          String(trip.driver?.name || '').toLowerCase().includes(term) ||
          trip.originCity?.toLowerCase().includes(term) ||
          trip.destinationCity?.toLowerCase().includes(term) ||
          trip.vehicle?.plate?.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        // Primary sort: Risk priority (OVERDUE first, COMPLETED last)
        const riskPriorityDiff = getRiskPriority(a.risk) - getRiskPriority(b.risk);
        if (riskPriorityDiff !== 0) return riskPriorityDiff;

        // Secondary sort: Within same risk, by status activity (in_progress first)
        const statusPriorityDiff = getStatusPriority(a.tripStatus) - getStatusPriority(b.tripStatus);
        if (statusPriorityDiff !== 0) return statusPriorityDiff;

        // Tertiary sort: Within same risk+status, by SLA due time (soonest first)
        const aSla = Date.parse(a.slaDue || 0);
        const bSla = Date.parse(b.slaDue || 0);
        return aSla - bSla;
      });
  }, [trips, riskFilter, search, statusFilter]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [statusFilter, riskFilter, search]);

  const paginatedTrips = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  if (loading) return <div className="card">Loading trips oversight data...</div>;
  if (error) return <div className="card error">{error}</div>;

  return (
    <div className="trips-oversight">
      <div className="oversight-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ margin: 0 }}>Trips Oversight</h1>
          {unreadCount > 0 && (
            <div style={{
              backgroundColor: '#dc2626',
              color: '#fff',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
        </div>
        <div>
          <p className="muted" style={{ marginBottom: '8px' }}>Admin trip oversight and compliance monitoring. Orders are grouped by trips.</p>
          <div className="oversight-filters" style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 2 }}>
            <label style={{ marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>Search</label>
            <input
              type="text"
              placeholder="Search trip ID, driver, city, vehicle"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={{ marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px' }}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <label style={{ marginBottom: '6px', fontWeight: 600, fontSize: '14px' }}>Risk</label>
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '14px' }}>
              {riskOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          </div>
        </div>
      </div>

      {/* Delay Reports Section */}
      {!loadingDelays && delayReports.length > 0 && (
        <div className="card" style={{
          marginBottom: '24px',
          border: '2px solid #f59e0b',
          backgroundColor: '#fefce8'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🚨</span>
              <h3 style={{ margin: 0, color: '#92400e' }}>
                Pending Delay Reports ({delayReports.length})
              </h3>
            </div>
            <button
              className="btn btn-primary btn-small"
              onClick={() => {
                const reports = delayReports;
                setDelayReports([]);
                setTimeout(() => setDelayReports(reports), 100); // Force refresh
              }}
              style={{ fontSize: '12px' }}
            >
              Refresh
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px'
          }}>
            {delayReports.map((trip) => (
              <div
                key={trip.tripId}
                style={{
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#ffffff'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '16px', color: '#111827' }}>
                      Trip #{trip.tripId}
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                      {trip.originCity || 'N/A'} → {trip.destinationCity || 'N/A'}
                    </div>
                  </div>
                  <span style={{
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '12px'
                  }}>
                    PENDING REVIEW
                  </span>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#374151',
                    fontWeight: 500,
                    marginBottom: '4px'
                  }}>
                    Delay Reason:
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    backgroundColor: '#f9fafb',
                    padding: '8px',
                    borderRadius: '4px'
                  }}>
                    {trip.delayReason}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    <div>Driver: {trip.driver?.name || 'Not assigned'}</div>
                    <div>Orders: {(trip.orders || []).length}</div>
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    <div>Status: {trip.tripStatus || 'Unknown'}</div>
                    <div>Risk: <RiskTag risk={trip.risk} /></div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={() => navigate(`/admin/trips-oversight/${trip.tripId}`)}
                    style={{ fontSize: '12px' }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length > 0 ? (
        <>
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Route</th>
                  <th>Orders</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>Delay</th>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>SLA Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTrips.map((trip) => (
                  <tr key={trip.tripId}>
                    <td style={{ fontWeight: 600 }}>{trip.tripId}</td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <div>{trip.originCity || 'N/A'} → {trip.destinationCity || 'N/A'}</div>
                        <div className="muted small">{trip.totalDistanceKm ? `${trip.totalDistanceKm} km` : ''}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px' }}>
                        <div style={{ fontWeight: 600 }}>{(trip.orders || []).length} orders</div>
                        <div className="muted small">{trip.totalWeightTon ? `${trip.totalWeightTon} tons` : ''}</div>
                        {trip.hasUrgentOrders && (
                          <span style={{
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            fontSize: '10px',
                            padding: '2px 4px',
                            borderRadius: '3px',
                            fontWeight: 600,
                            marginTop: '2px',
                            display: 'inline-block'
                          }}>
                            URGENT
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className="order-badge"
                        style={{
                          backgroundColor: statusColor[trip.tripStatus] || '#f3f4f6',
                          color: '#111827',
                        }}
                      >
                        {trip.tripStatus || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>
                      <RiskTag risk={trip.risk} />
                    </td>
                    <td>
                      {trip.delayReason ? (
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: '#92400e'
                        }}>
                          🚨 Reported
                        </span>
                      ) : (
                        <span className="muted" style={{ fontSize: '12px' }}>No delay</span>
                      )}
                    </td>
                    <td>
                      {trip.driver ? (
                        <div style={{ fontSize: '13px' }}>
                          <div style={{ fontWeight: 500 }}>{trip.driver.name}</div>
                          <div className="muted small">{trip.assignmentStatus || 'Assigned'}</div>
                        </div>
                      ) : (
                        <span className="muted">Not assigned</span>
                      )}
                    </td>
                    <td>
                      {trip.vehicle ? (
                        <div style={{ fontSize: '12px' }}>
                          <div style={{ fontWeight: 500 }}>{trip.vehicle.plate}</div>
                          <div style={{ textTransform: 'uppercase' }}>{trip.vehicle.type}</div>
                        </div>
                      ) : (
                        <span className="muted">Not assigned</span>
                      )}
                    </td>
                    <td style={{ fontSize: '13px' }}>
                      {trip.slaDue ? (
                        <>
                          <div>{new Date(trip.slaDue).toLocaleDateString()}</div>
                          <div className="muted small">{new Date(trip.slaDue).toLocaleTimeString()}</div>
                        </>
                      ) : (
                        <span className="muted">N/A</span>
                      )}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="action-btn"
                          title="View trip details"
                          onClick={() => navigate(`/admin/trips-oversight/${trip.tripId}`)}
                        >
                          👁️
                        </button>
                        <button
                          className="action-btn"
                          title={`Override to ${trip.assignmentStatus === 'in_progress' ? 'DELIVERED' : 'ASSIGNED'}`}
                          onClick={() => handleOverride(trip.tripId, trip.assignmentStatus === 'in_progress' ? 'completed' : 'assigned')}
                          disabled={actingId === trip.tripId}
                        >
                          ⚡
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <div className="pagination-info">
                Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filtered.length)} of{' '}
                {filtered.length} trips
              </div>
              <div className="pagination-controls">
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  ← Previous
                </button>
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => setPage(page + 1)}
                  disabled={page + 1 >= totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card">No trips match the current filters.</div>
      )}

    </div>
  );
};

export default AdminTripsOversightPage;
