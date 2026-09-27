import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../services/api';
import { Alert, Button, Card, LoadingSpinner } from '../ui';

const InvoiceDownloadPage = () => {
  const { orderId } = useParams();
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const downloadInvoice = async () => {
      try {
        const response = await api.get(`/orders/${orderId}/invoice/download`, {
          responseType: 'blob',
        });
        if (!active) return;

        const url = URL.createObjectURL(response.data);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `invoice_${orderId}.pdf`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
      } catch (downloadError) {
        if (active) {
          setError(downloadError.message || 'Unable to download this invoice.');
        }
      }
    };

    downloadInvoice();
    return () => {
      active = false;
    };
  }, [orderId]);

  return (
    <div style={{ maxWidth: 640, margin: '48px auto', padding: '0 16px' }}>
      <Card style={{ padding: 32, textAlign: 'center' }}>
        <h1>Invoice #{orderId}</h1>
        {error ? (
          <Alert variant="danger">{error}</Alert>
        ) : (
          <>
            <LoadingSpinner />
            <p>Your invoice download is starting…</p>
          </>
        )}
        <Link to="/track">
          <Button variant="secondary">Return to tracking</Button>
        </Link>
      </Card>
    </div>
  );
};

export default InvoiceDownloadPage;
