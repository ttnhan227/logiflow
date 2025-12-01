import React, { useState, useEffect } from 'react';
import { dashboardService } from '../../services';
import './admin.css';

const AdminDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await dashboardService.getDashboardData();
        setDashboardData(data);
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

  const { userStats, fleetOverview, recentActivities } = dashboardData || {};

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">📊 Admin Dashboard</h1>

      {/* User Statistics Section */}
      <div className="dashboard-section">
        <h2 className="section-title">👥 User Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card highlight">
            <div className="stat-title">Total Users</div>
            <div className="stat-value">{userStats?.totalUsers || 0}</div>
            <div className="stat-change">All registered users</div>
          </div>
          <div className="stat-card success">
            <div className="stat-title">New Signups</div>
            <div className="stat-value">{userStats?.newSignups || 0}</div>
            <div className="stat-change">Last 7 days</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Active Dispatchers</div>
            <div className="stat-value">{userStats?.activeDispatchers || 0}</div>
            <div className="stat-change">Currently active</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Active Drivers</div>
            <div className="stat-value">{userStats?.activeDrivers || 0}</div>
            <div className="stat-change">Currently active</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Active Managers</div>
            <div className="stat-value">{userStats?.activeManagers || 0}</div>
            <div className="stat-change">Currently active</div>
          </div>
        </div>
      </div>

      {/* Fleet Overview Section */}
      <div className="dashboard-section">
        <h2 className="section-title">🚚 Fleet Overview</h2>
        <div className="stats-grid">
          <div className="stat-card highlight">
            <div className="stat-title">Active Vehicles</div>
            <div className="stat-value">{fleetOverview?.activeVehicles || 0}</div>
            <div className="stat-change">In fleet</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-title">Active Deliveries</div>
            <div className="stat-value">{fleetOverview?.activeDeliveries || 0}</div>
            <div className="stat-change">In transit</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Pending Deliveries</div>
            <div className="stat-value">{fleetOverview?.pendingDeliveries || 0}</div>
            <div className="stat-change">Awaiting pickup</div>
          </div>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div className="dashboard-section">
        <h2 className="section-title">📋 Recent Activities</h2>
        {recentActivities && recentActivities.length > 0 ? (
          <div className="activity-list">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className={`activity-item ${getActivityClass(activity.activityType, activity.success)}`}
              >
                <div className="activity-header">
                  <span className="activity-title">
                    {getActivityIcon(activity.activityType)} {activity.action}
                  </span>
                  <span>{formatDate(activity.timestamp)}</span>
                </div>
                <div>{activity.details}</div>
                <div className="activity-meta">
                  <span>👤 {activity.username}</span>
                  <span>🎭 {activity.role}</span>
                  {activity.ipAddress && <span>🌐 {activity.ipAddress}</span>}
                  {activity.consecutiveFailures && (
                    <span className="status danger">
                      ⚠️ {activity.consecutiveFailures} consecutive failures
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
