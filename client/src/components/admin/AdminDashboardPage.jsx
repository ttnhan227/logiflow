import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { dashboardService } from '../../services';
import './admin.css';

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeDrivers, setActiveDrivers] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, drivers] = await Promise.all([
          dashboardService.getDashboardData(),
          dashboardService.getActiveDriverLocations()
        ]);
        setDashboardData(data);
        setActiveDrivers(drivers);
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
      <div className="dashboard-container">
        <h1 className="dashboard-header">📊 Admin Dashboard</h1>
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading dashboard data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <h1 className="dashboard-header">📊 Admin Dashboard</h1>
        <div className="error-banner">{error}</div>
      </div>
    );
  }

  const { userStats, fleetOverview, recentActivities, shipmentStatistics, deliveryTimeStats } = dashboardData || {};
  
  const totalActiveUsers = (userStats?.activeDispatchers || 0) + 
                          (userStats?.activeDrivers || 0) + 
                          (userStats?.activeManagers || 0);

  // Prepare chart data - each status as a separate object for proper bar display
  const chartData = shipmentStatistics ? [
    { status: 'Scheduled', value: shipmentStatistics.scheduled, color: '#3b82f6' },
    { status: 'In Progress', value: shipmentStatistics.inProgress, color: '#f59e0b' },
    { status: 'Completed', value: shipmentStatistics.completed, color: '#10b981' },
    { status: 'Cancelled', value: shipmentStatistics.cancelled, color: '#ef4444' }
  ] : [];

  const totalShipments = shipmentStatistics 
    ? shipmentStatistics.scheduled + shipmentStatistics.inProgress + 
      shipmentStatistics.completed + shipmentStatistics.cancelled 
    : 0;

  const completionRate = shipmentStatistics && totalShipments > 0
    ? ((shipmentStatistics.completed / totalShipments) * 100).toFixed(1)
    : 0;

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">📊 Admin Dashboard</h1>

      {/* System Overview Section */}
      <div className="dashboard-section">
        <h2 className="section-title">📈 System Overview</h2>
        <div className="stats-grid">
          {/* Shipment Statistics Cards */}
          {chartData.length > 0 && (
            <>
              <div className="stat-card" style={{ borderColor: 'rgba(59, 130, 246, 0.2)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📅</div>
                <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Scheduled
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    <span
                      style={{
                        cursor: 'pointer',
                        color: '#3b82f6',
                        fontSize: '16px',
                        marginLeft: '2px',
                        borderRadius: '50%',
                        border: '1px solid #3b82f6',
                        width: '18px',
                        height: '18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fff',
                        fontWeight: 'bold',
                      }}
                      title="Number of shipments scheduled for future delivery."
                    >
                      i
                    </span>
                  </span>
                </div>
                <div className="stat-value" style={{ color: '#3b82f6' }}>
                  {shipmentStatistics.scheduled}
                </div>
                <div className="stat-subtitle">+{Math.floor(shipmentStatistics.scheduled * 0.12)} from last month</div>
              </div>

              <div className="stat-card warning">
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚚</div>
                <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  In Progress
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    <span
                      style={{
                        cursor: 'pointer',
                        color: '#f59e0b',
                        fontSize: '16px',
                        marginLeft: '2px',
                        borderRadius: '50%',
                        border: '1px solid #f59e0b',
                        width: '18px',
                        height: '18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fff',
                        fontWeight: 'bold',
                      }}
                      title="Shipments currently being delivered."
                    >
                      i
                    </span>
                  </span>
                </div>
                <div className="stat-value" style={{ color: '#f59e0b' }}>
                  {shipmentStatistics.inProgress}
                </div>
                <div className="stat-subtitle">Active shipments</div>
              </div>

              <div className="stat-card success">
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Completed
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    <span
                      style={{
                        cursor: 'pointer',
                        color: '#10b981',
                        fontSize: '16px',
                        marginLeft: '2px',
                        borderRadius: '50%',
                        border: '1px solid #10b981',
                        width: '18px',
                        height: '18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fff',
                        fontWeight: 'bold',
                      }}
                      title="Shipments successfully delivered to recipients."
                    >
                      i
                    </span>
                  </span>
                </div>
                <div className="stat-value" style={{ color: '#10b981' }}>
                  {shipmentStatistics.completed}
                </div>
                <div className="stat-subtitle">+{Math.floor(shipmentStatistics.completed * 0.18)} from last month</div>
              </div>

              <div className="stat-card danger">
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>❌</div>
                <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Cancelled
                  <span style={{ position: 'relative', display: 'inline-block' }}>
                    <span
                      style={{
                        cursor: 'pointer',
                        color: '#ef4444',
                        fontSize: '16px',
                        marginLeft: '2px',
                        borderRadius: '50%',
                        border: '1px solid #ef4444',
                        width: '18px',
                        height: '18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fff',
                        fontWeight: 'bold',
                      }}
                      title="Shipments that were cancelled before completion."
                    >
                      i
                    </span>
                  </span>
                </div>
                <div className="stat-value" style={{ color: '#ef4444' }}>
                  {shipmentStatistics.cancelled}
                </div>
                <div className="stat-subtitle">{((shipmentStatistics.cancelled / totalShipments) * 100).toFixed(1)}% cancellation rate</div>
              </div>
            </>
          )}

          {/* System Statistics Cards */}
          <div className="stat-card highlight">
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>👥</div>
            <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Total Users
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span
                  style={{
                    cursor: 'pointer',
                    color: '#6366f1',
                    fontSize: '16px',
                    marginLeft: '2px',
                    borderRadius: '50%',
                    border: '1px solid #6366f1',
                    width: '18px',
                    height: '18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff',
                    fontWeight: 'bold',
                  }}
                  title="Total number of registered users in the system."
                >
                  i
                </span>
              </span>
            </div>
            <div className="stat-value">{userStats?.totalUsers || 0}</div>
            <div className="stat-subtitle">{userStats?.newSignups || 0} new this week</div>
          </div>
          <div className="stat-card success">
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
            <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Active Users
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span
                  style={{
                    cursor: 'pointer',
                    color: '#10b981',
                    fontSize: '16px',
                    marginLeft: '2px',
                    borderRadius: '50%',
                    border: '1px solid #10b981',
                    width: '18px',
                    height: '18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff',
                    fontWeight: 'bold',
                  }}
                  title="Users who have logged in or performed actions recently."
                >
                  i
                </span>
              </span>
            </div>
            <div className="stat-value">{totalActiveUsers}</div>
            <div className="stat-subtitle">{((totalActiveUsers / (userStats?.totalUsers || 1)) * 100).toFixed(0)}% of total users</div>
          </div>
          <div className="stat-card">
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚗</div>
            <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Total Vehicles
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span
                  style={{
                    cursor: 'pointer',
                    color: '#6366f1',
                    fontSize: '16px',
                    marginLeft: '2px',
                    borderRadius: '50%',
                    border: '1px solid #6366f1',
                    width: '18px',
                    height: '18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff',
                    fontWeight: 'bold',
                  }}
                  title="Number of vehicles currently registered in the fleet."
                >
                  i
                </span>
              </span>
            </div>
            <div className="stat-value">{fleetOverview?.activeVehicles || 0}</div>
            <div className="stat-subtitle">Fleet capacity</div>
          </div>
          <div className="stat-card warning">
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚚</div>
            <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Active Deliveries
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span
                  style={{
                    cursor: 'pointer',
                    color: '#f59e0b',
                    fontSize: '16px',
                    marginLeft: '2px',
                    borderRadius: '50%',
                    border: '1px solid #f59e0b',
                    width: '18px',
                    height: '18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff',
                    fontWeight: 'bold',
                  }}
                  title="Deliveries that are currently in transit."
                >
                  i
                </span>
              </span>
            </div>
            <div className="stat-value">{fleetOverview?.activeDeliveries || 0}</div>
            <div className="stat-subtitle">Currently in transit</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'rgba(59, 130, 246, 0.2)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div>
            <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Pending Orders
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span
                  style={{
                    cursor: 'pointer',
                    color: '#3b82f6',
                    fontSize: '16px',
                    marginLeft: '2px',
                    borderRadius: '50%',
                    border: '1px solid #3b82f6',
                    width: '18px',
                    height: '18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff',
                    fontWeight: 'bold',
                  }}
                  title="Orders that are awaiting assignment to a driver or vehicle."
                >
                  i
                </span>
              </span>
            </div>
            <div className="stat-value">{fleetOverview?.pendingDeliveries || 0}</div>
            <div className="stat-subtitle">Awaiting assignment</div>
          </div>
          <div className="stat-card" style={{ borderColor: 'rgba(16, 185, 129, 0.2)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(16, 185, 129, 0.02))' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>💰</div>
            <div className="stat-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Total Revenue
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span
                  style={{
                    cursor: 'pointer',
                    color: '#10b981',
                    fontSize: '16px',
                    marginLeft: '2px',
                    borderRadius: '50%',
                    border: '1px solid #10b981',
                    width: '18px',
                    height: '18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fff',
                    fontWeight: 'bold',
                  }}
                  title="Total Revenue is the sum of delivery fees from all delivered orders."
                >
                  i
                </span>
              </span>
            </div>
            <div className="stat-value" style={{ color: '#10b981' }}>
              {fleetOverview?.totalRevenue 
                ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(fleetOverview.totalRevenue)
                : '₫0'}
            </div>
            <div className="stat-subtitle">From {shipmentStatistics?.completed || 0} completed orders</div>
          </div>
        </div>
      </div>

      {/* Shipment Statistics Chart */}
      <div className="dashboard-section">
        <h2 className="section-title">📊 Distribution Overview</h2>
        {chartData.length > 0 ? (
          <>
            {/* Two Chart Layout */}
            <div className="two-chart-layout">
              {/* Bar Chart */}
              <div className="chart-card">
                <h3 className="section-subtitle">Distribution Overview</h3>
                <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  barSize={80}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="status" 
                    tick={{ fontSize: 14, fill: '#6b7280', fontWeight: 500 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 13, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    label={{ 
                      value: 'Number of Shipments', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { fontSize: 14, fill: '#6b7280', fontWeight: 600 }
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                    formatter={(value) => <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>{value}</span>}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Shipments"
                    radius={[8, 8, 0, 0]}
                    label={{ 
                      position: 'top', 
                      fontSize: 16, 
                      fontWeight: 700,
                      fill: '#374151'
                    }}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>

              {/* Line Chart - Avg Delivery Time */}
              <div className="chart-card">
                <h3 className="section-subtitle">Avg Delivery Time</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart 
                    data={deliveryTimeStats || []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="day" 
                      tick={{ fontSize: 14, fill: '#6b7280', fontWeight: 500 }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 13, fill: '#9ca3af' }}
                      axisLine={{ stroke: '#d1d5db' }}
                      tickLine={{ stroke: '#d1d5db' }}
                      label={{ 
                        value: 'Minutes', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { fontSize: 14, fill: '#6b7280', fontWeight: 600 }
                      }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                      formatter={(value) => <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: 500 }}>{value}</span>}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgMinutes" 
                      name="Avg Time (min)"
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="summary-stats-grid">
              <div className="summary-stat-item">
                <div className="stat-title">Total Shipments</div>
                <div className="stat-value">{totalShipments}</div>
              </div>
              <div className="summary-stat-item">
                <div className="stat-title">Completion Rate</div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>{completionRate}%</div>
              </div>
              <div className="summary-stat-item">
                <div className="stat-title">In Transit</div>
                <div className="stat-value" style={{ color: 'var(--warning)' }}>{shipmentStatistics.inProgress}</div>
              </div>
              <div className="summary-stat-item">
                <div className="stat-title">Pending</div>
                <div className="stat-value" style={{ color: 'var(--info)' }}>{shipmentStatistics.scheduled}</div>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No Shipment Data</div>
            <div className="empty-state-description">Shipment statistics will appear here once trips are created.</div>
          </div>
        )}
      </div>

      {/* Regional Activity Overview */}
      <div className="dashboard-section">
        <h2 className="section-title">🗺️ Regional Activity Overview</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '20px',
          marginBottom: '2rem'
        }}>
          {/* North Region */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌆</div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '700' }}>Northern Region</h3>
              <div style={{ fontSize: '14px', opacity: 0.95, marginBottom: '12px' }}>
                Hanoi, Hai Phong, Quang Ninh
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Active Drivers</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px' }}>
                    {activeDrivers.filter(d => parseFloat(d.latitude) > 20).length}
                  </div>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Deliveries</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px' }}>
                    {Math.floor((fleetOverview?.activeDeliveries || 0) * 0.35)}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ 
              position: 'absolute', 
              right: '-20px', 
              bottom: '-20px', 
              fontSize: '120px', 
              opacity: 0.1 
            }}>🌆</div>
          </div>

          {/* Central Region */}
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏖️</div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '700' }}>Central Region</h3>
              <div style={{ fontSize: '14px', opacity: 0.95, marginBottom: '12px' }}>
                Da Nang, Hue, Nha Trang
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Active Drivers</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px' }}>
                    {activeDrivers.filter(d => {
                      const lat = parseFloat(d.latitude);
                      return lat >= 12 && lat <= 20;
                    }).length}
                  </div>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Deliveries</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px' }}>
                    {Math.floor((fleetOverview?.activeDeliveries || 0) * 0.25)}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ 
              position: 'absolute', 
              right: '-20px', 
              bottom: '-20px', 
              fontSize: '120px', 
              opacity: 0.1 
            }}>🏖️</div>
          </div>

          {/* South Region */}
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'white',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌴</div>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '700' }}>Southern Region</h3>
              <div style={{ fontSize: '14px', opacity: 0.95, marginBottom: '12px' }}>
                Ho Chi Minh, Can Tho, Vung Tau
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Active Drivers</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px' }}>
                    {activeDrivers.filter(d => parseFloat(d.latitude) < 12).length}
                  </div>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Deliveries</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '4px' }}>
                    {Math.floor((fleetOverview?.activeDeliveries || 0) * 0.40)}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ 
              position: 'absolute', 
              right: '-20px', 
              bottom: '-20px', 
              fontSize: '120px', 
              opacity: 0.1 
            }}>🌴</div>
          </div>
        </div>
        {/* Active Drivers Detail Table */}
        <div className="table-container">
          <h3 className="section-subtitle">Active Drivers ({activeDrivers.length})</h3>
          {activeDrivers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🗺️</div>
              <div className="empty-state-title">No Active Drivers</div>
              <div className="empty-state-description">Drivers will appear here when on delivery.</div>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>Phone</th>
                    <th>Trip</th>
                    <th>Status</th>
                    <th>Vehicle</th>
                    <th>Route</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDrivers.map((d) => (
                    <tr key={`${d.driverId}-${d.tripId}`}>
                      <td>{d.driverName}</td>
                      <td>{d.driverPhone || 'N/A'}</td>
                      <td>#{d.tripId}</td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600,
                          backgroundColor: d.tripStatus === 'in_progress' ? '#ffebcc' : '#e9d5ff',
                          color: d.tripStatus === 'in_progress' ? '#a36200' : '#5b21b6'
                        }}>
                          {d.tripStatus?.toUpperCase()}
                        </span>
                      </td>
                      <td>{d.vehiclePlate || '—'}</td>
                      <td>{d.routeName || '—'}</td>
                      <td>{typeof d.latitude === 'number' ? d.latitude.toFixed(6) : d.latitude}</td>
                      <td>{typeof d.longitude === 'number' ? d.longitude.toFixed(6) : d.longitude}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="dashboard-section">
        <h2 className="section-title">📋 Recent Activities</h2>
        {recentActivities && recentActivities.length > 0 ? (
          <div className="activity-list">
            {recentActivities.slice(0, 5).map((activity, index) => (
              <div
                key={index}
                className={`activity-item ${getActivityClass(activity.activityType, activity.success)}`}
              >
                <div className="activity-header">
                  <span className="activity-title">
                    {getActivityIcon(activity.activityType)} {activity.action}
                  </span>
                  <span className="activity-time">{formatDate(activity.timestamp)}</span>
                </div>
                <div className="activity-details">{activity.details}</div>
                <div className="activity-meta">
                  <span>👤 {activity.username}</span>
                  <span>🎭 {activity.role}</span>
                  {activity.ipAddress && <span>🌐 {activity.ipAddress}</span>}
                  {activity.consecutiveFailures && (
                    <span className="status danger">
                      ⚠️ {activity.consecutiveFailures} failures
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No Recent Activities</div>
            <div className="empty-state-description">
              Activity logs will appear here once users interact with the system.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;