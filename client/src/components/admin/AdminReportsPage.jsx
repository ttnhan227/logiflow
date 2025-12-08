import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { reportsService } from '../../services';
import './admin.css';

const AdminReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('performance');
  
  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  
  // Report data states
  const [performanceReport, setPerformanceReport] = useState(null);
  const [costAnalysis, setCostAnalysis] = useState(null);
  const [complianceReport, setComplianceReport] = useState(null);
  const [driverPerformance, setDriverPerformance] = useState([]);

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [performance, cost, compliance, drivers] = await Promise.all([
        reportsService.getPerformanceReport(dateRange.startDate, dateRange.endDate),
        reportsService.getCostAnalysis(dateRange.startDate, dateRange.endDate),
        reportsService.getComplianceReport(dateRange.startDate, dateRange.endDate),
        reportsService.getDriverPerformance(dateRange.startDate, dateRange.endDate)
      ]);
      
      setPerformanceReport(performance);
      setCostAnalysis(cost);
      setComplianceReport(compliance);
      setDriverPerformance(drivers);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';
    
    switch (activeTab) {
      case 'performance':
        if (!performanceReport) return;
        csvContent = 'Date,Total Trips,Completed,Cancelled,Revenue\n';
        performanceReport.dailyStats.forEach(stat => {
          csvContent += `${stat.date},${stat.totalTrips},${stat.completedTrips},${stat.cancelledTrips},${stat.revenue}\n`;
        });
        filename = 'performance_report.csv';
        break;
      case 'drivers':
        if (!driverPerformance.length) return;
        csvContent = 'Driver Name,Email,Completed Trips,Cancelled,Completion Rate,Avg Time (min),Revenue\n';
        driverPerformance.forEach(driver => {
          csvContent += `${driver.driverName},${driver.email},${driver.totalTripsCompleted},${driver.totalTripsCancelled},${driver.completionRate}%,${driver.averageDeliveryTimeMinutes},${driver.totalRevenue}\n`;
        });
        filename = 'driver_performance.csv';
        break;
      case 'cost':
        if (!costAnalysis) return;
        csvContent = 'Vehicle Type,Total Vehicles,Active,Trips Completed,Utilization\n';
        costAnalysis.vehicleTypeCosts.forEach(vType => {
          csvContent += `${vType.vehicleType},${vType.totalVehicles},${vType.activeVehicles},${vType.tripsCompleted},${vType.utilizationRate}%\n`;
        });
        filename = 'cost_analysis.csv';
        break;
      case 'compliance':
        if (!complianceReport) return;
        csvContent = 'Metric,Value\n';
        csvContent += `Total Drivers,${complianceReport.totalDrivers}\n`;
        csvContent += `Valid License,${complianceReport.driversWithValidLicense}\n`;
        csvContent += `Expired License,${complianceReport.driversWithExpiredLicense}\n`;
        csvContent += `Expiring Soon,${complianceReport.driversWithExpiringSoonLicense}\n`;
        csvContent += `Total Vehicles,${complianceReport.totalVehicles}\n`;
        csvContent += `Active Vehicles,${complianceReport.vehiclesActive}\n`;
        csvContent += `Inactive Vehicles,${complianceReport.vehiclesInactive}\n`;
        filename = 'compliance_report.csv';
        break;
      default:
        return;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !performanceReport) {
    return (
      <div className="dashboard-container">
        <h1 className="dashboard-header">📊 Reports & Analytics</h1>
        <div className="loading-state">
          <span className="loading-spinner"></span> Loading report data...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ margin: 0 }}>📊 Reports & Analytics</h1>
          <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
            Historical analysis and performance insights
          </p>
        </div>
        <button 
          onClick={exportToCSV}
          className="btn-primary"
          style={{ padding: '10px 20px', fontSize: '14px' }}
        >
          📥 Export to CSV
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="dashboard-section" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
              max={dateRange.endDate}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
              End Date
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
              min={dateRange.startDate}
              max={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', opacity: 0 }}>
              Quick Select
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setDateRange({
                  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })}
                className="btn-secondary"
                style={{ padding: '10px 16px', fontSize: '13px' }}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDateRange({
                  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })}
                className="btn-secondary"
                style={{ padding: '10px 16px', fontSize: '13px' }}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setDateRange({
                  startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  endDate: new Date().toISOString().split('T')[0]
                })}
                className="btn-secondary"
                style={{ padding: '10px 16px', fontSize: '13px' }}
              >
                Last 90 Days
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Tabs */}
      <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['performance', 'drivers', 'cost', 'compliance'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: activeTab === tab ? '#fff' : 'transparent',
                borderBottom: activeTab === tab ? '3px solid #3b82f6' : '3px solid transparent',
                color: activeTab === tab ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
            >
              {tab === 'performance' && '📈 Performance'}
              {tab === 'drivers' && '👥 Driver Rankings'}
              {tab === 'cost' && '💰 Cost Analysis'}
              {tab === 'compliance' && '✅ Compliance'}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Tab */}
      {activeTab === 'performance' && performanceReport && (
        <>
          {/* Summary Cards */}
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card highlight">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📦</div>
              <div className="stat-title">Total Trips</div>
              <div className="stat-value">{performanceReport.totalTrips}</div>
              <div className="stat-subtitle">
                {performanceReport.completionRate}% completion rate
              </div>
            </div>
            <div className="stat-card success">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
              <div className="stat-title">Completed</div>
              <div className="stat-value">{performanceReport.completedTrips}</div>
              <div className="stat-subtitle">
                Avg {performanceReport.averageDeliveryTimeMinutes} min
              </div>
            </div>
            <div className="stat-card warning">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💰</div>
              <div className="stat-title">Total Revenue</div>
              <div className="stat-value" style={{ fontSize: '20px' }}>
                {formatCurrency(performanceReport.totalRevenue)}
              </div>
              <div className="stat-subtitle">
                {formatCurrency(performanceReport.averageRevenuePerTrip)} avg/trip
              </div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>👨‍✈️</div>
              <div className="stat-title">Active Drivers</div>
              <div className="stat-value">{performanceReport.totalActiveDrivers}</div>
              <div className="stat-subtitle">
                {performanceReport.averageTripsPerDriver} trips/driver
              </div>
            </div>
          </div>

          {/* Daily Trends Chart */}
          <div className="dashboard-section">
            <h2 className="section-title">📈 Daily Trip Trends</h2>
            <div className="chart-card">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceReport.dailyStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    labelFormatter={formatDate}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="totalTrips" name="Total Trips" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="completedTrips" name="Completed" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="cancelledTrips" name="Cancelled" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="dashboard-section">
            <h2 className="section-title">💰 Daily Revenue Trend</h2>
            <div className="chart-card">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={performanceReport.dailyStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    labelFormatter={formatDate}
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Driver Performance Tab */}
      {activeTab === 'drivers' && (
        <div className="dashboard-section">
          <h2 className="section-title">🏆 Driver Performance Rankings</h2>
          {driverPerformance.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No Driver Data</div>
              <div className="empty-state-description">Driver performance data will appear here.</div>
            </div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Driver Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Completed</th>
                    <th>Cancelled</th>
                    <th>Completion Rate</th>
                    <th>Avg Time (min)</th>
                    <th>Revenue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {driverPerformance.map((driver, index) => (
                    <tr key={driver.driverId}>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '16px',
                          color: index === 0 ? '#f59e0b' : index === 1 ? '#9ca3af' : index === 2 ? '#cd7f32' : '#6b7280'
                        }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{driver.driverName}</td>
                      <td>{driver.email}</td>
                      <td>{driver.phone}</td>
                      <td>{driver.totalTripsCompleted}</td>
                      <td>{driver.totalTripsCancelled}</td>
                      <td>
                        <span style={{
                          color: driver.completionRate >= 90 ? '#10b981' : driver.completionRate >= 70 ? '#f59e0b' : '#ef4444',
                          fontWeight: 600
                        }}>
                          {driver.completionRate}%
                        </span>
                      </td>
                      <td>{driver.averageDeliveryTimeMinutes}</td>
                      <td style={{ fontWeight: 600, color: '#10b981' }}>
                        {formatCurrency(driver.totalRevenue)}
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: driver.status === 'available' ? '#d1fae5' : '#fee2e2',
                          color: driver.status === 'available' ? '#065f46' : '#991b1b'
                        }}>
                          {driver.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Cost Analysis Tab */}
      {activeTab === 'cost' && costAnalysis && (
        <>
          {/* Summary Cards */}
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card highlight">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>💰</div>
              <div className="stat-title">Total Revenue</div>
              <div className="stat-value" style={{ fontSize: '22px' }}>
                {formatCurrency(costAnalysis.totalRevenue)}
              </div>
              <div className="stat-subtitle">{costAnalysis.totalTrips} trips</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
              <div className="stat-title">Avg Cost/Trip</div>
              <div className="stat-value" style={{ fontSize: '22px' }}>
                {formatCurrency(costAnalysis.averageCostPerTrip)}
              </div>
              <div className="stat-subtitle">Per delivery</div>
            </div>
            <div className="stat-card success">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚗</div>
              <div className="stat-title">Vehicle Utilization</div>
              <div className="stat-value">{costAnalysis.vehicleUtilizationRate}%</div>
              <div className="stat-subtitle">
                {costAnalysis.activeVehicles}/{costAnalysis.totalVehicles} active
              </div>
            </div>
            <div className="stat-card warning">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🎯</div>
              <div className="stat-title">Efficiency Score</div>
              <div className="stat-value">
                {Math.round((costAnalysis.vehicleUtilizationRate + (costAnalysis.totalTrips > 0 ? 50 : 0)) / 1.5)}
              </div>
              <div className="stat-subtitle">Overall performance</div>
            </div>
          </div>

          {/* Vehicle Type Breakdown */}
          <div className="dashboard-section">
            <h2 className="section-title">🚗 Vehicle Type Analysis</h2>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Vehicle Type</th>
                    <th>Total Vehicles</th>
                    <th>Active</th>
                    <th>Trips Completed</th>
                    <th>Utilization Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {costAnalysis.vehicleTypeCosts.map((vType) => (
                    <tr key={vType.vehicleType}>
                      <td style={{ fontWeight: 600 }}>{vType.vehicleType}</td>
                      <td>{vType.totalVehicles}</td>
                      <td>{vType.activeVehicles}</td>
                      <td>{vType.tripsCompleted}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            flex: 1,
                            height: '8px',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${vType.utilizationRate}%`,
                              height: '100%',
                              backgroundColor: vType.utilizationRate >= 70 ? '#10b981' : vType.utilizationRate >= 40 ? '#f59e0b' : '#ef4444',
                              transition: 'width 0.3s'
                            }} />
                          </div>
                          <span style={{ fontWeight: 600, minWidth: '45px' }}>
                            {vType.utilizationRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && complianceReport && (
        <>
          {/* Summary Cards */}
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card highlight">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
              <div className="stat-title">Overall Compliance</div>
              <div className="stat-value" style={{ 
                color: complianceReport.overallComplianceRate >= 90 ? '#10b981' : complianceReport.overallComplianceRate >= 70 ? '#f59e0b' : '#ef4444'
              }}>
                {complianceReport.overallComplianceRate}%
              </div>
              <div className="stat-subtitle">System-wide rate</div>
            </div>
            <div className="stat-card success">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>✔️</div>
              <div className="stat-title">Valid Licenses</div>
              <div className="stat-value">{complianceReport.driversWithValidLicense}</div>
              <div className="stat-subtitle">of {complianceReport.totalDrivers} drivers</div>
            </div>
            <div className="stat-card warning">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚠️</div>
              <div className="stat-title">Expiring Soon</div>
              <div className="stat-value">{complianceReport.driversWithExpiringSoonLicense}</div>
              <div className="stat-subtitle">Within 30 days</div>
            </div>
            <div className="stat-card danger">
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>❌</div>
              <div className="stat-title">Expired Licenses</div>
              <div className="stat-value">{complianceReport.driversWithExpiredLicense}</div>
              <div className="stat-subtitle">Requires attention</div>
            </div>
          </div>

          {/* License Compliance Chart */}
          <div className="dashboard-section">
            <h2 className="section-title">📊 License Compliance Status</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div className="chart-card">
                <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>Driver License Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Valid', value: complianceReport.driversWithValidLicense, color: '#10b981' },
                        { name: 'Expiring Soon', value: complianceReport.driversWithExpiringSoonLicense, color: '#f59e0b' },
                        { name: 'Expired', value: complianceReport.driversWithExpiredLicense, color: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Valid', value: complianceReport.driversWithValidLicense, color: '#10b981' },
                        { name: 'Expiring Soon', value: complianceReport.driversWithExpiringSoonLicense, color: '#f59e0b' },
                        { name: 'Expired', value: complianceReport.driversWithExpiredLicense, color: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="chart-card">
                <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 600 }}>Vehicle Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: complianceReport.vehiclesActive, color: '#10b981' },
                        { name: 'Inactive', value: complianceReport.vehiclesInactive, color: '#9ca3af' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Active', value: complianceReport.vehiclesActive, color: '#10b981' },
                        { name: 'Inactive', value: complianceReport.vehiclesInactive, color: '#9ca3af' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Compliance Alerts */}
          {complianceReport.driversWithExpiredLicense > 0 && (
            <div className="dashboard-section">
              <div style={{
                padding: '16px 20px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: '4px' }}>
                    Compliance Alert
                  </div>
                  <div style={{ fontSize: '14px', color: '#7f1d1d' }}>
                    {complianceReport.driversWithExpiredLicense} driver(s) have expired licenses. 
                    Please take immediate action to maintain compliance.
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminReportsPage;
