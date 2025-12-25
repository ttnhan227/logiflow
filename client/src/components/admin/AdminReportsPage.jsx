import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { reportsService } from '../../services';
import './admin.css';

// --- Reusable Sub-Components with CSS Classes ---

const StatCard = ({ title, value, subtext, icon, trend, color, tooltip }) => (
  <div className="stat-card-reports" style={{ borderLeftColor: color }} title={tooltip}>
    <div className="stat-card-content">
      <div className="stat-card-header">
        <div>
          <span className="stat-card-title">{title}</span>
          <h3 className="stat-card-value">{value}</h3>
        </div>
        <div className="stat-card-icon" style={{ backgroundColor: `${color}20` }}>{icon}</div>
      </div>
      <div className="stat-card-subtitle">{subtext}</div>
    </div>
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div className="reports-section-header">
    <h2 className="reports-section-title">{title}</h2>
    {subtitle && <p className="reports-section-subtitle">{subtitle}</p>}
  </div>
);

// --- Main Component ---

const AdminReportsPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const [performanceReport, setPerformanceReport] = useState(null);
  const [costAnalysis, setCostAnalysis] = useState(null);
  const [driverPerformance, setDriverPerformance] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverDetailModal, setShowDriverDetailModal] = useState(false);

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [performance, cost, drivers] = await Promise.all([
        reportsService.getPerformanceReport(dateRange.startDate, dateRange.endDate),
        reportsService.getCostAnalysis(dateRange.startDate, dateRange.endDate),
        reportsService.getDriverPerformance(dateRange.startDate, dateRange.endDate)
      ]);
      setPerformanceReport(performance);
      setCostAnalysis(cost);
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

  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      await reportsService.downloadComprehensiveReport(dateRange.startDate, dateRange.endDate);
    } catch (err) {
      setError('Failed to download comprehensive report: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Calculation Helpers
  const calculateOverallOnTime = () => {
    if (!driverPerformance.length) return 0;
    const weighted = driverPerformance.reduce((acc, d) => acc + (d.onTimeDeliveryRate * d.totalTripsCompleted), 0);
    const total = driverPerformance.reduce((acc, d) => acc + d.totalTripsCompleted, 0);
    return Math.round(weighted / total) || 0;
  };

  if (loading && !performanceReport) {
    return <div className="dashboard-container"><div className="loading-state">Loading analytics...</div></div>;
  }

  return (
    <div className="dashboard-container" style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '24px' }}>

      {/* Header & Controls Section */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#111827', margin: 0 }}>Logistics Analytics Dashboard</h1>
            <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
              Performance & Financial Analysis | <strong style={{color:'#374151'}}>{dateRange.startDate}</strong> to <strong style={{color:'#374151'}}>{dateRange.endDate}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="reports-date-input">
              <input type="date" value={dateRange.startDate} onChange={(e) => handleDateChange('startDate', e.target.value)} />
            </div>
            <span style={{color: '#9ca3af'}}>→</span>
            <div className="reports-date-input">
              <input type="date" value={dateRange.endDate} onChange={(e) => handleDateChange('endDate', e.target.value)} />
            </div>

            {/* PDF Download Button */}
            <button
              onClick={handleDownloadReport}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginLeft: '16px',
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
              }}
            >
              📊 Download Business Intelligence Report
            </button>
          </div>
        </div>
      </div>

          {/* 2. Professional Analytics Overview - Business Intelligence Style */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '32px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>Key Performance Indicators - DIFOT Analysis</h2>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>Logistics Operations Excellence Metrics</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#374151', fontWeight: '500' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                  DIFOT Compliant
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
                  Operational Average
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div>
                  Improvement Needed
                </span>
              </div>
            </div>

            {/* Unified KPIs Table - Performance + Costs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1px', background: '#e5e7eb', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              {/* First Row: Core Performance Metrics */}
              <div style={{ background: 'white', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                  Delivery Volume
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                  {performanceReport?.totalTrips || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                  Success Rate: {performanceReport?.completionRate || 0}%
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Total completed deliveries
                </div>
              </div>

              <div style={{ background: 'white', padding: '24px', textAlign: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', right: '12px', width: '6px', height: '6px', borderRadius: '50%', background: calculateOverallOnTime() >= 75 ? '#10b981' : calculateOverallOnTime() >= 60 ? '#f59e0b' : '#ef4444' }}></div>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                  DIFOT Compliance
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: calculateOverallOnTime() >= 75 ? '#059669' : calculateOverallOnTime() >= 60 ? '#d97706' : '#dc2626', marginBottom: '8px' }}>
                  {calculateOverallOnTime()}%
                </div>
                <div style={{ fontSize: '12px', color: calculateOverallOnTime() >= 75 ? '#10b981' : calculateOverallOnTime() >= 60 ? '#f59e0b' : '#ef4444', fontWeight: '600' }}>
                  On-Time Within 15 Minutes
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Industry standard delivery
                </div>
              </div>

              <div style={{ background: 'white', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                  Fleet Efficiency
                </div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
                  {performanceReport?.totalActiveDrivers || 0}
                </div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                  {performanceReport?.averageTripsPerDriver || 0} trips/driver day
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Active fleet utilization
                </div>
              </div>

              <div style={{ background: 'white', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                  Revenue Impact
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#7c3aed', marginBottom: '8px' }}>
                  {formatCurrency(driverPerformance.reduce((acc, d) => acc + d.totalRevenue, 0))}
                </div>
                <div style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                  {formatCurrency(driverPerformance.reduce((acc, d) => acc + d.averageRevenuePerTrip, 0) / driverPerformance.length)}/trip
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                  Gross revenue performance
                </div>
              </div>

          {/* Second Row: Fleet & Capacity Metrics */}
              <div style={{ background: 'white', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                  Total Fleet Capacity
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>
                  {costAnalysis?.totalVehicles || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  Total vehicles in fleet
                </div>
              </div>

              <div style={{ background: 'white', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                  Avg Trips/Vehicle
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b', marginBottom: '8px' }}>
                  {costAnalysis?.totalVehicles && costAnalysis?.totalTrips
                    ? Math.round((costAnalysis.totalTrips / costAnalysis.totalVehicles) * 10) / 10
                    : 0}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  Utilization efficiency metric
                </div>
              </div>

              <div style={{ background: 'white', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                  Fleet Utilization
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#7c3aed', marginBottom: '8px' }}>
                  {costAnalysis?.vehicleUtilizationRate || 0}%
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  {costAnalysis?.activeVehicles || 0}/{costAnalysis?.totalVehicles || 0} vehicles active
                </div>
              </div>

              <div style={{ background: 'white', padding: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#6b7280', marginBottom: '8px' }}>
                  Active Vehicles
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px' }}>
                  {costAnalysis?.activeVehicles || 0}
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  Currently in operation
                </div>
              </div>
            </div>

            {/* Analytical Insights Row */}
            <div style={{ marginTop: '32px', padding: '24px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📊 Logistics Performance Analysis
                <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '500' }}>- Real-time operational intelligence</span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <div style={{ padding: '16px', background: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '8px' }}>Delivery Reliability</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '18px',
                        fontWeight: '700',
                        color: calculateOverallOnTime() >= 75 ? '#059669' : '#d97706'
                      }}
                    >
                      {calculateOverallOnTime()}%
                    </span>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>DIFOT standard</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                    Within 15-minute arrival windows
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'white', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#4b5563', marginBottom: '8px' }}>Fleet Productivity</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                      {performanceReport?.averageTripsPerDriver || 0}
                    </span>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>trips per driver</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '4px' }}>
                    Daily operational efficiency
                  </div>
                </div>


              </div>
            </div>
          </div>

          {/* 3. Visual Trends Section */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Main Trend Chart */}
            <div className="chart-card" style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              height: '400px',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <SectionHeader title="Volume & Efficiency Trends" subtitle="Daily trip volume vs cancellations" />
              <div style={{ flex: 1, height: '300px', minHeight: '300px', width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <AreaChart data={performanceReport?.dailyStats || []}>
                    <defs>
                      <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" tickFormatter={formatDate} axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="totalTrips" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTrips)" name="Total Trips"/>
                    <Area type="monotone" dataKey="cancelledTrips" stroke="#ef4444" strokeWidth={2} fill="transparent" name="Cancelled" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Secondary Chart: Delivery Times */}
            <div className="chart-card" style={{ background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <SectionHeader title="Delivery Velocity" subtitle="Average minutes per day" />
              <div style={{ height: '300px', minHeight: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceReport?.dailyStats || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="date" tickFormatter={formatDate} hide />
                    <Tooltip cursor={{fill: '#f3f4f6'}} />
                    <Bar dataKey="averageDeliveryTimeMinutes" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Minutes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 4. Driver Leaderboard - Simplified Table */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <SectionHeader title="Driver Performance Leaderboard" subtitle="Click on a row to view driver profile card" />
            
            <div className="admin-table-wrapper">
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px' }}>Driver</th>
                    <th>Status</th>
                    <th>Efficiency</th>
                    <th>Rating</th>
                    <th>Revenue</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {driverPerformance.map((driver) => (
                    <tr 
                      key={driver.driverId} 
                      onClick={() => { setSelectedDriver(driver); setShowDriverDetailModal(true); }}
                      style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                      className="hover:bg-gray-50"
                    >
                      <td style={{ padding: '16px', borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ fontWeight: '600', color: '#111827' }}>{driver.driverName}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{driver.email}</div>
                      </td>
                      <td style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{
                          padding: '4px 8px', borderRadius: '99px', fontSize: '12px', fontWeight: '600',
                          background: driver.status === 'available' ? '#d1fae5' : '#fee2e2',
                          color: driver.status === 'available' ? '#065f46' : '#991b1b'
                        }}>
                          {driver.status}
                        </span>
                      </td>
                      <td style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                           <span style={{ fontSize: '13px' }}>✅ {driver.completionRate}% Success</span>
                           <span style={{ fontSize: '13px', color: '#6b7280' }}>⏰ {driver.onTimeDeliveryRate}% On-time</span>
                        </div>
                      </td>
                      <td style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ color: '#f59e0b', fontWeight: '700' }}>★ {driver.customerRating}</span>
                      </td>
                      <td style={{ borderBottom: '1px solid #f3f4f6', fontWeight: '600', color: '#111827' }}>
                        {formatCurrency(driver.totalRevenue)}
                      </td>
                      <td style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <div style={{ 
                          width: '32px', height: '32px', borderRadius: '50%', 
                          background: driver.performanceScore >= 80 ? '#10b981' : '#f59e0b',
                          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: '700', fontSize: '12px'
                        }}>
                          {driver.performanceScore}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


      {/* 6. Driver Detail Modal - Redesigned as a Profile Card */}
      {showDriverDetailModal && selectedDriver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}
             onClick={() => setShowDriverDetailModal(false)}>
          
          <div style={{ background: 'white', width: '900px', maxWidth: '95vw', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
               onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ background: '#1e293b', padding: '32px', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '64px', height: '64px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                  👤
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '24px' }}>{selectedDriver.driverName}</h2>
                  <div style={{ opacity: 0.8, marginTop: '4px' }}>{selectedDriver.email} • {selectedDriver.phone}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#10b981' }}>{selectedDriver.performanceScore}</div>
                <div style={{ fontSize: '12px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>Overall Score</div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '32px', overflowY: 'auto' }}>
              
              {/* Stats Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>{selectedDriver.totalTripsCompleted}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Completed Trips</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>{selectedDriver.onTimeDeliveryRate}%</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>On-Time Rate</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>{selectedDriver.customerRating} ★</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Avg Rating</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>{formatCurrency(selectedDriver.averageRevenuePerTrip)}</div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Rev / Trip</div>
                </div>
              </div>

              {/* Recommendations & Badges Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div>
                  <h4 style={{ margin: '0 0 16px 0', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>🤖 AI Recommendations</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedDriver.improvementRecommendations?.length > 0 ? selectedDriver.improvementRecommendations.map((rec, i) => (
                      <div key={i} style={{ padding: '12px', background: '#eff6ff', borderLeft: '4px solid #3b82f6', borderRadius: '4px', fontSize: '14px', color: '#1e40af' }}>
                        {rec}
                      </div>
                    )) : <div style={{color:'#9ca3af', fontStyle:'italic'}}>No recommendations active.</div>}
                  </div>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 16px 0', borderBottom: '2px solid #e5e7eb', paddingBottom: '8px' }}>🏆 Achievements</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedDriver.efficiencyBadges?.map((badge, i) => (
                      <span key={i} style={{ padding: '6px 12px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '20px', fontSize: '13px', fontWeight: '600' }}>
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
