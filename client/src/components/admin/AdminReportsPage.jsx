import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { reportsService } from '../../services';
import {
  Button,
  Card,
  StatCard,
  Input,
  Badge,
  Modal,
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
  LuFileText,
  LuTrendingUp,
  LuTruck,
  LuCalendar,
  LuCircleCheck,
  LuUser,
  LuCreditCard,
  LuAward,
} from 'react-icons/lu';

export const AdminReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  const [performanceReport, setPerformanceReport] = useState(null);
  const [costAnalysis, setCostAnalysis] = useState(null);
  const [driverPerformance, setDriverPerformance] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverDetailModal, setShowDriverDetailModal] = useState(false);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [performance, cost, drivers] = await Promise.all([
        reportsService.getPerformanceReport(dateRange.startDate, dateRange.endDate),
        reportsService.getCostAnalysis(dateRange.startDate, dateRange.endDate),
        reportsService.getDriverPerformance(dateRange.startDate, dateRange.endDate),
      ]);
      setPerformanceReport(performance);
      setCostAnalysis(cost);
      setDriverPerformance(drivers || []);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to aggregate business intelligence reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      await reportsService.downloadComprehensiveReport(dateRange.startDate, dateRange.endDate);
    } catch (err) {
      setError('Failed to export comprehensive analytics PDF: ' + (err.message || 'Error'));
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallOnTime = () => {
    if (!driverPerformance.length) return 0;
    const weighted = driverPerformance.reduce(
      (acc, d) => acc + d.onTimeDeliveryRate * d.totalTripsCompleted,
      0
    );
    const total = driverPerformance.reduce((acc, d) => acc + d.totalTripsCompleted, 0);
    return Math.round(weighted / (total || 1)) || 0;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Enterprise Business Intelligence & Reports"
        description="Comprehensive DIFOT compliance, linehaul gross margin, fleet capacity, and driver efficiency scorecards."
        badge={<Badge variant="brand">Executive Intelligence</Badge>}
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
              variant="primary"
              size="md"
              onClick={handleDownloadReport}
              loading={loading}
              leftIcon={<LuFileText size={16} />}
            >
              Export Intelligence PDF
            </Button>
          </div>
        }
      />

      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Top 4 KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="Fulfillment Volume"
          value={performanceReport?.totalTrips || 0}
          icon={<LuTruck size={20} />}
          description={`${performanceReport?.completionRate || 0}% completion reliability`}
        />
        <StatCard
          title="DIFOT Compliance"
          value={`${calculateOverallOnTime()}%`}
          change="Target 95%"
          changeType={calculateOverallOnTime() >= 90 ? 'positive' : 'negative'}
          icon={<LuTrendingUp size={20} />}
        />
        <StatCard
          title="Active Drivers"
          value={performanceReport?.totalActiveDrivers || 0}
          icon={<LuUser size={20} />}
          description={`${performanceReport?.averageTripsPerDriver || 0} trips/driver day`}
        />
        <StatCard
          title="Total Gross Turnover"
          value={`${driverPerformance.reduce((acc, d) => acc + (d.totalRevenue || 0), 0).toLocaleString()} VND`}
          icon={<LuCreditCard size={20} />}
          description="Consolidated tariffs"
        />
      </div>

      {/* Visual Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            Volume & Cancellation Rates
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Daily trip manifests plotted against operational cancellations.
          </p>

          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceReport?.dailyStats || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
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
            Average Delivery Latency (Minutes)
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
            Fulfillment duration metrics by calendar date.
          </p>

          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceReport?.dailyStats || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
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
                <Bar dataKey="averageDeliveryTimeMinutes" fill="#d97706" radius={[4, 4, 0, 0]} name="Minutes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Driver Performance Leaderboard Table */}
      <Card style={{ overflow: 'hidden', padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Driver Fleet Leaderboard & Scorecards
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Click any carrier to inspect AI performance recommendations and safety badges.
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver Profile</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead>Completed Trips</TableHead>
              <TableHead>On-Time SLA</TableHead>
              <TableHead>Customer Rating</TableHead>
              <TableHead>Total Revenue</TableHead>
              <TableHead style={{ textAlign: 'right' }}>Performance Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {driverPerformance.map((driver) => (
              <TableRow
                key={driver.driverId}
                onClick={() => {
                  setSelectedDriver(driver);
                  setShowDriverDetailModal(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <TableCell>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{driver.driverName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{driver.email}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={driver.status === 'available' ? 'success' : 'neutral'} size="sm" dot>
                    {driver.status}
                  </Badge>
                </TableCell>
                <TableCell style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {driver.totalTripsCompleted}
                </TableCell>
                <TableCell>
                  <Badge variant={driver.onTimeDeliveryRate >= 90 ? 'success' : 'warning'} size="sm">
                    {driver.onTimeDeliveryRate}%
                  </Badge>
                </TableCell>
                <TableCell style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--color-warning-700)' }}>
                  ★ {driver.customerRating}
                </TableCell>
                <TableCell style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {Number(driver.totalRevenue || 0).toLocaleString()} VND
                </TableCell>
                <TableCell style={{ textAlign: 'right' }}>
                  <Badge
                    variant={driver.performanceScore >= 80 ? 'brand' : driver.performanceScore >= 60 ? 'warning' : 'danger'}
                    size="md"
                  >
                    {driver.performanceScore} / 100
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Driver Scorecard Modal */}
      {showDriverDetailModal && selectedDriver && (
        <Modal
          isOpen={showDriverDetailModal}
          onClose={() => setShowDriverDetailModal(false)}
          title={`Driver Scorecard • ${selectedDriver.driverName}`}
          description={`${selectedDriver.email} • Rating: ★ ${selectedDriver.customerRating}`}
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Trips</span>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{selectedDriver.totalTripsCompleted}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>On-Time SLA</span>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-success-700)' }}>
                  {selectedDriver.onTimeDeliveryRate}%
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Overall Score</span>
                <div style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--color-brand-700)' }}>
                  {selectedDriver.performanceScore}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
                AI Dispatch Recommendations
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedDriver.improvementRecommendations?.length > 0 ? (
                  selectedDriver.improvementRecommendations.map((rec, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 12px',
                        backgroundColor: 'var(--color-brand-50)',
                        borderLeft: '3px solid var(--color-brand-600)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-brand-900)',
                      }}
                    >
                      {rec}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    No critical recommendations pending.
                  </div>
                )}
              </div>
            </div>

            {/* Badges */}
            {selectedDriver.efficiencyBadges?.length > 0 && (
              <div>
                <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
                  Carrier Endorsements
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedDriver.efficiencyBadges.map((badge, i) => (
                    <Badge key={i} variant="brand" size="sm">
                      <LuAward size={12} /> {badge}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminReportsPage;
