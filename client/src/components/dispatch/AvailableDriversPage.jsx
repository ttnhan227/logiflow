import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dispatchDriverService } from '../../services';
import './dispatch.css';
import './modern-dispatch.css';

const AvailableDriversPage = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, available, assigned
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const data = await dispatchDriverService.getAllDrivers();
      setDrivers(data || []);
    } catch (err) {
      console.error('Failed to load drivers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const getStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'AVAILABLE': return '#10b981';
      case 'ASSIGNED': return '#3b82f6';
      case 'BUSY': return '#f59e0b';
      case 'OFFLINE': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const filteredDrivers = drivers.filter(d => {
    const matchesFilter = 
      filter === 'all' ||
      (filter === 'available' && d.status?.toUpperCase() === 'AVAILABLE') ||
      (filter === 'assigned' && d.status?.toUpperCase() === 'ASSIGNED');
    
    const matchesSearch = 
      !searchTerm ||
      d.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone?.includes(searchTerm) ||
      d.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="modern-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Available Drivers</h1>
          <p className="page-subtitle">Manage and monitor driver availability</p>
        </div>
        <div className="header-actions">
          <Link to="/dispatch/trips" className="btn-secondary">
            ← Back to Trips
          </Link>
        </div>
      </div>

      <div className="filters-bar">
        <input 
          type="text" 
          placeholder="🔍 Search by name, phone, or email..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="filter-select" 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Drivers</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
        </select>
        <button className="btn-refresh" onClick={fetchDrivers}>↻ Refresh</button>
        <div className="results-count">
          {filteredDrivers.length} driver{filteredDrivers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading drivers...</p>
        </div>
      )}

      {!loading && filteredDrivers.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">👤</div>
          <h3>No drivers found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}

      {!loading && filteredDrivers.length > 0 && (
        <div className="cards-grid">
          {filteredDrivers.map(driver => (
            <div key={driver.driverId} className="driver-card detail-card">
              <div className="card-header">
                <div className="card-id">Driver #{driver.driverId}</div>
                <span 
                  className="badge" 
                  style={{ backgroundColor: getStatusColor(driver.status) }}
                >
                  {driver.status?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
              
              <div className="card-body">
                <div className="detail-row">
                  <div className="detail-item">
                    <div className="detail-icon">👤</div>
                    <div>
                      <div className="detail-label">Name</div>
                      <div className="detail-value">{driver.fullName || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-item">
                    <div className="detail-icon">📱</div>
                    <div>
                      <div className="detail-label">Phone</div>
                      <div className="detail-value">{driver.phone || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">📧</div>
                    <div>
                      <div className="detail-label">Email</div>
                      <div className="detail-value" style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>
                        {driver.email || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-item">
                    <div className="detail-icon">🎖️</div>
                    <div>
                      <div className="detail-label">License</div>
                      <div className="detail-value">{driver.licenseType || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">🚗</div>
                    <div>
                      <div className="detail-label">Total Trips</div>
                      <div className="detail-value">{driver.totalTrips || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableDriversPage;
