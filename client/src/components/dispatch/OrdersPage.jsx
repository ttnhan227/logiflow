import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services';
import Pagination from '../common/Pagination';
import './dispatch.css';
import './modern-dispatch.css';

const OrdersPage = () => {
  const [ordersResp, setOrdersResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [pickupTypeFilter, setPickupTypeFilter] = useState(''); // '', 'PORT_TERMINAL', 'WAREHOUSE'
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const fetch = async () => {
    setLoading(true);
    try {
      const data = await orderService.getOrders({
        status: statusFilter || undefined,
        page,
        size,
      });
      setOrdersResp(data);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // reset page when filter changes
    setPage(0);
  }, [statusFilter, pickupTypeFilter]);

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page, size]);

  useEffect(() => {
    // reset page when searching
    setPage(0);
  }, [searchTerm]);

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

  const filteredOrders = (ordersResp?.orders || [])
    .filter(o => 
      !searchTerm || 
      o.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerPhone?.includes(searchTerm) ||
      o.orderId?.toString().includes(searchTerm)
    )
    .filter(o => !pickupTypeFilter || o.pickupType === pickupTypeFilter)
    // Backend now handles sorting: pending orders first, then newest first
    // Client-side sorting kept as fallback for search/filtering
    .sort((a, b) => {
      const aPending = a.orderStatus === 'PENDING' ? 1 : 0;
      const bPending = b.orderStatus === 'PENDING' ? 1 : 0;
      if (aPending !== bPending) return bPending - aPending;

      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

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
        <select 
          className="filter-select" 
          value={pickupTypeFilter}
          onChange={(e) => setPickupTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="PORT_TERMINAL">PORT_TERMINAL</option>
          <option value="WAREHOUSE">WAREHOUSE</option>
        </select>
        <button className="btn-refresh" onClick={fetch}>↻ Refresh</button>
        <div className="results-count">
          {typeof ordersResp?.totalItems === 'number'
            ? `${ordersResp.totalItems} order${ordersResp.totalItems !== 1 ? 's' : ''}`
            : `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`}
        </div>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      )}

      {!loading && (ordersResp?.orders?.length ?? filteredOrders.length) === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No orders found</h3>
          <p>Import orders or adjust your filters</p>
        </div>
      )}

      {!loading && filteredOrders.length > 0 && (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Pickup</th>
                  <th>Delivery</th>
                  <th>Pickup Type</th>
                  <th>Weight</th>
                  <th>Distance</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.orderId} className="table-row">
                    <td className="cell-id">#{order.orderId}</td>
                    <td className="cell-text">{order.customerName}</td>
                    <td className="cell-text">{order.customerPhone}</td>
                    <td className="cell-text cell-address">{order.pickupAddress}</td>
                    <td className="cell-text cell-address">{order.deliveryAddress}</td>
                    <td className="cell-text">
                      {order.pickupType ? (
                        <span
                          className="status-badge"
                          style={{
                            backgroundColor:
                              order.pickupType === 'PORT_TERMINAL' ? '#fef3c7' :
                              order.pickupType === 'WAREHOUSE' ? '#dbeafe' :
                              order.pickupType === 'STANDARD' ? '#f0fdf4' : '#f9fafb',
                            color:
                              order.pickupType === 'PORT_TERMINAL' ? '#92400e' :
                              order.pickupType === 'WAREHOUSE' ? '#0c4a6e' :
                              order.pickupType === 'STANDARD' ? '#166534' : '#6b7280'
                          }}
                        >
                          {order.pickupType}
                        </span>
                      ) : '—'}
                      {order.pickupType === 'PORT_TERMINAL' && order.containerNumber && (
                        <span style={{ marginLeft: 6, fontSize: 12, color: '#334155' }}>🧾 {order.containerNumber}</span>
                      )}
                      {order.pickupType === 'WAREHOUSE' && order.dockInfo && (
                        <span style={{ marginLeft: 6, fontSize: 12, color: '#334155' }}>🏭 {order.dockInfo}</span>
                      )}
                    </td>
                    <td className="cell-text">
                      {order.weightTons ? `${order.weightTons} t` : '—'}
                    </td>
                    <td className="cell-text">
                      {order.distanceKm ? `${order.distanceKm} km` : '—'}
                    </td>
                    <td className="cell-price">
                      {order.shippingFee ? `${order.shippingFee.toLocaleString()} VND` : 'TBD'}
                    </td>
                    <td className="cell-status">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="cell-priority">
                      {order.priorityLevel === 'URGENT' ? (
                        <span
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(order.priorityLevel) }}
                        >
                          ⚡ URGENT
                        </span>
                      ) : (
                        <span className="priority-normal">Normal</span>
                      )}
                    </td>
                    <td className="cell-action">
                      <Link to={`/dispatch/orders/${order.orderId}`} className="btn-view">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={ordersResp?.currentPage ?? page}
            totalPages={ordersResp?.totalPages ?? 0}
            totalItems={ordersResp?.totalItems}
            pageSize={ordersResp?.pageSize ?? size}
            disabled={loading}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
    </div>
  );
};

export default OrdersPage;
