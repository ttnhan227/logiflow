import React, { useState, useEffect } from 'react';
import settingsService from '../../services/admin/settingsService';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

const StatCard = ({ title, value, unit = '', highlight = false }) => (
  <div className={`stat-card ${highlight ? 'highlight' : ''}`}>
    <div className="stat-title">{title}</div>
    <div className="stat-value">{value}{unit}</div>
  </div>
);

const Section = ({ title, children, columns = 1 }) => (
  <div className="dashboard-section">
    <h2 className="section-title">{title}</h2>
    <div 
      className="section-grid"
    >
      {children}
    </div>
  </div>
);

const ActivityItem = ({ activity }) => (
  <div className="activity-item">
    <div className="activity-header">
      <span><strong>{activity.role}:</strong> {activity.username}</span>
      <span>{formatDate(activity.timestamp)}</span>
    </div>
    <div>
      {activity.action} - {activity.details}
    </div>
    <div className="activity-meta">
      <span>IP: {activity.ipAddress}</span>
      <span className={`status ${activity.success ? 'success' : 'error'}`}>
        {activity.success ? 'Success' : 'Failed'}
      </span>
    </div>
  </div>
);

const AdminSystemOverviewPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    systemUptime: '',
    activeAlerts: 0,
    systemVersion: '',
    systemHealth: {},
    userStats: {},
    fleetOverview: {},
    recentActivities: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await settingsService.getSystemOverview();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-state">Loading system overview...</div>;
  }

  if (error) {
    return <div className="error-state">{error}</div>;
  }

  const { 
    systemUptime, 
    activeAlerts, 
    systemVersion, 
    systemHealth = {},
    userStats = {},
    fleetOverview = {},
    recentActivities = []
  } = dashboardData;

  return (
    <div className="admin-page-container">
      {/* Header */}
      <div className="admin-page-header">
        <h1>📊 System Overview</h1>
        <p>Monitor system health, performance, and recent activities</p>
      </div>

      <div className="stats-grid">
        <StatCard 
          title="System Uptime" 
          value={systemUptime} 
          highlight={true}
        />
        <StatCard 
          title="Active Alerts" 
          value={activeAlerts}
          highlight={activeAlerts > 0}
        />
        <StatCard 
          title="System Version" 
          value={systemVersion}
        />
      </div>

      <div className="two-column-layout">
        <div>
          <Section title="System Health" columns={2}>
            <StatCard title="CPU Usage" value={systemHealth.cpuUsage || 'N/A'} unit="%" />
            <StatCard title="Memory Usage" value={`${systemHealth.usedMemoryMB || 0} / ${systemHealth.maxMemoryMB || 0}`} unit=" MB" />
            <StatCard title="Free Disk Space" value={systemHealth.freeDiskSpaceGB || 'N/A'} unit=" GB" />
            <StatCard 
              title="Database Status" 
              value={systemHealth.dbStatus || 'N/A'} 
              highlight={systemHealth.dbStatus === 'UP'}
            />
          </Section>
          
          <Section title="Fleet Overview" columns={3}>
            <StatCard title="Active Vehicles" value={fleetOverview.activeVehicles || 0} />
            <StatCard title="Active Deliveries" value={fleetOverview.activeDeliveries || 0} />
            <StatCard 
              title="Pending Deliveries" 
              value={fleetOverview.pendingDeliveries || 0}
              highlight={(fleetOverview.pendingDeliveries || 0) > 0}
            />
          </Section>
        </div>
        
        <Section title="User Statistics" columns={1}>
          <StatCard title="Total Users" value={userStats.totalUsers || 0} />
          <StatCard title="New Signups" value={userStats.newSignups || 0} />
          <StatCard title="Active Dispatchers" value={userStats.activeDispatchers || 0} />
          <StatCard title="Active Drivers" value={userStats.activeDrivers || 0} />
          <StatCard title="Active Managers" value={userStats.activeManagers || 0} />
        </Section>
      </div>

      <Section title="Recent Activities">
        {recentActivities.length > 0 ? (
          recentActivities.map((activity, index) => (
            <ActivityItem key={index} activity={activity} />
          ))
        ) : (
          <div className="empty-state">
            No recent activities found
          </div>
        )}
      </Section>
    </div>
  );
};

export default AdminSystemOverviewPage;
