import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/auth/authService';
import customerService from '../../services/customerService';
import Modal from '../admin/Modal';
import './home.css';

const TrackPage = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [trackingResult, setTrackingResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    if (currentUser && currentUser.role === 'CUSTOMER') {
      fetchOrders();
    }
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await customerService.getMyOrders();
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = async (orderId) => {
    setLoading(true);
    setError('');
    setTrackingResult(null);
    setIsModalOpen(false);

    try {
      const data = await customerService.trackOrder(orderId);
      // Map API response to UI format
      setTrackingResult({
        trackingNumber: data.orderId,
        status: data.orderStatus,
        tripStatus: data.tripStatus,
        estimatedPickupTime: data.estimatedPickupTime,
        estimatedDeliveryTime: data.estimatedDeliveryTime,
        actualPickupTime: data.actualPickupTime,
        actualDeliveryTime: data.actualDeliveryTime,
        currentLat: data.currentLat,
        currentLng: data.currentLng,
        driverName: data.driverName,
        driverPhone: data.driverPhone,
        vehiclePlate: data.vehiclePlate,
        vehicleType: data.vehicleType,
        statusHistory: data.statusHistory.map(update => ({
          status: update.status,
          timestamp: update.timestamp,
          notes: update.notes
        }))
      });
      setIsModalOpen(true);
    } catch (err) {
      setError('Failed to track order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTrackingResult(null);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '#10b981';
      case 'out for delivery': return '#f59e0b';
      case 'in transit': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return '✅';
      case 'out for delivery': return '🚚';
      case 'in transit': return '🚀';
      case 'picked up': return '📦';
      default: return '📋';
    }
  };

  const getPaymentStatusColor = (paymentStatus) => {
    if (!paymentStatus) return '#6b7280';
    switch (paymentStatus.toUpperCase()) {
      case 'PAID': return '#10b981';
      case 'PENDING': return '#3b82f6';
      case 'FAILED': return '#dc2626';
      case 'CANCELLED': return '#dc2626';
      case 'REFUNDED': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getPaymentStatusIcon = (paymentStatus) => {
    if (!paymentStatus) return 'ℹ️';
    switch (paymentStatus.toUpperCase()) {
      case 'PAID': return '✅';
      case 'PENDING': return '⏳';
      case 'FAILED': return '❌';
      case 'CANCELLED': return '🚫';
      case 'REFUNDED': return '↩️';
      default: return 'ℹ️';
    }
  };

  const getPaymentStatusMessage = (paymentStatus) => {
    if (!paymentStatus) return 'Please check your email for payment information';
    switch (paymentStatus.toUpperCase()) {
      case 'PAID': return 'Payment received - your order is now complete';
      case 'PENDING': return 'Payment processed - please check your email for invoice and payment details';
      case 'FAILED': return 'Payment failed - please contact support';
      case 'CANCELLED': return 'Payment cancelled';
      case 'REFUNDED': return 'Payment refunded';
      default: return 'Please check your email for payment information';
    }
  };

  return (
    <div className="home-container">
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '700',
          color: 'var(--text-color)',
          marginBottom: '1rem',
          textAlign: 'center',
          background: 'linear-gradient(90deg, var(--primary-color), var(--accent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Track Your Delivery
        </h1>
        <p style={{
          textAlign: 'center',
          fontSize: '1.25rem',
          color: '#556',
          marginBottom: '3rem'
        }}>
          Real-time tracking for all your LogiFlow shipments across Vietnam.
        </p>

        {user && user.role === 'CUSTOMER' ? (
          <div style={{
            maxWidth: '1000px',
            margin: '0 auto 4rem',
            padding: '2rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: 'var(--text-color)', marginBottom: '2rem' }}>Your Orders</h2>
            {orders.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>No orders found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {orders.map((order) => (
                  <div key={order.orderId} style={{
                    padding: '1.5rem',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-color)', marginBottom: '0.5rem' }}>
                        Order #{order.orderId}
                      </div>
                      <div style={{ color: '#6b7280', marginBottom: '0.25rem' }}>
                        {order.pickupAddress} → {order.deliveryAddress}
                      </div>
                      {order.packageDetails && (
                        <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                          Package: {order.packageDetails}
                        </div>
                      )}
                      <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        Weight: {order.weightTons} tons | Distance: {order.distanceKm?.toFixed(1)} km
                        {order.packageValue && ` | Value: VND ${order.packageValue.toLocaleString()}`}
                      </div>
                      {/* Pickup Type Information */}
                      {order.pickupType && order.pickupType !== 'STANDARD' && (
                        <div style={{
                          padding: '0.5rem',
                          backgroundColor: '#e3f2fd',
                          border: '1px solid #bbdefb',
                          borderRadius: '6px',
                          marginBottom: '0.5rem'
                        }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1976d2', marginBottom: '0.25rem' }}>
                            Pickup Type: {order.pickupType}
                          </div>
                          {order.pickupType === 'WAREHOUSE' && order.warehouseName && (
                            <div style={{ fontSize: '0.8rem', color: '#1976d2' }}>
                              Warehouse: {order.warehouseName}
                              {order.dockNumber && ` | Dock: ${order.dockNumber}`}
                            </div>
                          )}
                          {order.pickupType === 'PORT_TERMINAL' && order.containerNumber && (
                            <div style={{ fontSize: '0.8rem', color: '#1976d2' }}>
                              Container: {order.containerNumber}
                              {order.terminalName && ` | Terminal: ${order.terminalName}`}
                            </div>
                          )}
                        </div>
                      )}
                      <div style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        Status: <span style={{ color: getStatusColor(order.orderStatus), fontWeight: '600' }}>
                          {getStatusIcon(order.orderStatus)} {order.orderStatus}
                        </span>
                        {order.tripStatus && ` | Trip: ${order.tripStatus}`}
                      </div>
                      {/* Payment Status with contextual messaging */}
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: `${getPaymentStatusColor(order.paymentStatus)}20`,
                        border: `1px solid ${getPaymentStatusColor(order.paymentStatus)}40`,
                        borderRadius: '6px',
                        marginBottom: '0.25rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span style={{ fontSize: '1rem' }}>{getPaymentStatusIcon(order.paymentStatus)}</span>
                          <span style={{
                            fontSize: '0.85rem',
                            color: getPaymentStatusColor(order.paymentStatus),
                            fontWeight: '500'
                          }}>
                            {getPaymentStatusMessage(order.paymentStatus)}
                          </span>
                        </div>
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                        Created: {new Date(order.createdAt).toLocaleDateString()}
                        {order.estimatedDeliveryTime && ` | Est. Delivery: ${new Date(order.estimatedDeliveryTime).toLocaleDateString()}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleTrackOrder(order.orderId)}
                      disabled={loading}
                      style={{
                        padding: '0.75rem 1.5rem',
                        background: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            maxWidth: '600px',
            margin: '0 auto 4rem',
            padding: '2rem',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Please login as a customer to view and track your orders.
            </p>
            <Link to="/login" style={{
              padding: '1rem 2rem',
              background: 'var(--primary-color)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Login
            </Link>
          </div>
        )}

        {error && (
          <div style={{
            maxWidth: '600px',
            margin: '0 auto 2rem',
            padding: '1rem',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            color: '#dc2626',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Mobile App Promotion */}
        <div style={{
          maxWidth: '600px',
          margin: '4rem auto 0',
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))',
          borderRadius: '12px',
          textAlign: 'center',
          border: '1px solid rgba(59, 130, 246, 0.1)'
        }}>
          <h2 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>📱 Enhanced Mobile Experience</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Please use our mobile app for a better tracking experience with real-time GPS updates,
            instant notifications, and direct driver communication.
          </p>
          <Link to="/mobile-app" style={{
            padding: '1rem 2rem',
            background: 'var(--primary-color)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '600',
            display: 'inline-block'
          }}>
            Download Mobile App
          </Link>
        </div>

        {/* Tracking Modal */}
        {isModalOpen && trackingResult && (
          <Modal
            isOpen={isModalOpen}
            onClose={closeModal}
            title={`Order #${trackingResult.trackingNumber} Tracking`}
            size="large"
          >
            {/* Status Overview */}
            <div style={{
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
              }}>
                <div>
                  <h3 style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Order ID
                  </h3>
                  <p style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-color)' }}>
                    {trackingResult.trackingNumber}
                  </p>
                </div>

                <div>
                  <h3 style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Order Status
                  </h3>
                  <p style={{
                    fontSize: '1.2rem',
                    fontWeight: '600',
                    color: getStatusColor(trackingResult.status)
                  }}>
                    {getStatusIcon(trackingResult.status)} {trackingResult.status}
                  </p>
                </div>

                <div>
                  <h3 style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Trip Status
                  </h3>
                  <p style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-color)' }}>
                    {trackingResult.tripStatus || 'N/A'}
                  </p>
                </div>

                <div>
                  <h3 style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    Est. Delivery
                  </h3>
                  <p style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--accent)' }}>
                    {trackingResult.estimatedDeliveryTime ? new Date(trackingResult.estimatedDeliveryTime).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'N/A'}
                  </p>
                </div>

                {trackingResult.actualDeliveryTime && (
                  <div>
                    <h3 style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      Delivered At
                    </h3>
                    <p style={{ fontSize: '1.2rem', fontWeight: '600', color: '#10b981' }}>
                      {new Date(trackingResult.actualDeliveryTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Order Pickup Information - Get from the order data */}
              {(() => {
                const order = orders.find(o => o.orderId === trackingResult.trackingNumber);
                if (order && order.pickupType && order.pickupType !== 'STANDARD') {
                  return (
                    <div style={{
                      marginTop: '2rem',
                      padding: '1rem',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '8px',
                      border: '1px solid #bbdefb'
                    }}>
                      <h3 style={{ color: '#1976d2', fontSize: '1.1rem', marginBottom: '1rem' }}>
                        Pickup Information
                      </h3>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: '600', color: '#1976d2' }}>Type:</span> {order.pickupType}
                      </div>
                      {order.pickupType === 'WAREHOUSE' && order.warehouseName && (
                        <div style={{ fontSize: '0.9rem', color: '#1976d2' }}>
                          <span style={{ fontWeight: '600' }}>Warehouse:</span> {order.warehouseName}
                          {order.dockNumber && <span> | <span style={{ fontWeight: '600' }}>Dock:</span> {order.dockNumber}</span>}
                        </div>
                      )}
                      {order.pickupType === 'PORT_TERMINAL' && order.containerNumber && (
                        <div style={{ fontSize: '0.9rem', color: '#1976d2' }}>
                          <span style={{ fontWeight: '600' }}>Container:</span> {order.containerNumber}
                          {order.terminalName && <span> | <span style={{ fontWeight: '600' }}>Terminal:</span> {order.terminalName}</span>}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Driver Info */}
              {trackingResult.driverName && (
                <div style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <h3 style={{ color: 'var(--text-color)', fontSize: '1.1rem', marginBottom: '1rem' }}>
                    Driver Information
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                  }}>
                    <div>
                      <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>Name:</span> {trackingResult.driverName}
                    </div>
                    <div>
                      <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>Phone:</span> {trackingResult.driverPhone}
                    </div>
                    <div>
                      <span style={{ fontWeight: '600', color: 'var(--text-color)' }}>Vehicle:</span> {trackingResult.vehiclePlate} ({trackingResult.vehicleType})
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status Timeline */}
            <div>
              <h3 style={{
                marginBottom: '1.5rem',
                fontSize: '1.5rem',
                color: 'var(--text-color)'
              }}>
                Shipping Timeline
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {trackingResult.statusHistory.map((statusUpdate, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    position: 'relative'
                  }}>
                    {/* Timeline line */}
                    {index < trackingResult.statusHistory.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '2.5rem',
                        width: '2px',
                        height: 'calc(100% + 2rem)',
                        backgroundColor: '#e5e7eb'
                      }} />
                    )}

                    {/* Status icon */}
                    <div style={{
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      backgroundColor: '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      📍
                    </div>

                    {/* Status details */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        color: 'var(--text-color)',
                        marginBottom: '0.25rem'
                      }}>
                        {statusUpdate.status}
                      </div>
                      {statusUpdate.notes && (
                        <div style={{
                          fontSize: '0.9rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>
                          {statusUpdate.notes}
                        </div>
                      )}
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#9ca3af'
                      }}>
                        {new Date(statusUpdate.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        )}

        {/* Help Section */}
        <div style={{
          maxWidth: '600px',
          margin: '4rem auto 0',
          padding: '2rem',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(59, 130, 246, 0.02))',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: 'var(--text-color)', marginBottom: '1rem' }}>Need Help?</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Can't find your tracking number or need assistance with your shipment?
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--primary-color)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Contact Support
            </Link>
            <Link to="/faq" style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: 'var(--primary-color)',
              border: '2px solid var(--primary-color)',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600'
            }}>
              Check FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackPage;
