import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dispatchDriverService } from '../../services';
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
} from '@/components/ui';
import {
  LuUser,
  LuSearch,
  LuRefreshCw,
  LuArrowLeft,
  LuPhone,
  LuMail,
  LuShieldCheck,
} from 'react-icons/lu';

export const AvailableDriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const data = await dispatchDriverService.getAllDrivers();
      setDrivers(data || []);
    } catch (err) {
      console.error('Failed to load drivers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE':
        return <Badge variant="success" dot>Available</Badge>;
      case 'ASSIGNED':
        return <Badge variant="brand" dot>Assigned</Badge>;
      case 'BUSY':
        return <Badge variant="warning" dot>Busy</Badge>;
      case 'OFFLINE':
        return <Badge variant="neutral" dot>Offline</Badge>;
      default:
        return <Badge variant="neutral" dot>{status || 'Unknown'}</Badge>;
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'available' && d.status?.toUpperCase() === 'AVAILABLE') ||
      (filter === 'assigned' && d.status?.toUpperCase() === 'ASSIGNED');

    const matchesSearch =
      !searchTerm ||
      d.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone?.includes(searchTerm) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Driver Fleet Roster"
        description="Live status, license ratings, and assignment status for all registered commercial drivers."
        badge={<Badge variant="brand">Driver Operations</Badge>}
        actions={
          <Link to="/dispatch/trips">
            <Button variant="outline" size="sm" leftIcon={<LuArrowLeft size={14} />}>
              Back to Trips
            </Button>
          </Link>
        }
      />

      {/* Filter toolbar */}
      <Card style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <Input
              placeholder="Search driver by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<LuSearch size={16} />}
            />
          </div>

          <div style={{ width: '180px' }}>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Driver States' },
                { value: 'available', label: 'Available Only' },
                { value: 'assigned', label: 'Assigned Only' },
              ]}
            />
          </div>

          <Button variant="outline" size="md" onClick={fetchDrivers} loading={loading} leftIcon={<LuRefreshCw size={14} />}>
            Refresh
          </Button>

          <div style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontWeight: 600 }}>
            {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''} listed
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        {loading ? (
          <div style={{ padding: '48px 0' }}>
            <LoadingSpinner text="Querying live driver telemetry..." />
          </div>
        ) : filteredDrivers.length === 0 ? (
          <EmptyState
            icon={<LuUser size={36} color="var(--color-slate-400)" />}
            title="No drivers found"
            description="Adjust your search query or filter settings to view driver records."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '80px' }}>ID</TableHead>
                <TableHead>Driver Name</TableHead>
                <TableHead>Contact Phone</TableHead>
                <TableHead>Email Address</TableHead>
                <TableHead>License Class</TableHead>
                <TableHead>Lifetime Trips</TableHead>
                <TableHead>Current Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.driverId}>
                  <TableCell style={{ fontWeight: 700, color: 'var(--color-brand-700)', fontVariantNumeric: 'tabular-nums' }}>
                    #{driver.driverId}
                  </TableCell>
                  <TableCell style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {driver.fullName || '—'}
                  </TableCell>
                  <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {driver.phone || '—'}
                  </TableCell>
                  <TableCell style={{ color: 'var(--text-secondary)' }}>
                    {driver.email || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="neutral" size="sm">
                      <LuShieldCheck size={11} /> {driver.licenseType || 'Class C'}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {driver.totalTrips || 0}
                  </TableCell>
                  <TableCell>{getStatusBadge(driver.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};

export default AvailableDriversPage;
