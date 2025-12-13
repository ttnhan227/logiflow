import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { tripService } from '../../services';
import RouteMapCard from './RouteMapCard';
import './dispatch.css';
import './modern-dispatch.css';

const formatMoney = (amount) => {
  if (amount == null) return 'N/A';
  try {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  } catch (e) {
    return `${amount} USD`;
  }
};

const TripDetailPage = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [distanceEstimate, setDistanceEstimate] = useState(null);
  const [feeEstimate, setFeeEstimate] = useState(null);

  useEffect(() => {
    loadTrip();
  }, [tripId, location.state]);

  // Reload trip when returning from assign page
  useEffect(() => {
    const handleFocus = () => {
      loadTrip();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadTrip = async () => {
    setLoading(true);
    setError(null);
    try {
      const tripsResp = await tripService.getTrips();
      const t = (tripsResp.trips || []).find(x => Number(x.tripId) === Number(tripId));
      if (!t) {
        setError('Trip not found');
        return;
      }
      setTrip(t);
    } catch (ex) {
      console.error('Failed to load trip', ex);
      setError('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return '#f59e0b';
      case 'SCHEDULED': return '#06b6d4';
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

  if (loading) {
    return (
      <div className="modern-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="modern-container">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h3>{error || 'Trip not found'}</h3>
          <Link to="/dispatch/trips" className="btn-primary">Back to Trips</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trip #{trip.tripId}</h1>
          <p className="page-subtitle">{trip.routeName}</p>
        </div>
        <div className="header-actions">
          {!trip.driverName && trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
            <Link 
              to={`/dispatch/trips/${trip.tripId}/assign`} 
              className="btn-primary"
            >
              👥 Assign Driver
            </Link>
          )}
          <Link to="/dispatch/trips" className="btn-secondary">
            ← Back to Trips
          </Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card main-card">
          <div className="card-header">
            <h2 className="card-title">Trip Information</h2>
            <span 
              className="badge" 
              style={{ backgroundColor: getStatusColor(trip.status) }}
            >
              {trip.status}
            </span>
          </div>
          
          <div className="card-body">
            <div className="detail-section">
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-icon">🗺️</div>
                  <div>
                    <div className="detail-label">Route Name</div>
                    <div className="detail-value">{trip.routeName}</div>
                  </div>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-icon">📅</div>
                  <div>
                    <div className="detail-label">Scheduled Departure</div>
                    <div className="detail-value">{formatDateTime(trip.scheduledDeparture)}</div>
                  </div>
                </div>

                {trip.actualDeparture && (
                  <div className="detail-item">
                    <div className="detail-icon">🕐</div>
                    <div>
                      <div className="detail-label">Actual Departure</div>
                      <div className="detail-value">{formatDateTime(trip.actualDeparture)}</div>
                    </div>
                  </div>
                )}
              </div>

              {trip.actualArrival && (
                <div className="detail-row">
                  <div className="detail-item">
                    <div className="detail-icon">✓</div>
                    <div>
                      <div className="detail-label">Actual Arrival</div>
                      <div className="detail-value">{formatDateTime(trip.actualArrival)}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-icon">📏</div>
                  <div>
                    <div className="detail-label">Estimated Distance</div>
                    <div className="detail-value">{distanceEstimate != null ? `${distanceEstimate} km` : 'N/A'}</div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">💵</div>
                  <div>
                    <div className="detail-label">Estimated Fee</div>
                    <div className="detail-value">{feeEstimate != null ? formatMoney(feeEstimate) : 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <div className="card-header">
            <h2 className="card-title">Assignment</h2>
          </div>
          
          <div className="card-body">
            <div className="assignment-section">
              <div className="assignment-item">
                <div className="assignment-icon driver-icon">👤</div>
                <div>
                  <div className="detail-label">Driver</div>
                  <div className="detail-value">
                    {trip.driverName || (
                      <span className="not-assigned">Not assigned</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="assignment-item">
                <div className="assignment-icon vehicle-icon">🚗</div>
                <div>
                  <div className="detail-label">Vehicle</div>
                  <div className="detail-value">
                    {trip.vehicleLicensePlate || (
                      <span className="not-assigned">Not assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {!trip.driverName && trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
                <Link 
                  to={`/dispatch/trips/${trip.tripId}/assign`} 
                  className="btn-action primary"
                  style={{ marginTop: '1rem', width: '100%' }}
                >
                  👥 Assign Driver & Vehicle
                </Link>
              )}
            </div>
          </div>
        </div>

        {trip.routeId && (
          <RouteMapCard 
            routeId={trip.routeId} 
            feePerKm={12} 
            onDistanceChange={(km, fee) => { setDistanceEstimate(km); setFeeEstimate(fee); }}
          />
        )}

        {trip.orders && trip.orders.length > 0 && (
          <div className="detail-card full-width">
            <div className="card-header">
              <h2 className="card-title">Orders ({trip.orders.length})</h2>
            </div>
            
            <div className="card-body">
              <div className="orders-list">
                {trip.orders.map((order, idx) => (
                  <div key={idx} className="order-item-compact">
                    <div className="order-number">#{order.orderId || idx + 1}</div>
                    <div className="order-info">
                      <div className="order-customer">{order.customerName}</div>
                      <div className="order-route-compact">
                        <span className="pickup-compact">📍 {order.pickupAddress}</span>
                        <span className="arrow">→</span>
                        <span className="delivery-compact">🎯 {order.deliveryAddress}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripDetailPage;
