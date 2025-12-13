import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderService } from '../../services';
import './dispatch.css';
import './modern-dispatch.css';

const DispatchOrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const o = await orderService.getOrderById(Number(orderId));
      setOrder(o);
    } catch (ex) {
      console.error('Failed to load order', ex);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

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
    switch(priority) {
      case 'URGENT': return '#ef4444';
      case 'NORMAL': return '#6b7280';
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

  const handleEdit = () => {
    setEditMode(true);
    setFormData({
      pickupAddress: order.pickupAddress || '',
      deliveryAddress: order.deliveryAddress || '',
      packageDetails: order.packageDetails || '',
      priorityLevel: order.priorityLevel || 'NORMAL',
      distanceKm: order.distanceKm || '',
      weightKg: order.weightKg || '',
      packageValue: order.packageValue || ''
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedOrder = await orderService.updateOrder(Number(orderId), formData);
      setOrder(updatedOrder);
      setEditMode(false);
    } catch (ex) {
      console.error('Failed to update order', ex);
      setError('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="modern-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="modern-container">
        <div className="empty-state">
          <div className="empty-icon">❌</div>
          <h3>{error || 'Order not found'}</h3>
          <Link to="/dispatch/orders" className="btn-primary">Back to Orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="modern-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Order #{order.orderId}</h1>
          <p className="page-subtitle">{order.customerName}</p>
        </div>
        <div className="header-actions">
          {editMode ? (
            <>
              <button
                className="btn-success"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '💾 Saving...' : '💾 Save Changes'}
              </button>
              <button
                className="btn-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                ❌ Cancel
              </button>
            </>
          ) : (
            <>
              {order.orderStatus === 'PENDING' && (
                <button
                  className="btn-primary"
                  onClick={handleEdit}
                >
                  ✏️ Edit Order
                </button>
              )}
              <Link to="/dispatch/orders" className="btn-secondary">
                ← Back to Orders
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-card main-card">
          <div className="card-header">
            <h2 className="card-title">Order Information</h2>
            <div className="card-badges">
              <span
                className="badge"
                style={{ backgroundColor: getStatusColor(order.orderStatus) }}
              >
                {order.orderStatus}
              </span>
              <span
                className="badge badge-priority"
                style={{ backgroundColor: getPriorityColor(order.priorityLevel) }}
              >
                {order.priorityLevel === 'URGENT' ? '⚡ URGENT' : '⏰ NORMAL'}
              </span>
            </div>
          </div>

          <div className="card-body">
          <div className="detail-section">
              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-icon">👤</div>
                  <div>
                    <div className="detail-label">Customer</div>
                    <div className="detail-value">
                      <strong>{order.customerName}</strong>
                      {order.customerPhone && (
                        <div className="detail-subvalue">📞 {order.customerPhone}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">📅</div>
                  <div>
                    <div className="detail-label">Created</div>
                    <div className="detail-value">{formatDateTime(order.createdAt)}</div>
                  </div>
                </div>
              </div>

              <div className="detail-row route-section">
                <div className="route-point">
                  <div className="route-icon pickup">📍</div>
                  <div>
                    <div className="detail-label">Pickup Address</div>
                    <div className="detail-value">
                      {editMode ? (
                        <textarea
                          value={formData.pickupAddress}
                          onChange={(e) => handleInputChange('pickupAddress', e.target.value)}
                          className="edit-textarea"
                          placeholder="Pickup address"
                        />
                      ) : (
                        order.pickupAddress
                      )}
                    </div>
                  </div>
                </div>
                <div className="route-line"></div>
                <div className="route-point">
                  <div className="route-icon delivery">🎯</div>
                  <div>
                    <div className="detail-label">Delivery Address</div>
                    <div className="detail-value">
                      {editMode ? (
                        <textarea
                          value={formData.deliveryAddress}
                          onChange={(e) => handleInputChange('deliveryAddress', e.target.value)}
                          className="edit-textarea"
                          placeholder="Delivery address"
                        />
                      ) : (
                        order.deliveryAddress
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-icon">📦</div>
                  <div>
                    <div className="detail-label">Package Details</div>
                    <div className="detail-value">
                      {editMode ? (
                        <textarea
                          value={formData.packageDetails}
                          onChange={(e) => handleInputChange('packageDetails', e.target.value)}
                          className="edit-textarea"
                          placeholder="Package details"
                        />
                      ) : (
                        order.packageDetails
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-icon">📏</div>
                  <div>
                    <div className="detail-label">Distance</div>
                    <div className="detail-value">
                      {order.distanceKm ? `${order.distanceKm} km` : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">⚖️</div>
                  <div>
                    <div className="detail-label">Weight</div>
                    <div className="detail-value">
                      {order.weightKg ? `${order.weightKg} kg` : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-icon">💰</div>
                  <div>
                    <div className="detail-label">Package Value</div>
                    <div className="detail-value">
                      {order.packageValue ? `${order.packageValue.toLocaleString()} VND` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {editMode && (
                <div className="detail-row">
                  <div className="detail-item">
                    <div className="detail-icon">⚡</div>
                    <div>
                      <div className="detail-label">Priority Level</div>
                      <select
                        value={formData.priorityLevel}
                        onChange={(e) => handleInputChange('priorityLevel', e.target.value)}
                        className="edit-select"
                      >
                        <option value="NORMAL">NORMAL</option>
                        <option value="URGENT">URGENT</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {editMode && (
                <div className="detail-row">
                  <div className="detail-item">
                    <div className="detail-icon">📏</div>
                    <div>
                      <div className="detail-label">Distance (km)</div>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.distanceKm}
                        onChange={(e) => handleInputChange('distanceKm', e.target.value)}
                        className="edit-input-small"
                        placeholder="Distance in km"
                      />
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">⚖️</div>
                    <div>
                      <div className="detail-label">Weight (kg)</div>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.weightKg}
                        onChange={(e) => handleInputChange('weightKg', e.target.value)}
                        className="edit-input-small"
                        placeholder="Weight in kg"
                      />
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-icon">💰</div>
                    <div>
                      <div className="detail-label">Package Value (VND)</div>
                      <input
                        type="number"
                        step="1000"
                        value={formData.packageValue}
                        onChange={(e) => handleInputChange('packageValue', e.target.value)}
                        className="edit-input-small"
                        placeholder="Package value"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="detail-row">
                <div className="detail-item">
                  <div className="detail-icon">💵</div>
                  <div>
                    <div className="detail-label">Shipping Fee</div>
                    <div className="detail-value fee-highlight">
                      {order.deliveryFee ? `${order.deliveryFee.toLocaleString()} VND` : 'Calculating...'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {order.tripId && (
          <div className="detail-card">
            <div className="card-header">
              <h2 className="card-title">Trip Assignment</h2>
            </div>

            <div className="card-body">
              <div className="assignment-section">
                <div className="assignment-item">
                  <div className="assignment-icon">🚐</div>
                  <div>
                    <div className="detail-label">Trip ID</div>
                    <div className="detail-value">
                      <Link to={`/dispatch/trips/${order.tripId}`} className="link-primary">
                        #{order.tripId}
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="assignment-item">
                  <div className="assignment-icon driver-icon">👤</div>
                  <div>
                    <div className="detail-label">Driver</div>
                    <div className="detail-value">
                      {order.driverName || <span className="not-assigned">Not assigned</span>}
                    </div>
                  </div>
                </div>

                <div className="assignment-item">
                  <div className="assignment-icon vehicle-icon">🚗</div>
                  <div>
                    <div className="detail-label">Vehicle</div>
                    <div className="detail-value">
                      {order.vehiclePlate || <span className="not-assigned">Not assigned</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {order.tripId && (
          <div className="detail-card">
            <div className="card-header">
              <h2 className="card-title">Delivery Timeline</h2>
            </div>

            <div className="card-body">
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-marker" data-status={order.estimatedPickupTime ? 'upcoming' : 'pending'}></div>
                  <div className="timeline-content">
                    <div className="timeline-title">Pickup Time</div>
                    <div className="timeline-value">
                      {order.estimatedPickupTime ? formatDateTime(order.estimatedPickupTime) : 'Not scheduled'}
                      {order.actualPickupTime && (
                        <div className="timeline-actual">(Actual: {formatDateTime(order.actualPickupTime)})</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-marker" data-status={order.estimatedDeliveryTime ? 'upcoming' : 'pending'}></div>
                  <div className="timeline-content">
                    <div className="timeline-title">Delivery Time</div>
                    <div className="timeline-value">
                      {order.estimatedDeliveryTime ? formatDateTime(order.estimatedDeliveryTime) : 'Not scheduled'}
                      {order.actualDeliveryTime && (
                        <div className="timeline-actual">(Actual: {formatDateTime(order.actualDeliveryTime)})</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatchOrderDetailPage;
