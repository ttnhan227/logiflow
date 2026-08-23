import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { tripsOversightService } from '../../services';
import notificationService from '../../services/admin/notificationService';
import Pagination from '../common/Pagination';
import {
  Button,
  Card,
  Input,
  Select,
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
  EmptyState,
} from '@/components/ui';
import {
  LuTruck,
  LuSearch,
  LuRefreshCw,
  LuTriangleAlert,
  LuShieldAlert,
  LuZap,
  LuArrowRight,
  LuCheck,
} from 'react-icons/lu';

export const AdminTripsOversightPage = () => {
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
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { items } = await tripsOversightService.getTripsOversight({ size: 1000 });
      setTrips(items || []);
    } catch {
      setError('Failed to query nationwide trip oversight database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const loadDelayReports = async () => {
      try {
        setLoadingDelays(true);
        const reports = await tripsOversightService.getTripsWithDelayReports();
        setDelayReports(reports || []);
      } catch (err) {
        console.error('Failed to load delay reports:', err);
      } finally {
        setLoadingDelays(false);
      }
    };
    loadDelayReports();
    const interval = setInterval(loadDelayReports, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return <Badge variant="warning" size="sm" dot>Pending</Badge>;
      case 'SCHEDULED':
        return <Badge variant="brand" size="sm" dot>Scheduled</Badge>;
      case 'ASSIGNED':
        return <Badge variant="brand" size="sm" dot>Assigned</Badge>;
      case 'IN_TRANSIT':
      case 'IN_PROGRESS':
        return <Badge variant="info" size="sm" dot>In Transit</Badge>;
      case 'DELIVERED':
      case 'COMPLETED':
        return <Badge variant="success" size="sm" dot>Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger" size="sm" dot>Cancelled</Badge>;
      default:
        return <Badge variant="neutral" size="sm" dot>{status || 'Unknown'}</Badge>;
    }
  };

  const getRiskBadge = (risk) => {
    switch (risk?.toUpperCase()) {
      case 'ON_TRACK':
        return <Badge variant="success" size="sm">On Track</Badge>;
      case 'DUE_SOON':
        return <Badge variant="warning" size="sm">Due Soon</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger" size="sm">Overdue</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{risk || 'Normal'}</Badge>;
    }
  };

  const handleOverride = async (tripId, targetStatus = 'ASSIGNED') => {
    if (!window.confirm(`Override and set trip #${tripId} status to ${targetStatus}?`)) return;
    setActingId(tripId);
    try {
      await tripsOversightService.updateTripOrderStatus(tripId, targetStatus);
      await loadData();
    } catch {
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
        const riskDiff = getRiskPriority(a.risk) - getRiskPriority(b.risk);
        if (riskDiff !== 0) return riskDiff;
        const aSla = Date.parse(a.slaDue || 0);
        const bSla = Date.parse(b.slaDue || 0);
        return aSla - bSla;
      });
  }, [trips, riskFilter, search, statusFilter]);

  const paginatedTrips = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Nationwide Trips Oversight"
        description="Comprehensive compliance, SLA monitoring, live risk classification, and executive overrides for carrier trips."
        badge={<Badge variant="brand">Fleet Command</Badge>}
        actions={
          <Button variant="outline" size="sm" onClick={loadData} loading={loading} leftIcon={<LuRefreshCw size={14} />}>
            Refresh Telemetry
          </Button>
        }
      />

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Delay Exception Alert Banner */}
      {!loadingDelays && delayReports.length > 0 && (
        <Card style={{ padding: '20px', border: '1px solid var(--color-warning-300)', backgroundColor: 'var(--color-warning-50)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LuShieldAlert size={18} color="var(--color-warning-800)" />
              <strong style={{ fontSize: 'var(--text-sm)', color: 'var(--color-warning-900)' }}>
                {delayReports.length} Pending Delay Exception Report{delayReports.length > 1 ? 's' : ''} Require SLA Review
              </strong>
            </div>
            <Badge variant="warning" size="sm">
              Action Required
            </Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {delayReports.slice(0, 3).map((r) => (
              <div
                key={r.tripId}
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--color-white)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-warning-200)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>Trip #{r.tripId}</span>
                  <Link to={`/admin/trips-oversight/${r.tripId}`}>
                    <Button variant="outline" size="sm">
                      Review SLA
                    </Button>
                  </Link>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Reason: <strong>{r.delayReason || 'Unspecified'}</strong>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter toolbar */}
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <Input
              placeholder="Search by trip ID, driver, vehicle plate, or corridor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<LuSearch size={16} />}
            />
          </div>

          <div style={{ width: '160px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'ASSIGNED', label: 'Assigned' },
                { value: 'IN_TRANSIT', label: 'In Transit' },
                { value: 'DELIVERED', label: 'Delivered' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          </div>

          <div style={{ width: '160px' }}>
            <Select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Risk Levels' },
                { value: 'ON_TRACK', label: 'On Track' },
                { value: 'DUE_SOON', label: 'Due Soon' },
                { value: 'OVERDUE', label: 'Overdue' },
              ]}
            />
          </div>

          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
            {filtered.length} trip{filtered.length !== 1 ? 's' : ''} monitored
          </div>
        </div>
      </Card>

      {/* Trips Table */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '48px 0' }}>
            <LoadingSpinner text="Scanning nationwide trips database..." />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<LuTruck size={36} color="var(--color-slate-400)" />}
            title="No trips matched"
            description="Adjust your search query or filter settings to view trips."
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: '80px' }}>Trip ID</TableHead>
                  <TableHead>Corridor Route</TableHead>
                  <TableHead>Consolidated Cargo</TableHead>
                  <TableHead>Fulfillment State</TableHead>
                  <TableHead>Risk Index</TableHead>
                  <TableHead>Assigned Driver</TableHead>
                  <TableHead>Vehicle Plate</TableHead>
                  <TableHead>SLA Target</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTrips.map((trip) => (
                  <TableRow key={trip.tripId}>
                    <TableCell style={{ fontWeight: 700, color: 'var(--color-brand-700)', fontVariantNumeric: 'tabular-nums' }}>
                      #{trip.tripId}
                    </TableCell>
                    <TableCell>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {trip.originCity || 'Origin'} → {trip.destinationCity || 'Dest'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {trip.totalDistanceKm ? `${trip.totalDistanceKm.toFixed(1)} km` : '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral" size="sm">
                        {(trip.orders || []).length} orders
                      </Badge>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        {trip.totalWeightTon ? `${trip.totalWeightTon.toFixed(1)} T` : ''}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(trip.tripStatus)}</TableCell>
                    <TableCell>{getRiskBadge(trip.risk)}</TableCell>
                    <TableCell>
                      {trip.driver ? (
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-xs)' }}>{trip.driver.name}</div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {trip.vehicle ? trip.vehicle.plate : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </TableCell>
                    <TableCell style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {trip.slaDue
                        ? new Date(trip.slaDue).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <Link to={`/admin/trips-oversight/${trip.tripId}`}>
                          <Button variant="outline" size="sm">
                            Inspect
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                pageSize={pageSize}
                disabled={loading}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default AdminTripsOversightPage;
