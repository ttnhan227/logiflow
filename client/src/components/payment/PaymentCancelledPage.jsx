import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const PaymentCancelledPage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div>
      <div className="customer-page-header">
        <h1 className="customer-page-title">Payment Cancelled</h1>
        <p className="customer-page-subtitle">Your payment was cancelled</p>
      </div>

      <div className="customer-card">
        <div className="customer-card-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
          <h2 style={{ marginBottom: '16px', color: '#ef4444' }}>Payment Cancelled</h2>
          <p style={{ marginBottom: '24px', color: '#6b7280' }}>
            You have cancelled the payment process. Your order remains unpaid.
          </p>

          {orderId && (
            <div style={{
              backgroundColor: '#fef2f2',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: '1px solid #fecaca'
            }}>
              <p style={{ margin: '0', color: '#dc2626' }}>
                <strong>Order #{orderId}</strong> is still pending payment.
              </p>
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
              Try Again Later
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancelledPage;
