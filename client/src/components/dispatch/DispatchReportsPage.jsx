import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import reportsService from '../../services/dispatch/reportsService';
import './dispatch.css';

const StatCard = ({ title, value, subtext }) => (
  <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
    <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
      {title}
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, color: '#111827', marginTop: 6 }}>{value}</div>
    {subtext && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{subtext}</div>}
  </div>
);

const fmtDate = (s) => {
  try {
    return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return s;
  }
};

const DispatchReportsPage = () => {
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
        const errMsg = e?.error || e?.message || e?.response?.data?.error || 'Failed to load daily report';
        setError(errMsg);
        setRows([]);
        console.error('Daily report error:', e);
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
    const onTimeRate = t.completedWithActualArrival === 0 ? 0 : (onTimeTrips * 100) / t.completedWithActualArrival;
    const avgDelay = t.completedWithActualArrival === 0 ? 0 : t.totalDelayMinutes / t.completedWithActualArrival;

    return {
      ...t,
      onTimeTrips,
      onTimeRate: Math.round(onTimeRate * 10) / 10,
      avgDelay: Math.round(avgDelay * 10) / 10,
    };
  }, [rows]);

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>📈 Daily Stats / Delays</h1>
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
            Status counts are bucketed by <strong>scheduled departure</strong>. Delay metrics are based on completed trips bucketed by <strong>actual arrival</strong>.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="reports-date-input">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange((p) => ({ ...p, startDate: e.target.value }))}
            />
          </div>
          <span style={{ color: '#9ca3af' }}>→</span>
          <div className="reports-date-input">
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange((p) => ({ ...p, endDate: e.target.value }))}
            />
          </div>
          <button
            onClick={() => reportsService.downloadDailyReportPdf(dateRange.startDate, dateRange.endDate)}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            disabled={loading}
          >
            📄 Download PDF
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 16, padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 10 }}>
          {error}
        </div>
      )}

      {/* KPI row */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <StatCard title="Total Trips" value={totals.totalTrips} subtext="(scheduledDeparture buckets)" />
        <StatCard title="Completed Trips" value={totals.completedTrips} subtext="(status counts)" />
        <StatCard title="On-time Rate" value={`${totals.onTimeRate}%`} subtext="Completed only" />
        <StatCard title="Avg Delay" value={`${totals.avgDelay} min`} subtext="Completed only (SLA adjusted)" />
      </div>

      {/* Charts */}
      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ fontWeight: 800, color: '#111827' }}>Trip volume vs cancellations</div>
          <div style={{ height: 260, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tickFormatter={fmtDate} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="totalTrips" stroke="#3b82f6" fill="#93c5fd" name="Total Trips" />
                <Area type="monotone" dataKey="cancelledTrips" stroke="#ef4444" fill="rgba(239,68,68,0.15)" name="Cancelled" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ fontWeight: 800, color: '#111827' }}>Avg delay (min)</div>
          <div style={{ height: 260, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" tickFormatter={fmtDate} hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgDelayMinutes" fill="#f59e0b" name="Avg Delay" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Daily table */}
      <div style={{ marginTop: 16, background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#111827' }}>Daily breakdown</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>
              Delay minutes use: max(0, (actual - scheduled) - SLA extension).
            </div>
          </div>
          {loading && <div style={{ fontSize: 12, color: '#6b7280' }}>Loading…</div>}
        </div>

        <div style={{ overflowX: 'auto', marginTop: 12 }}>
          <table className="admin-table" style={{ width: '100%' }}>
            <thead>
              <tr style={{ background: '#f9fafb', color: '#6b7280', fontSize: 12, textTransform: 'uppercase' }}>
                <th style={{ padding: 12 }}>Date</th>
                <th>Total</th>
                <th>Scheduled</th>
                <th>In Progress</th>
                <th>Cancelled</th>
                <th>Completed</th>
                <th>On-time %</th>
                <th>Avg Delay</th>
                <th>Top Delay Reasons</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 12, fontWeight: 700 }}>{r.date}</td>
                  <td>{r.totalTrips}</td>
                  <td>{r.scheduledTrips}</td>
                  <td>{r.inProgressTrips}</td>
                  <td>{r.cancelledTrips}</td>
                  <td>{r.completedTrips}</td>
                  <td>{r.onTimeRatePercent}%</td>
                  <td>{r.avgDelayMinutes} min</td>
                  <td style={{ maxWidth: 380 }}>
                    {(r.topDelayReasons || []).length === 0
                      ? <span style={{ color: '#9ca3af' }}>—</span>
                      : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {r.topDelayReasons.map((x, idx) => (
                            <div key={idx} style={{ fontSize: 12, color: '#374151' }}>
                              • {x.reason} <span style={{ color: '#6b7280' }}>({x.count})</span>
                            </div>
                          ))}
                        </div>
                      )}
                  </td>
                </tr>
              ))}

              {(!loading && rows.length === 0) && (
                <tr>
                  <td colSpan={9} style={{ padding: 12, color: '#6b7280' }}>No data for selected range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DispatchReportsPage;
