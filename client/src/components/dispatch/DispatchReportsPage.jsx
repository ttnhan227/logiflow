import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import reportsService from '../../services/dispatch/reportsService';
import {
  Button,
  Card,
  StatCard,
  Input,
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
  LuTrendingUp,
  LuFileText,
  LuCalendar,
  LuCircleCheck,
  LuClock,
  LuTruck,
  LuTriangleAlert,
} from 'react-icons/lu';

const fmtDate = (s) => {
  try {
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return s;
  }
};

export const DispatchReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await reportsService.getDailyReport(dateRange.startDate, dateRange.endDate);
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e?.error || e?.message || e?.response?.data?.error || 'Failed to load daily report.');
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [dateRange.startDate, dateRange.endDate]);

  const totals = useMemo(() => {
    const t = {
      totalTrips: 0,
      completedTrips: 0,
      cancelledTrips: 0,
      inProgressTrips: 0,
      scheduledTrips: 0,
      delayedStatusTrips: 0,
      completedWithActualArrival: 0,
      lateTrips: 0,
      totalDelayMinutes: 0,
    };
    for (const r of rows) {
      t.totalTrips += r.totalTrips || 0;
      t.completedTrips += r.completedTrips || 0;
      t.cancelledTrips += r.cancelledTrips || 0;
      t.inProgressTrips += r.inProgressTrips || 0;
      t.scheduledTrips += r.scheduledTrips || 0;
      t.delayedStatusTrips += r.delayedStatusTrips || 0;
      t.completedWithActualArrival += r.completedTripsWithActualArrival || 0;
      t.lateTrips += r.lateTrips || 0;
      t.totalDelayMinutes += r.totalDelayMinutes || 0;
    }
    const onTimeTrips = t.completedWithActualArrival - t.lateTrips;
    const onTimeRate =
      t.completedWithActualArrival === 0 ? 0 : (onTimeTrips * 100) / t.completedWithActualArrival;
    const avgDelay =
      t.completedWithActualArrival === 0 ? 0 : t.totalDelayMinutes / t.completedWithActualArrival;

    return {
      ...t,
      onTimeTrips,
      onTimeRate: Math.round(onTimeRate * 10) / 10,
      avgDelay: Math.round(avgDelay * 10) / 10,
    };
  }, [rows]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Dispatch Performance & Delay Analytics"
        description="Monitor daily trip volume, SLA commitments, delay justifications, and fulfillment performance."
        badge={<Badge variant="brand">Operational Analytics</Badge>}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((p) => ({ ...p, startDate: e.target.value }))}
            />
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <Input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((p) => ({ ...p, endDate: e.target.value }))}
            />
            <Button
              variant="outline"
              size="md"
              onClick={() => reportsService.downloadDailyReportPdf(dateRange.startDate, dateRange.endDate)}
              leftIcon={<LuFileText size={16} />}
              disabled={loading}
            >
              Export PDF
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Total Scheduled Trips"
          value={totals.totalTrips.toLocaleString()}
          icon={<LuTruck size={20} />}
          description="In selected reporting period"
        />
        <StatCard
          title="Completed Linehaul"
          value={totals.completedTrips.toLocaleString()}
          icon={<LuCircleCheck size={20} />}
          description={`${totals.cancelledTrips} cancellations recorded`}
        />
        <StatCard
          title="On-Time Delivery SLA"
          value={`${totals.onTimeRate}%`}
          change="99.2% Target SLA"
          changeType={totals.onTimeRate >= 95 ? 'positive' : 'negative'}
          icon={<LuTrendingUp size={20} />}
        />
        <StatCard
          title="Average Trip Latency"
          value={`${totals.avgDelay} min`}
          icon={<LuClock size={20} />}
          description="Net of approved SLA extensions"
        />
      </div>

      {/* Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Daily Trip Volume vs Exceptions
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Total scheduled volume plotted against operational cancellation counts.
          </p>

          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="totalTrips" stroke="#2563eb" fill="rgba(37,99,235,0.15)" strokeWidth={2} name="Total Trips" />
                <Area type="monotone" dataKey="cancelledTrips" stroke="#ef4444" fill="rgba(239,68,68,0.15)" strokeWidth={2} name="Cancelled" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Average Delay Latency (Minutes)
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Daily delay minutes per completed trip.
          </p>

          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={fmtDate} stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="avgDelayMinutes" fill="#d97706" name="Avg Delay (min)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Daily Breakdown Table */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Daily Metric Log
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Breakdown across scheduled, in-progress, completed, and delayed statuses
            </div>
          </div>
          {loading && <LoadingSpinner size="sm" />}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Total Trips</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>In Progress</TableHead>
              <TableHead>Cancelled</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>On-Time %</TableHead>
              <TableHead>Avg Delay</TableHead>
              <TableHead>Primary Delay Exceptions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.date}>
                <TableCell style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.date}</TableCell>
                <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>{r.totalTrips}</TableCell>
                <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>{r.scheduledTrips}</TableCell>
                <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>{r.inProgressTrips}</TableCell>
                <TableCell style={{ fontVariantNumeric: 'tabular-nums', color: r.cancelledTrips > 0 ? 'var(--color-danger-700)' : 'inherit' }}>
                  {r.cancelledTrips}
                </TableCell>
                <TableCell style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-success-700)', fontWeight: 600 }}>
                  {r.completedTrips}
                </TableCell>
                <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <Badge variant={r.onTimeRatePercent >= 90 ? 'success' : 'warning'} size="sm">
                    {r.onTimeRatePercent}%
                  </Badge>
                </TableCell>
                <TableCell style={{ fontVariantNumeric: 'tabular-nums' }}>{r.avgDelayMinutes} min</TableCell>
                <TableCell style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {(r.topDelayReasons || []).length === 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  ) : (
                    r.topDelayReasons.map((x, idx) => (
                      <span key={idx}>
                        {x.reason} ({x.count}){idx < r.topDelayReasons.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default DispatchReportsPage;
