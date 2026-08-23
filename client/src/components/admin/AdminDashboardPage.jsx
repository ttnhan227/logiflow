import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { dashboardService } from '../../services';
import { tripsOversightService } from '../../services/admin/tripsOversightService';
import AdminRegionalMap from './AdminRegionalMap';
import {
  Button,
  Card,
  StatCard,
  Badge,
  PageHeader,
  Alert,
  LoadingSpinner,
} from '@/components/ui';
import {
  LuTrendingUp,
  LuTruck,
  LuCreditCard,
  LuShieldCheck,
  LuTriangleAlert,
  LuCircleCheck,
  LuArrowRight,
} from 'react-icons/lu';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeDrivers, setActiveDrivers] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, drivers, trips] = await Promise.all([
          dashboardService.getDashboardData(),
          dashboardService.getActiveDriverLocations(),
          tripsOversightService.getTripsOversight({ size: 1000 }),
        ]);
        setDashboardData(data);
        setActiveDrivers(drivers || []);

        const activeTripsData = (trips?.items || []).filter((trip) =>
          ['in_progress', 'assigned', 'in_transit', 'arrived'].includes(trip.tripStatus)
        );
        setActiveTrips(activeTripsData);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Failed to load executive dashboard telemetry.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner fullPage text="Aggregating enterprise logistics telemetry..." />;
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert variant="danger">{error}</Alert>
      </div>
    );
  }

  const {
    operationsOverview,
    fleetLifecycle,
    complianceStatus,
    activeOperations,
    systemHealth,
  } = dashboardData || {};

  const vehicleTypeColors = ['#2563eb', '#7c3aed', '#0284c7', '#059669', '#d97706', '#dc2626'];
  const vehicleTypeData = fleetLifecycle?.vehicleTypes
    ? Object.entries(fleetLifecycle.vehicleTypes).map(([key, value], idx) => ({
        name: key,
        value,
        color: vehicleTypeColors[idx % vehicleTypeColors.length],
      }))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PageHeader
        title="Enterprise Operations Oversight"
        description="Comprehensive real-time command of nationwide linehaul carrier operations, DIFOT reliability, and fleet health."
        badge={<Badge variant="brand">Executive Suite</Badge>}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link to="/admin/reports">
              <Button variant="outline" size="sm">
                Financial Reports
              </Button>
            </Link>
            <Link to="/admin/trips-oversight">
              <Button variant="primary" size="sm">
                Trips Oversight
              </Button>
            </Link>
          </div>
        }
      />

      {/* Top 4 KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <StatCard
          title="DIFOT Delivery Reliability"
          value={`${operationsOverview?.difotRate?.toFixed(1) || 0}%`}
          icon={<LuTrendingUp size={20} />}
          change="Delivery in Full, on Time"
          changeType="positive"
        />
        <StatCard
          title="Fleet Utilization Rate"
          value={`${operationsOverview?.fleetUtilization?.toFixed(1) || 0}%`}
          icon={<LuTruck size={20} />}
          description="Active vs idle assets"
        />
        <StatCard
          title="Today's Settled Revenue"
          value={
            operationsOverview?.todayRevenue
              ? `${Number(operationsOverview.todayRevenue).toLocaleString()} VND`
              : '0 VND'
          }
          icon={<LuCreditCard size={20} />}
          description="Daily completed tariff turnover"
        />
        <StatCard
          title="Active Linehaul Trips"
          value={operationsOverview?.activeTrips || 0}
          icon={<LuTruck size={20} />}
          description="Currently en route nationwide"
        />
      </div>

      {/* Fleet & Distribution Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Vehicle Class Distribution */}
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            Commercial Vehicle Class Breakdown
          </h3>
          <div style={{ height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vehicleTypeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  dataKey="value"
                  paddingAngle={4}
                >
                  {vehicleTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '12px' }}>
            {vehicleTypeData.map((t) => (
              <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: t.color }} />
                <span>{t.name} ({t.value})</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Fleet Operational Readiness */}
        <Card style={{ padding: '24px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
            Fleet Operational Readiness
          </h3>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Available', value: fleetLifecycle?.availableVehicles || 0, fill: '#059669' },
                  { name: 'In Service', value: fleetLifecycle?.inUseVehicles || 0, fill: '#2563eb' },
                  { name: 'Maintenance', value: fleetLifecycle?.maintenanceVehicles || 0, fill: '#dc2626' },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Compliance & Regulatory Safety */}
      <Card style={{ padding: '24px' }}>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
          Driver Compliance & Safety Governance
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Driver License Status</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--color-success-700)', fontWeight: 600 }}>✓ Verified Compliant:</span>
              <strong>{complianceStatus?.compliantDrivers || 0} drivers</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--color-warning-700)', fontWeight: 600 }}>⚠️ Audit Warnings:</span>
              <strong>{complianceStatus?.warningDrivers || 0} drivers</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span style={{ color: 'var(--color-danger-700)', fontWeight: 600 }}>✗ At Risk:</span>
              <strong>{complianceStatus?.atRiskDrivers || 0} drivers</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Safety Index</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span>Avg. Carrier Rating:</span>
              <strong>{complianceStatus?.averageDriverRating?.toFixed(1) || 0} / 5.0</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span>On-Time Fulfillment:</span>
              <strong>{complianceStatus?.onTimeDeliveryRate?.toFixed(1) || 0}%</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
              <span>Customer CSAT:</span>
              <strong>{complianceStatus?.customerSatisfaction?.toFixed(1) || 0} / 5.0</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Regulatory Alerts</span>
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)' }}>
              <div>🛡️ {complianceStatus?.expiringLicenses || 0} licenses expiring within 30 days</div>
              <div style={{ marginTop: '4px', color: 'var(--color-brand-700)' }}>
                {activeOperations?.pendingAssignments || 0} pending orders awaiting assignment
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Regional GPS Telemetry & Map */}
      <Card style={{ padding: '24px' }}>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: '0 0 16px 0' }}>
          Nationwide Corridor Operations Map
        </h3>
        <AdminRegionalMap activeDrivers={activeDrivers} activeTrips={activeTrips} />
      </Card>
    </div>
  );
};

export default AdminDashboardPage;
