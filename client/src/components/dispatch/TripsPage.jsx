import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tripService } from '../../services';
import './dispatch.css';
import './modern-dispatch.css';

const TripsPage = () => {
  const [tripsResp, setTripsResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await tripService.getTrips({ status: statusFilter || undefined });
      setTripsResp(data);
    } catch (err) {
      console.error('Failed to load trips', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return '#f59e0b';
      case 'ASSIGNED': return '#3b82f6';
      case 'IN_PROGRESS': return '#8b5cf6';
      case 'COMPLETED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredTrips = tripsResp?.trips?.filter(t => 
    !searchTerm || 
    t.routeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.vehicleLicensePlate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.tripId?.toString().includes(searchTerm)
  ) || [];

  return (
    <div className="modern-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trips Management</h1>
          <p className="page-subtitle">Schedule and manage delivery trips</p>
        </div>
        <div className="header-actions">
          <Link to="/dispatch/trips/create" className="btn-primary">
            <span>+</span> Create Trip
          </Link>
        </div>
      </div>

      <div className="filters-bar">
        <input 
          type="text" 
          placeholder="🔍 Search by route, vehicle, or trip ID..." 
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="filter-select" 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button className="btn-refresh" onClick={fetch}>↻ Refresh</button>
        <div className="results-count">
          {filteredTrips.length} trip{filteredTrips.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading trips...</p>
        </div>
      )}

      {!loading && filteredTrips.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🚚</div>
          <h3>No trips found</h3>
          <p>Create your first trip or adjust your filters</p>
          <Link to="/dispatch/trips/create" className="btn-primary">Create Trip</Link>
        </div>
      )}

      {!loading && filteredTrips.length > 0 && (
        <div className="cards-grid">
          {filteredTrips.map(trip => (
            <div key={trip.tripId} className="trip-card">
              <div className="card-header">
                <div className="card-id">Trip #{trip.tripId}</div>
                <span 
                  className="badge" 
                  style={{ backgroundColor: getStatusColor(trip.status) }}
                >
                  {trip.status}
                </span>
              </div>
              
              <div className="card-body">
                <div className="trip-route">
                  <div className="route-icon-large">🗺️</div>
                  <div className="route-details">
                    <div className="section-label">Route</div>
                    <div className="section-value route-name">{trip.routeName}</div>
                  </div>
                </div>

                <div className="trip-info-grid">
                  <div className="info-item">
                    <div className="info-icon">🚗</div>
                    <div>
                      <div className="section-label">Vehicle</div>
                      <div className="section-value">
                        {trip.vehicleLicensePlate || 'Not assigned'}
                      </div>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">👤</div>
                    <div>
                      <div className="section-label">Driver</div>
                      <div className="section-value">
                        {trip.driverName || 'Not assigned'}
                      </div>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">📅</div>
                    <div>
                      <div className="section-label">Scheduled Departure</div>
                      <div className="section-value">
                        {formatDateTime(trip.scheduledDeparture)}
                      </div>
                    </div>
                  </div>

                  {trip.actualDeparture && (
                    <div className="info-item">
                      <div className="info-icon">🕐</div>
                      <div>
                        <div className="section-label">Actual Departure</div>
                        <div className="section-value">
                          {formatDateTime(trip.actualDeparture)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  {trip.status === 'PENDING' && (
                    <Link 
                      to={`/dispatch/trips/${trip.tripId}/assign`} 
                      className="btn-action primary"
                    >
                      👥 Assign Driver
                    </Link>
                  )}
                  {trip.status === 'ASSIGNED' && (
                    <button className="btn-action success">
                      ✓ Ready to Start
                    </button>
                  )}
                  {trip.status === 'IN_PROGRESS' && (
                    <button className="btn-action info">
                      🚚 In Progress
                    </button>
                  )}
                  <Link 
                    to={`/dispatch/trips/${trip.tripId}`} 
                    className="btn-action secondary"
                  >
                    📋 View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripsPage;
