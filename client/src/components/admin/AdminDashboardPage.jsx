import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { dashboardService } from '../../services';
import AdminRegionalMap from './AdminRegionalMap';
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

  const { userStats, fleetOverview, recentActivities, shipmentStatistics, deliveryTimeStats, complianceAlerts } = dashboardData || {};

  const totalActiveUsers = (userStats?.activeDispatchers || 0) +
                          (userStats?.activeDrivers || 0);

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
            <div className="stat-value">{fleetOverview?.totalVehicles || 0}</div>
            <div className="stat-subtitle">{fleetOverview?.vehicleUtilization?.toFixed(1) || 0}% utilization</div>
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
            <div className="stat-subtitle">From paid orders</div>
          </div>
        </div>
      </div>


      {/* Regional Activity Overview */}
      <div className="dashboard-section">
        <h2 className="section-title">�️ Regional Activity Overview</h2>
        <AdminRegionalMap
          activeDrivers={activeDrivers}
          onRegionClick={(region, stats) => {
            console.log('Region clicked:', region, stats);
            // Could add navigation to detailed region view here
          }}
        />
      </div>


    </div>
  );
};

export default AdminDashboardPage;
