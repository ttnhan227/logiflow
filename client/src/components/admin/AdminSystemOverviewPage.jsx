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

// Recent activity component removed as activity feed moved to Dashboard

const AdminSystemOverviewPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    systemUptime: '',
    activeAlerts: 0,
    systemVersion: '',
    systemHealth: {},
    // Sections moved to Admin Dashboard: userStats, fleetOverview, recentActivities
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
    systemHealth = {}
  } = dashboardData;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>📊 System Overview</h1>
        <p>Monitor core system health and runtime status</p>
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
    </div>
  );
};

export default AdminSystemOverviewPage;
