import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { paymentService, customerOrderService } from '../../services';

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await customerOrderService.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (orderId) => {
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
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-card">
        <div className="customer-card-body">
          <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
          <button
            onClick={fetchOrders}
            className="customer-btn-secondary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="customer-page-header">
        <h1 className="customer-page-title">My Orders</h1>
        <p className="customer-page-subtitle">Track and manage your orders</p>
      </div>

      {orders.length === 0 ? (
        <div className="customer-card">
          <div className="customer-card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <h3 style={{ marginBottom: '8px', color: '#1f2937' }}>No orders yet</h3>
            <p style={{ color: '#6b7280', marginBottom: '0' }}>You haven't placed any orders with us yet.</p>
          </div>
        </div>
      ) : (
        <div className="customer-card">
          <div className="customer-card-body">
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '12px'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '14px', color: '#374151' }}>Order ID</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '14px', color: '#374151' }}>Status</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '14px', color: '#374151' }}>Amount</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '14px', color: '#374151' }}>Payment</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', fontSize: '14px', color: '#374151' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderId} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#1f2937' }}>
                        #{order.orderId}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: order.orderStatus === 'DELIVERED' ? '#10b981' :
                                         order.orderStatus === 'IN_TRANSIT' ? '#8b5cf6' :
                                         order.orderStatus === 'ASSIGNED' ? '#3b82f6' :
                                         order.orderStatus === 'PENDING' ? '#f59e0b' : '#6b7280',
                          color: 'white'
                        }}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#1f2937' }}>
                        VND {(order.shippingFee || 0).toLocaleString('vi-VN')}
                        <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                          (${((order.shippingFee || 0) / 23000).toFixed(2)})
                        </div>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: order.paymentStatus === 'PAID' ? '#10b981' :
                                         order.paymentStatus === 'PENDING' ? '#f59e0b' : '#ef4444',
                          color: 'white'
                        }}>
                          {order.paymentStatus === 'PAID' ? 'Paid' :
                           order.paymentStatus === 'PENDING' ? 'Payment Due' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Link
                            to={`/customer/orders/${order.orderId}`}
                            style={{
                              color: '#4f46e5',
                              textDecoration: 'none',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}
                          >
                            View Details
                          </Link>
                          {order.orderStatus === 'DELIVERED' && order.paymentStatus !== 'PAID' && (
                            <button
                              onClick={() => handlePayment(order.orderId)}
                              style={{
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer'
                              }}
                            >
                              Pay Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrdersPage;
