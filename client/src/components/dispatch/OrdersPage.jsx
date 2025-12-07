import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services';
import './dispatch.css';
import './modern-dispatch.css';

const OrdersPage = () => {
  const [ordersResp, setOrdersResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders({ status: statusFilter || undefined });
      setOrdersResp(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return '#f59e0b';
      case 'ASSIGNED': return '#3b82f6';
      case 'IN_TRANSIT': return '#8b5cf6';
      case 'DELIVERED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    return priority === 'URGENT' ? '#ef4444' : '#6b7280';
  };

  const filteredOrders = ordersResp?.orders?.filter(o => 
    !searchTerm || 
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerPhone?.includes(searchTerm) ||
    o.orderId?.toString().includes(searchTerm)
  ) || [];

  return (
    <div className="modern-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders Management</h1>
          <p className="page-subtitle">Manage and track all delivery orders</p>
        </div>
        <div className="header-actions">
          <Link to="/dispatch/orders/import" className="btn-secondary">
            <span>↑</span> Import
          </Link>
        </div>
      </div>

      <div className="filters-bar">
        <input 
          type="text" 
          placeholder="🔍 Search by customer, phone, or order ID..." 
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
          <option value="IN_TRANSIT">In Transit</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button className="btn-refresh" onClick={fetch}>↻ Refresh</button>
        <div className="results-count">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      )}

      {!loading && filteredOrders.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No orders found</h3>
          <p>Create your first order or adjust your filters</p>
          <Link to="/dispatch/orders/create" className="btn-primary">Create Order</Link>
        </div>
      )}

      {!loading && filteredOrders.length > 0 && (
        <div className="cards-grid">
          {filteredOrders.map(order => (
            <div key={order.orderId} className="order-card">
              <div className="card-header">
                <div className="card-id">Order #{order.orderId}</div>
                <div className="card-badges">
                  <span 
                    className="badge" 
                    style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                  >
                    {order.orderStatus}
                  </span>
                  {order.priorityLevel === 'URGENT' && (
                    <span 
                      className="badge badge-priority" 
                      style={{ backgroundColor: getPriorityColor(order.priorityLevel) }}
                    >
                      ⚡ URGENT
                    </span>
                  )}
                </div>
              </div>
              
              <div className="card-body">
                <div className="card-section">
                  <div className="section-label">Customer</div>
                  <div className="section-value">
                    <strong>{order.customerName}</strong>
                    <span className="phone">{order.customerPhone}</span>
                  </div>
                </div>

                <div className="card-section route-section">
                  <div className="route-point">
                    <div className="route-icon pickup">📍</div>
                    <div>
                      <div className="section-label">Pickup</div>
                      <div className="section-value">{order.pickupAddress}</div>
                    </div>
                  </div>
                  <div className="route-line"></div>
                  <div className="route-point">
                    <div className="route-icon delivery">🎯</div>
                    <div>
                      <div className="section-label">Delivery</div>
                      <div className="section-value">{order.deliveryAddress}</div>
                    </div>
                  </div>
                </div>

                {order.packageDetails && (
                  <div className="card-section">
                    <div className="section-label">Package</div>
                    <div className="section-value">{order.packageDetails}</div>
                  </div>
                )}

                <div className="card-footer">
                  <div className="footer-info">
                    {order.distanceKm && <span>📏 {order.distanceKm} km</span>}
                    {order.weightKg && <span>⚖️ {order.weightKg} kg</span>}
                  </div>
                  <div className="footer-price">
                    {order.shippingFee 
                      ? `${order.shippingFee.toLocaleString()} VND` 
                      : 'TBD'}
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

export default OrdersPage;
