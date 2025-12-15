import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tripService, orderService, dispatchVehicleService, dispatchRouteService } from '../../services';
import RouteMapCard from './RouteMapCard';
import './dispatch.css';
import './modern-dispatch.css';

const TripCreatePage = () => {
  const navigate = useNavigate();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [tripType, setTripType] = useState('delivery');
  const [scheduledDeparture, setScheduledDeparture] = useState('');
  const [scheduledArrival, setScheduledArrival] = useState('');
  const [pendingOrders, setPendingOrders] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [distanceEstimate, setDistanceEstimate] = useState(null);
  const [feeEstimate, setFeeEstimate] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoadingOrders(true);
      try {
        const [ordersRes, vehiclesRes, routesRes] = await Promise.all([
          orderService.getOrders({ status: 'PENDING', page: 0, size: 200 }),
          dispatchVehicleService.getAvailableVehicles(),
          dispatchRouteService.getAllRoutes(),
        ]);
        setPendingOrders(ordersRes?.orders || []);
        setVehicles(vehiclesRes || []);
        setRoutes(routesRes || []);
      } catch (ex) {
        console.error(ex);
        setError(ex?.response?.data?.error || 'Failed to load data');
      } finally {
        setLoadingOrders(false);
      }
    };
    loadData();
  }, []);

  const toggleOrder = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleDistanceChange = (km, fee) => {
    setDistanceEstimate(km);
    setFeeEstimate(fee);
  };

  const formatMoney = (amount) => {
    if (amount == null) return '—';
    try {
      return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
    } catch (e) {
      return `${amount} USD`;
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedVehicle || !selectedRoute || !scheduledDeparture || !scheduledArrival || selectedOrderIds.length === 0) {
      setError('Please fill all fields and select at least one order');
      return;
    }

    const payload = {
      vehicleId: Number(selectedVehicle.vehicleId),
      routeId: Number(selectedRoute.routeId),
      tripType,
      scheduledDeparture: new Date(scheduledDeparture).toISOString(),
      scheduledArrival: new Date(scheduledArrival).toISOString(),
      orderIds: selectedOrderIds,
    };

    setLoading(true);
    try {
      await tripService.createTrip(payload);
      setSuccess('Trip created successfully');
      setTimeout(() => navigate('/dispatch/trips'), 800);
    } catch (ex) {
      console.error(ex);
      setError(ex?.response?.data?.error || ex?.message || 'Failed to create trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Create Trip</h1>
          <p className="page-subtitle">Enter trip details and assign orders</p>
        </div>
        <div className="header-actions">
          <button type="button" onClick={() => navigate('/dispatch/trips')} className="btn-secondary">
            ← Back to Trips
          </button>
        </div>
      </div>

      <form className="detail-card" style={{ padding: '1.5rem' }} onSubmit={onSubmit}>
        <div className="card-body" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div className="form-group">
            <label>Vehicle</label>
            <select value={selectedVehicle ? selectedVehicle.vehicleId : ''} onChange={e => {
              const v = vehicles.find(x => x.vehicleId === Number(e.target.value));
              setSelectedVehicle(v || null);
            }}>
              <option value="">-- Select Vehicle --</option>
              {vehicles.map(v => (
                <option key={v.vehicleId} value={v.vehicleId}>
                  {v.vehicleType} ({v.capacity} kg)
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Route</label>
            <select value={selectedRoute ? selectedRoute.routeId : ''} onChange={e => {
              const r = routes.find(x => x.routeId === Number(e.target.value));
              setSelectedRoute(r || null);
            }}>
              <option value="">-- Select Route --</option>
              {routes.map(r => (
                <option key={r.routeId} value={r.routeId}>
                  {r.routeName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Trip Type</label>
            <select value={tripType} onChange={e => setTripType(e.target.value)}>
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div className="form-group">
            <label>Scheduled Departure</label>
            <input type="datetime-local" value={scheduledDeparture} onChange={e => setScheduledDeparture(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Scheduled Arrival</label>
            <input type="datetime-local" value={scheduledArrival} onChange={e => setScheduledArrival(e.target.value)} />
          </div>
        </div>

        {selectedRoute && <RouteMapCard routeId={selectedRoute.routeId} feePerKm={12} onDistanceChange={handleDistanceChange} />}

        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="info-pill">Estimated Distance: {distanceEstimate != null ? `${distanceEstimate} km` : '—'}</div>
          <div className="info-pill">Estimated Fee: {formatMoney(feeEstimate)}</div>
        </div>

        <div className="detail-card" style={{ marginTop: '1rem', padding: '1rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Select Pending Orders</h3>
          {loadingOrders && <div>Loading pending orders...</div>}
          {!loadingOrders && pendingOrders.length === 0 && (
            <div>No pending orders available.</div>
          )}
          {!loadingOrders && pendingOrders.length > 0 && (
            <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingOrders.map((o) => (
                <label key={o.orderId} className="order-item-compact" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.includes(o.orderId)}
                    onChange={() => toggleOrder(o.orderId)}
                    style={{ marginRight: '0.75rem' }}
                  />
                  <div className="order-info">
                    <div className="order-customer">#{o.orderId} — {o.customerName}</div>
                    <div className="order-route-compact">
                      <span className="pickup-compact">📍 {o.pickupAddress}</span>
                      <span className="arrow">→</span>
                      <span className="delivery-compact">🎯 {o.deliveryAddress}</span>
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.85rem' }}>
                      {o.weightKg ? `⚖️ ${o.weightKg} kg` : ''} {o.packageDetails ? ` • ${o.packageDetails}` : ''}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Trip'}
          </button>
          <button className="btn-secondary" type="button" onClick={() => navigate('/dispatch/trips')}>
            Cancel
          </button>
        </div>

        {error && <div className="error" style={{ marginTop: '1rem' }}>{error}</div>}
        {success && <div className="success" style={{ marginTop: '1rem' }}>{success}</div>}
      </form>
    </div>
  );
};

export default TripCreatePage;
