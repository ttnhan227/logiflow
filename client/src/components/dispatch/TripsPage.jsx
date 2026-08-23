import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tripService } from '../../services';
import Pagination from '../common/Pagination';
import {
  Button,
  Card,
  Input,
  Select,
  Badge,
  PageHeader,
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  LoadingSpinner,
  EmptyState,
  Alert,
} from '@/components/ui';
import {
  LuTruck,
  LuPlus,
  LuSearch,
  LuRefreshCw,
  LuCalendar,
  LuMapPin,
  LuUser,
} from 'react-icons/lu';

export const TripsPage = () => {
  const [tripsResp, setTripsResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;
  const [error, setError] = useState(null);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tripService.getTrips({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        page,
        size,
      });
      setTripsResp(data);
    } catch (err) {
      console.error('Failed to load trips', err);
      setError(
        err.response?.data?.message ||
          'Failed to load dispatch trips. Please verify your role permissions.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm, page, size]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return <Badge variant="warning" dot>Scheduled</Badge>;
      case 'ASSIGNED':
        return <Badge variant="brand" dot>Assigned</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info" dot>In Progress</Badge>;
      case 'DELAYED':
        return <Badge variant="danger" dot>Delayed</Badge>;
      case 'COMPLETED':
        return <Badge variant="success" dot>Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral" dot>Cancelled</Badge>;
      default:
        return <Badge variant="neutral" dot>{status || 'Unknown'}</Badge>;
    }
  };

  const filteredTrips =
    tripsResp?.trips?.filter(
      (t) =>
        !searchTerm ||
        t.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.vehicleLicensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tripId?.toString().includes(searchTerm)
    ) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Linehaul Trips & Manifests"
        description="Schedule, coordinate, and supervise multi-order carrier trips across regional corridors."
        badge={<Badge variant="brand">Fleet Dispatch</Badge>}
        actions={
          <Link to="/dispatch/trips/create">
            <Button variant="primary" size="sm" leftIcon={<LuPlus size={16} />}>
              Create New Trip
            </Button>
          </Link>
        }
      />

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter toolbar */}
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px' }}>
            <Input
              placeholder="Search by route corridor, vehicle plate, or trip ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<LuSearch size={16} />}
            />
          </div>

          <div style={{ width: '180px' }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'SCHEDULED', label: 'Scheduled' },
                { value: 'ASSIGNED', label: 'Assigned' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'DELAYED', label: 'Delayed' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          </div>

          <Button variant="outline" size="md" onClick={fetchTrips} loading={loading} leftIcon={<LuRefreshCw size={14} />}>
            Refresh
          </Button>

          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
            {typeof tripsResp?.totalItems === 'number'
              ? `${tripsResp.totalItems} trip${tripsResp.totalItems !== 1 ? 's' : ''}`
              : `${filteredTrips.length} trip${filteredTrips.length !== 1 ? 's' : ''}`}
          </div>
        </div>
      </Card>

      {/* Trips Table */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '48px 0' }}>
            <LoadingSpinner text="Loading trips roster..." />
          </div>
        ) : filteredTrips.length === 0 ? (
          <EmptyState
            icon={<LuTruck size={36} color="var(--color-slate-400)" />}
            title="No scheduled trips"
            description="Create your first linehaul dispatch trip or refine search filters."
            action={
              <Link to="/dispatch/trips/create">
                <Button variant="primary" size="sm" leftIcon={<LuPlus size={14} />}>
                  Create Trip
                </Button>
              </Link>
            }
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: '80px' }}>Trip ID</TableHead>
                  <TableHead>Corridor Route</TableHead>
                  <TableHead>Orders Consolidate</TableHead>
                  <TableHead>Total Payload</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Vehicle Plate</TableHead>
                  <TableHead>Assigned Driver</TableHead>
                  <TableHead>Scheduled Departure</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.map((trip) => {
                  const orderCount = trip.orders?.length || 0;
                  const totalWeight =
                    trip.orders?.reduce((sum, order) => sum + (order.weightTons || 0), 0) || 0;
                  const totalDistance =
                    trip.route?.distanceKm ||
                    trip.orders?.reduce((sum, order) => sum + (order.distanceKm || 0), 0) ||
                    0;

                  return (
                    <TableRow key={trip.tripId}>
                      <TableCell style={{ fontWeight: 700, color: 'var(--color-brand-700)', fontVariantNumeric: 'tabular-nums' }}>
                        #{trip.tripId}
                      </TableCell>
                      <TableCell>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{trip.routeName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="brand" size="sm">
                          {orderCount} order{orderCount !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {totalWeight > 0 ? `${totalWeight.toFixed(1)} T` : '—'}
                      </TableCell>
                      <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {totalDistance > 0 ? `${totalDistance.toFixed(1)} km` : '—'}
                      </TableCell>
                      <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {trip.vehicleLicensePlate ? (
                          <span style={{ fontWeight: 600 }}>{trip.vehicleLicensePlate}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {trip.driverName ? (
                          <span>{trip.driverName}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {trip.scheduledDeparture
                          ? new Date(trip.scheduledDeparture).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </TableCell>
                      <TableCell>{getStatusBadge(trip.status)}</TableCell>
                      <TableCell style={{ textAlign: 'right' }}>
                        <Link to={`/dispatch/trips/${trip.tripId}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-default)' }}>
              <Pagination
                page={tripsResp?.currentPage ?? page}
                totalPages={tripsResp?.totalPages ?? 0}
                totalItems={tripsResp?.totalItems}
                pageSize={tripsResp?.pageSize ?? size}
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

export default TripsPage;
