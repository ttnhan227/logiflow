import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tripService } from '../../services';
import Pagination from '../common/Pagination';
import './dispatch.css';
import './modern-dispatch.css';

const TripsPage = () => {
  const [tripsResp, setTripsResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [error, setError] = useState(null);

  const fetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await tripService.getTrips({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        page,
        size,
      });
      setTripsResp(data);
    } catch (err) {
      console.error('Failed to load trips', err);
      setError(err.response?.data?.message || 'Failed to load trips. You may not have permission to access this resource.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchTerm, page, size]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'SCHEDULED': return '#f59e0b';
      case 'ASSIGNED': return '#3b82f6';
      case 'IN_PROGRESS': return '#8b5cf6';
      case 'DELAYED': return '#f97316';
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
    t.tripId?.toString().includes(searchTerm) ||
    String(t.tripId).includes(searchTerm)
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
          <option value="SCHEDULED">Scheduled</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DELAYED">Delayed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button className="btn-refresh" onClick={fetch}>↻ Refresh</button>
        <div className="results-count">
          {typeof tripsResp?.totalItems === 'number'
            ? `${tripsResp.totalItems} trip${tripsResp.totalItems !== 1 ? 's' : ''}`
            : `${filteredTrips.length} trip${filteredTrips.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading trips...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <div className="error-icon">❌</div>
          <h3>Access Denied</h3>
          <p>{error}</p>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '1rem' }}>
            You need DISPATCHER role to access this resource. Please contact your administrator.
          </p>
          <Link to="/dispatch/orders" className="btn-primary">Back to Orders</Link>
        </div>
      )}

      {!loading && !error && (tripsResp?.trips?.length ?? filteredTrips.length) === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🚚</div>
          <h3>No trips found</h3>
          <p>Create your first trip or adjust your filters</p>
          <Link to="/dispatch/trips/create" className="btn-primary">Create Trip</Link>
        </div>
      )}

      {!loading && !error && filteredTrips.length > 0 && (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Route</th>
                  <th>Orders</th>
                  <th>Total Weight</th>
                  <th>Total Distance</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Scheduled Departure</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.map(trip => {
                  const orderCount = trip.orders?.length || 0;
                  const totalWeight = trip.orders?.reduce((sum, order) => sum + (order.weightTons || 0), 0) || 0;
                  // Use route distance if available, otherwise sum individual order distances
                  const totalDistance = trip.route?.distanceKm ||
                    (trip.orders?.reduce((sum, order) => sum + (order.distanceKm || 0), 0) || 0);

                  return (
                    <tr key={trip.tripId} className="table-row">
                      <td className="cell-id">#{trip.tripId}</td>
                      <td className="cell-text">{trip.routeName}</td>
                      <td className="cell-text">
                        <span style={{
                          backgroundColor: '#e0f2fe',
                          color: '#0c4a6e',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.25rem',
                          fontWeight: '600',
                          fontSize: '12px'
                        }}>
                          {orderCount} order{orderCount !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td className="cell-text">{totalWeight > 0 ? `${totalWeight.toFixed(1)} t` : '-'}</td>
                      <td className="cell-text">{totalDistance > 0 ? `${totalDistance.toFixed(1)} km` : '-'}</td>
                      <td className="cell-text">{trip.vehicleLicensePlate || 'Not assigned'}</td>
                      <td className="cell-text">{trip.driverName || 'Not assigned'}</td>
                      <td className="cell-datetime">{formatDateTime(trip.scheduledDeparture)}</td>
                      <td className="cell-status">
                        <span
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(trip.status) }}
                        >
                          {trip.status}
                        </span>
                      </td>
                      <td className="cell-action">
                        <Link
                          to={`/dispatch/trips/${trip.tripId}`}
                          className="btn-view"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={tripsResp?.currentPage ?? page}
            totalPages={tripsResp?.totalPages ?? 0}
            totalItems={tripsResp?.totalItems}
            pageSize={tripsResp?.pageSize ?? size}
            disabled={loading}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
    </div>
  );
};

export default TripsPage;
