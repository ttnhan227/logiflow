import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { paymentService, customerOrderService } from '../../services';

const CustomerOrderDetailPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const data = await customerOrderService.getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      const paymentLink = await paymentService.generatePaymentLink(orderId);
      window.location.href = paymentLink;
    } catch (err) {
      console.error('Payment error:', err);
      alert('Failed to process payment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="customer-loading">
        <div className="customer-spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-card">
        <div className="customer-card-body">
          <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={fetchOrderDetails}
            className="customer-btn-secondary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="customer-card">
        <div className="customer-card-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h3 style={{ marginBottom: '8px', color: '#1f2937' }}>Order not found</h3>
          <Link
            to="/customer/orders"
            className="customer-btn-primary"
            style={{ display: 'inline-block', marginTop: '16px' }}
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="customer-page-header">
        <h1 className="customer-page-title">Order #{order.orderId}</h1>
        <p className="customer-page-subtitle">Order details and tracking</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>

        {/* Order Status Card */}
        <div className="customer-card">
          <div className="customer-card-header">
            <h3 className="customer-card-title">Order Status</h3>
          </div>
          <div className="customer-card-body">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: order.orderStatus === 'DELIVERED' ? '#10b981' :
                               order.orderStatus === 'IN_TRANSIT' ? '#8b5cf6' :
                               order.orderStatus === 'ASSIGNED' ? '#3b82f6' :
                               order.orderStatus === 'PENDING' ? '#f59e0b' : '#6b7280',
                color: 'white'
              }}>
                {order.orderStatus}
              </span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}
            </div>
            {order.estimatedDeliveryTime && (
              <div style={{ marginBottom: '8px' }}>
                <strong>Estimated Delivery:</strong> {new Date(order.estimatedDeliveryTime).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Payment Status Card */}
        <div className="customer-card">
          <div className="customer-card-header">
            <h3 className="customer-card-title">Payment Information</h3>
          </div>
          <div className="customer-card-body">
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                backgroundColor: order.paymentStatus === 'PAID' ? '#10b981' :
                               order.paymentStatus === 'PENDING' ? '#f59e0b' : '#ef4444',
                color: 'white'
              }}>
                {order.paymentStatus === 'PAID' ? 'Paid' :
                 order.paymentStatus === 'PENDING' ? 'Payment Due' : 'Payment Failed'}
              </span>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Amount:</strong> VND {(order.shippingFee || 0).toLocaleString('vi-VN')}
              <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '8px' }}>
                (${((order.shippingFee || 0) / 23000).toFixed(2)})
              </span>
            </div>
            {(order.orderStatus === 'DELIVERED' || order.orderStatus === 'ASSIGNED' || order.orderStatus === 'IN_TRANSIT') && order.paymentStatus !== 'PAID' && (
              <button
                onClick={handlePayment}
                className="customer-btn-primary"
                style={{ marginTop: '16px' }}
              >
                Pay Now with PayPal
              </button>
            )}
          </div>
        </div>

        {/* Order Details Card */}
        <div className="customer-card">
          <div className="customer-card-header">
            <h3 className="customer-card-title">Order Details</h3>
          </div>
          <div className="customer-card-body">
            <div style={{ marginBottom: '8px' }}>
              <strong>Customer:</strong> {order.customerName}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>From:</strong> {order.pickupAddress}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>To:</strong> {order.deliveryAddress}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Package:</strong> {order.packageDetails || 'N/A'}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Weight:</strong> {order.weightTons ? `${order.weightTons} tons` : 'N/A'}
            </div>
            <div style={{ marginBottom: '8px' }}>
              <strong>Distance:</strong> {order.distanceKm ? `${order.distanceKm} km` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Trip Information Card (if assigned) */}
        {order.tripId && (
          <div className="customer-card">
            <div className="customer-card-header">
              <h3 className="customer-card-title">Trip Information</h3>
            </div>
            <div className="customer-card-body">
              <div style={{ marginBottom: '8px' }}>
                <strong>Trip ID:</strong> #{order.tripId}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Trip Status:</strong> {order.tripStatus || 'N/A'}
              </div>
              {order.driverName && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Driver:</strong> {order.driverName}
                </div>
              )}
              {order.vehiclePlate && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Vehicle:</strong> {order.vehiclePlate}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Back Button */}
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <Link
          to="/customer/orders"
          className="customer-btn-secondary"
        >
          ← Back to Orders
        </Link>
      </div>
    </div>
  );
};

export default CustomerOrderDetailPage;
