import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      // Import the service
      const { customerOrderService } = await import('../../services');
      const data = await customerOrderService.getOrderById(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to fetch order details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="customer-loading">
        <div className="customer-spinner"></div>
        <p>Processing payment...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="customer-page-header">
        <h1 className="customer-page-title">Payment Successful!</h1>
        <p className="customer-page-subtitle">Your payment has been processed successfully</p>
      </div>

      <div className="customer-card">
        <div className="customer-card-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ marginBottom: '16px', color: '#10b981' }}>Payment Completed</h2>
          <p style={{ marginBottom: '24px', color: '#6b7280' }}>
            Thank you for your payment. Your order has been successfully processed.
          </p>

          {order && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <h3 style={{ marginBottom: '12px', color: '#374151' }}>Order Details</h3>
              <p><strong>Order ID:</strong> #{order.orderId}</p>
              <p><strong>Status:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{order.orderStatus}</span></p>
              <p><strong>Amount Paid:</strong> VND {(order.shippingFee || 0).toLocaleString('vi-VN')}</p>
              <p><strong>Payment Status:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>{order.paymentStatus}</span></p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/customer/orders"
              className="customer-btn-primary"
            >
              View My Orders
            </Link>
            <Link
              to="/customer/orders"
              className="customer-btn-secondary"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
