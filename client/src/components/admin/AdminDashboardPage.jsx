import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { dashboardService } from '../../services';
import { tripsOversightService } from '../../services/admin/tripsOversightService';
import AdminRegionalMap from './AdminRegionalMap';
import './admin.css';

const AdminDashboardPage = () => {
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
          tripsOversightService.getTripsOversight({ size: 1000 })
        ]);
        setDashboardData(data);
        setActiveDrivers(drivers);

        // Filter for active trips (in progress, assigned, in transit, arrived)
        const activeTripsData = trips.items.filter(trip =>
          ['in_progress', 'assigned', 'in_transit', 'arrived'].includes(trip.tripStatus)
        );
        setActiveTrips(activeTripsData);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'USER_LOGIN': return '✅';
      case 'LOGIN_FAILED': return '❌';
      case 'USER_UPDATE': return '📝';
      case 'SYSTEM_EVENT': return '⚙️';
      case 'COMPLIANCE_ALERT': return '🚨';
      default: return '📌';
    }
  };

  const getActivityClass = (activityType, success) => {
    if (activityType === 'COMPLIANCE_ALERT' || activityType === 'LOGIN_FAILED') return 'error';
    if (success) return 'success';
    return '';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          padding: '12px 16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '14px', color: '#374151' }}>
            {payload[0].payload.status}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: 700, color: payload[0].payload.color }}>
            {payload[0].value} shipments
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>📊 Admin Dashboard</h1>
          <p>Real-time Heavy Logistics Management</p>
        </div>
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading dashboard data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-container">
        <div className="admin-page-header">
          <h1>📊 Admin Dashboard</h1>
          <p>Real-time Heavy Logistics Management</p>
        </div>
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  const {
    userStats,
    fleetOverview,
    recentActivities,
    operationsOverview,
    fleetLifecycle,
    complianceStatus,
    financialPerformance,
    activeOperations,
    systemHealth
  } = dashboardData || {};



  const totalActiveUsers = (userStats?.activeDispatchers || 0) +
                          (userStats?.activeDrivers || 0);

  // Prepare data for charts
  const fleetAgeData = fleetLifecycle?.vehicleAgeGroups ?
    Object.entries(fleetLifecycle.vehicleAgeGroups).map(([key, value]) => ({
      name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value,
      color: key.includes('0-2') ? '#10b981' : key.includes('2-4') ? '#f59e0b' : '#ef4444'
    })) : [];

  // Color mapping for different vehicle types
  const getVehicleTypeColor = (vehicleType) => {
    const type = vehicleType.toLowerCase();
    if (type.includes('container')) return '#3b82f6'; // Blue
    if (type.includes('heavy') || type.includes('truck')) return '#8b5cf6'; // Purple
    if (type.includes('van')) return '#06b6d4'; // Cyan
    if (type.includes('pickup')) return '#10b981'; // Green
    if (type.includes('sedan')) return '#f59e0b'; // Amber
    if (type.includes('suv')) return '#ef4444'; // Red
    if (type.includes('motorcycle')) return '#ec4899'; // Pink
    if (type.includes('bicycle')) return '#84cc16'; // Lime
    // Default colors for any other types
    const defaultColors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#84cc16'];
    return defaultColors[Math.abs(vehicleType.length) % defaultColors.length];
  };

  const vehicleTypeData = fleetLifecycle?.vehicleTypes ?
    Object.entries(fleetLifecycle.vehicleTypes).map(([key, value]) => ({
      name: key,
      value,
      color: getVehicleTypeColor(key)
    })) : [];

  return (
    <div className="trips-oversight">
      {/* Header */}
      <div className="oversight-header">
        <h1>📊 Admin Dashboard</h1>
        <p className="muted">Real-time Heavy Logistics Management Overview</p>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)',
          border: '1px solid #bbf7d0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            fontSize: '32px',
            opacity: 0.3
          }}>📊</div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#166534',
            marginBottom: '8px'
          }}>
            DIFOT Rate
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#166534',
            marginBottom: '4px',
            lineHeight: '1'
          }}>
            {operationsOverview?.difotRate?.toFixed(1) || 0}%
          </div>
          <div style={{
            fontSize: '12px',
            color: '#15803d',
            fontWeight: '500'
          }}>
            On-time delivery performance
          </div>
        </div>

        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
          border: '1px solid #bfdbfe',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            fontSize: '32px',
            opacity: 0.3
          }}>🚛</div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#1e40af',
            marginBottom: '8px'
          }}>
            Fleet Utilization
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#1e40af',
            marginBottom: '4px',
            lineHeight: '1'
          }}>
            {operationsOverview?.fleetUtilization?.toFixed(1) || 0}%
          </div>
          <div style={{
            fontSize: '12px',
            color: '#1d4ed8',
            fontWeight: '500'
          }}>
            Active vehicle usage
          </div>
        </div>

        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
          border: '1px solid #fde68a',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            fontSize: '32px',
            opacity: 0.3
          }}>💰</div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#92400e',
            marginBottom: '8px'
          }}>
            Today's Revenue
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: 800,
            color: '#92400e',
            marginBottom: '4px',
            lineHeight: '1'
          }}>
            {operationsOverview?.todayRevenue ?
              new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(operationsOverview.todayRevenue).replace('₫', '₫') :
              '₫0'}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#b45309',
            fontWeight: '500'
          }}>
            Daily earnings
          </div>
        </div>

        <div className="stat-card" style={{
          background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(147, 51, 234, 0.15)',
          border: '1px solid #e9d5ff',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            fontSize: '32px',
            opacity: 0.3
          }}>🚚</div>
          <div style={{
            fontSize: '14px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#7c2d12',
            marginBottom: '8px'
          }}>
            Active Trips
          </div>
          <div style={{
            fontSize: '32px',
            fontWeight: 800,
            color: '#7c2d12',
            marginBottom: '4px',
            lineHeight: '1'
          }}>
            {operationsOverview?.activeTrips || 0}
          </div>
          <div style={{
            fontSize: '12px',
            color: '#9a3412',
            fontWeight: '500'
          }}>
            Ongoing deliveries
          </div>
        </div>
      </div>

      {/* Fleet Management Section */}
      <div className="card">
        <h3 style={{ marginBottom: '16px', color: 'var(--text-color)' }}>🚛 Fleet Management</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          <div>
            <h4 style={{ marginBottom: '12px', color: 'var(--text-color)', fontSize: '16px', textAlign: 'center' }}>Vehicle Types Distribution</h4>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {vehicleTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} vehicles`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '12px', color: 'var(--text-color)', fontSize: '16px', textAlign: 'center' }}>Fleet Status Overview</h4>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Available', value: fleetLifecycle?.availableVehicles || 0, color: '#10b981' },
                    { name: 'In Use', value: fleetLifecycle?.inUseVehicles || 0, color: '#f59e0b' },
                    { name: 'Maintenance', value: fleetLifecycle?.maintenanceVehicles || 0, color: '#ef4444' }
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} vehicles`, 'Count']} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance & Safety Section */}
      <div className="card">
        <h3 style={{ marginBottom: '16px', color: 'var(--text-color)' }}>🛡️ Compliance & Safety</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <h4 style={{ marginBottom: '12px', color: 'var(--text-color)', fontSize: '16px' }}>Driver Compliance</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--success)' }}>✅ Compliant:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {complianceStatus?.compliantDrivers || 0} drivers ({complianceStatus?.totalDrivers ? ((complianceStatus.compliantDrivers / complianceStatus.totalDrivers) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--warning)' }}>⚠️ Warning:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {complianceStatus?.warningDrivers || 0} drivers ({complianceStatus?.totalDrivers ? ((complianceStatus.warningDrivers / complianceStatus.totalDrivers) * 100).toFixed(0) : 0}%)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--danger)' }}>🚫 At Risk:</span>
                <span style={{ fontWeight: 'bold' }}>
                  {complianceStatus?.atRiskDrivers || 0} drivers ({complianceStatus?.totalDrivers ? ((complianceStatus.atRiskDrivers / complianceStatus.totalDrivers) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '12px', color: 'var(--text-color)', fontSize: '16px' }}>Safety Metrics</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Driver Rating:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--warning)' }}>{complianceStatus?.averageDriverRating?.toFixed(1) || 0}/5.0</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>On-Time Rate:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{complianceStatus?.onTimeDeliveryRate?.toFixed(1) || 0}%</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Customer Satisfaction:</span>
                <span style={{ fontWeight: 'bold', color: 'var(--info)' }}>{complianceStatus?.customerSatisfaction?.toFixed(1) || 0}/5.0</span>
              </div>
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '12px', color: 'var(--text-color)', fontSize: '16px' }}>Documentation</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ color: 'var(--success)', fontWeight: '500' }}>✅ All licenses valid</div>
              <div style={{ color: 'var(--warning)', fontWeight: '500' }}>
                🟡 {complianceStatus?.expiringLicenses || 0} licenses expire in 30 days
              </div>
            </div>
          </div>
        </div>
      </div>



      {/* Regional Activity & Operations */}
      <div className="card">
        <h3 style={{ marginBottom: '16px', color: 'var(--text-color)' }}>�️ Regional Activity & Operations</h3>

        {/* Operations Summary Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '8px', color: 'var(--text-color)', fontSize: '14px' }}>Pending Assignments</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--warning)' }}>
                {activeOperations?.pendingAssignments || 0} orders awaiting driver assignment
              </div>
              <div style={{ fontSize: '14px', color: 'var(--danger)', fontWeight: '500' }}>
                {activeOperations?.urgentAssignments || 0} urgent orders (marked for priority)
              </div>
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '8px', color: 'var(--text-color)', fontSize: '14px' }}>Interactive Map</h4>
            <div style={{ fontSize: '14px', color: 'var(--muted)' }}>
              Hover over driver markers to view detailed trip information including routes, ETAs, and delay alerts.
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <h4 style={{ marginBottom: '8px', color: 'var(--text-color)', fontSize: '14px' }}>System Alerts</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ color: 'var(--danger)', fontSize: '13px' }}>🚨 {systemHealth?.criticalAlerts || 0} critical alerts</div>
              <div style={{ color: 'var(--muted)', fontSize: '13px' }}>📋 {systemHealth?.delayReports || 0} delay reports</div>
              <div style={{ color: 'var(--warning)', fontSize: '13px' }}>⚠️ {systemHealth?.complianceWarnings || 0} compliance warnings</div>
            </div>
          </div>
        </div>

        {/* Regional Map */}
        <div style={{ padding: '20px' }}>
          <AdminRegionalMap
            activeDrivers={activeDrivers}
            activeTrips={activeTrips}
            onRegionClick={(region, stats) => {
              console.log('Region clicked:', region, stats);
              // Could add navigation to detailed region view here
            }}
          />
        </div>
      </div>

      {/* System Health */}
      <div className="card">
        <h3 style={{ marginBottom: '16px', color: 'var(--text-color)' }}>⚙️ System Health</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div>
            <h4 style={{ marginBottom: '12px', color: 'var(--text-color)', fontSize: '16px' }}>Recent Activity</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {systemHealth?.recentActivities?.slice(0, 5).map((activity, index) => (
                <div key={index} style={{ fontSize: '14px', color: 'var(--text-color)' }}>
                  • {activity.activity} ({activity.timestamp})
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ marginBottom: '12px', color: 'var(--text-color)', fontSize: '16px' }}>Quick Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button className="btn" style={{ width: '100%' }} onClick={() => navigate('/admin/vehicles')}>
                Manage Vehicle
              </button>
              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/admin/trips-oversight')}>
                View Trips
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
