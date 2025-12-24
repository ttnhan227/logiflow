import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import paymentRequestService from '../../services/admin/paymentRequestService';
import './admin.css';

const AdminPaymentRequestPage = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [statistics, setStatistics] = useState(null);
    const [customerDialog, setCustomerDialog] = useState({ open: false, customer: null });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [filters, setFilters] = useState({
        searchTerm: ''
    });

    // Load data
    const loadData = async () => {
        setLoading(true);
        try {
            const response = await paymentRequestService.getCustomersWithOrders();
            setCustomers(response.data || []);
        } catch (error) {
            showSnackbar('Error loading data: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadStatistics = async () => {
        try {
            const response = await paymentRequestService.getPaymentStatistics();
            setStatistics(response.data);
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    };

    useEffect(() => {
        loadData();
        loadStatistics();
    }, []); // Load data once on mount

    // Filter customers based on search and filter criteria
    useEffect(() => {
        let filtered = customers;

        // Filter by search term
        if (filters.searchTerm.trim()) {
            const search = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(customer =>
                customer.customerName?.toLowerCase().includes(search) ||
                customer.customerPhone?.toLowerCase().includes(search)
            );
        }



        setFilteredCustomers(filtered);
    }, [customers, filters]);

    // Handle customer click
    const handleCustomerClick = (customer) => {
        setCustomerDialog({
            open: true,
            customer: customer
        });
    };

    // Handle payment requests
    const handleSendPaymentRequest = async (orderId) => {
        if (!window.confirm('Are you sure you want to send the payment request for this order?')) {
            return;
        }

        try {
            await paymentRequestService.sendPaymentRequest(orderId);
            showSnackbar('Payment request sent successfully', 'success');
            // Reload data to update the customer's pending orders count
            loadData();
            loadStatistics();
            // Close dialog and reopen to refresh data
            setCustomerDialog({ open: false, customer: null });
            setTimeout(() => {
                const updatedCustomer = customers.find(c => c.customerName === customerDialog.customer.customerName);
                if (updatedCustomer) {
                    setCustomerDialog({ open: true, customer: updatedCustomer });
                }
            }, 100);
        } catch (error) {
            showSnackbar('Failed to send payment request: ' + error.message, 'error');
        }
    };

    // Handle snackbar
    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const formatCurrency = (amount) => {
        if (!amount) return '0 VND';
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return '#dcfce7';
            case 'PENDING': return '#fef9c3';
            default: return '#f3f4f6';
        }
    };

    const formatTime = (ts) => (ts ? new Date(ts).toLocaleString('vi-VN') : 'N/A');

    if (loading) {
        return (
            <div className="admin-page-container">
                <div className="admin-page-header">
                    <h1>💰 Payment Request Management</h1>
                </div>
                <div className="loading-state">
                    <span className="loading-spinner"></span> Loading payment requests...
                </div>
            </div>
        );
    }

    return (
        <div className="admin-page-container">
            {/* Header */}
            <div className="admin-page-header">
                <h1>💰 Payment Request Management</h1>
                <p>Manage and send payment requests for delivered orders by customer</p>
            </div>

            {/* Statistics Cards */}
            {statistics && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                    <div className="stat-card" style={{
                        background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
                        padding: '24px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.15)',
                        border: '1px solid #bbf7d0',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            fontSize: '32px',
                            opacity: 0.3
                        }}>💰</div>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: '#166534',
                            marginBottom: '8px'
                        }}>
                            Orders Paid
                        </div>
                        <div style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            color: '#166534',
                            marginBottom: '4px',
                            lineHeight: '1'
                        }}>
                            {statistics.paidOrders}
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: '#15803d',
                            fontWeight: '500'
                        }}>
                            Successfully completed payments
                        </div>
                    </div>

                    <div className="stat-card" style={{
                        background: 'linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)',
                        padding: '24px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
                        border: '1px solid #fde68a',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            fontSize: '32px',
                            opacity: 0.3
                        }}>⏳</div>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: '#92400e',
                            marginBottom: '8px'
                        }}>
                            Pending Payments
                        </div>
                        <div style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            color: '#92400e',
                            marginBottom: '4px',
                            lineHeight: '1'
                        }}>
                            {statistics.pendingOrders}
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: '#b45309',
                            fontWeight: '500'
                        }}>
                            Awaiting customer payment
                        </div>
                    </div>

                    <div className="stat-card" style={{
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        padding: '24px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        border: '1px solid #e2e8f0',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            fontSize: '32px',
                            opacity: 0.3
                        }}>📊</div>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: '#475569',
                            marginBottom: '8px'
                        }}>
                            Total Revenue
                        </div>
                        <div style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            color: '#1e293b',
                            marginBottom: '4px',
                            lineHeight: '1'
                        }}>
                            {formatCurrency(statistics.totalAmount)}
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: '#64748b',
                            fontWeight: '500'
                        }}>
                            From paid orders
                        </div>
                    </div>

                    <div className="stat-card" style={{
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        padding: '24px',
                        borderRadius: '16px',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
                        border: '1px solid #fde68a',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            fontSize: '32px',
                            opacity: 0.3
                        }}>⏳</div>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: '#92400e',
                            marginBottom: '8px'
                        }}>
                            Pending Amount
                        </div>
                        <div style={{
                            fontSize: '32px',
                            fontWeight: 800,
                            color: '#92400e',
                            marginBottom: '4px',
                            lineHeight: '1'
                        }}>
                            {formatCurrency(statistics.pendingAmount)}
                        </div>
                        <div style={{
                            fontSize: '12px',
                            color: '#b45309',
                            fontWeight: '500'
                        }}>
                            From unpaid orders
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="admin-page-toolbar" style={{
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap'
            }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                    <input
                        type="text"
                        placeholder="🔍 Search customers by name or phone..."
                        value={filters.searchTerm}
                        onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                        style={{
                            width: '100%',
                            padding: '10px 14px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            fontSize: '14px',
                            backgroundColor: 'white'
                        }}
                    />
                </div>

                <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
                    Showing {filteredCustomers.length} of {customers.length} customers
                </div>
            </div>

            {/* Customers Table */}
            {loading ? (
                <div className="loading-state">
                    <span className="loading-spinner"></span> Loading customers...
                </div>
            ) : customers.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <div className="empty-state-title">No customers found</div>
                    <div className="empty-state-description">There are no customers with delivered orders at this time</div>
                </div>
            ) : (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Total Orders</th>
                                <th>Pending Orders</th>
                                <th>Total Amount</th>
                                <th>Pending Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.map((customer) => (
                                <tr key={customer.customerName} style={{ cursor: 'pointer' }} onClick={() => handleCustomerClick(customer)}>
                                    <td>
                                        <div className="user-row">
                                            <div className="avatar">
                                                {(customer.customerName || '?')
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')
                                                    .toUpperCase()
                                                    .slice(0, 2)}
                                            </div>
                                            <div className="user-info">
                                                <div className="user-name">{customer.customerName}</div>
                                                <div className="user-id">{customer.customerPhone || 'No phone'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '14px', fontWeight: 600 }}>
                                            {customer.totalOrders}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: customer.pendingOrders > 0 ? '#f59e0b' : '#10b981' }}>
                                            {customer.pendingOrders}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>
                                            {formatCurrency(customer.totalAmount)}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: customer.pendingAmount > 0 ? '#f59e0b' : '#10b981' }}>
                                            {formatCurrency(customer.pendingAmount)}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="actions-cell">
                                            <button
                                                className="action-btn"
                                                title="View customer orders"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCustomerClick(customer);
                                                }}
                                            >
                                                👁️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Customer Orders Dialog */}
            {customerDialog.open && customerDialog.customer && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '1000px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                                    👥 {customerDialog.customer.customerName} - Orders & Payments
                                </h2>
                                <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                                    {customerDialog.customer.pendingOrders} pending orders • {formatCurrency(customerDialog.customer.pendingAmount)} pending amount
                                </p>
                            </div>
                            <button
                                onClick={() => setCustomerDialog({ open: false, customer: null })}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#f3f4f6',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: '600'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {customerDialog.customer.orders && customerDialog.customer.orders.length > 0 ? (
                            <div className="admin-table-wrapper">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Order ID</th>
                                            <th>Address</th>
                                            <th>Weight</th>
                                            <th>Amount</th>
                                            <th>Created At</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {customerDialog.customer.orders.map((order) => (
                                            <tr key={order.orderId}>
                                                <td>
                                                    <div style={{ fontSize: '13px', fontWeight: 600 }}>
                                                        #{order.orderId}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '13px' }}>
                                                        {order.pickupAddress}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '13px' }}>
                                                        {order.weightTons} tons
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>
                                                        {formatCurrency(order.shippingFee)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: '13px' }}>
                                                        {formatTime(order.createdAt)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span
                                                        className="order-badge"
                                                        style={{
                                                            backgroundColor: getStatusColor(order.paymentStatus),
                                                            color: '#111827',
                                                        }}
                                                    >
                                                        {order.paymentStatus || 'UNKNOWN'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="actions-cell">
                                                        {order.paymentStatus === 'PENDING' && (
                                                            <button
                                                                title="Send payment request"
                                                                onClick={() => handleSendPaymentRequest(order.orderId)}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    backgroundColor: '#3b82f6',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '6px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '12px',
                                                                    fontWeight: '600'
                                                                }}
                                                            >
                                                                💰 Send Request
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-state-icon">📦</div>
                                <div className="empty-state-title">No orders found</div>
                                <div className="empty-state-description">This customer has no delivered orders</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Snackbar */}
            {snackbar.open && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    background: snackbar.severity === 'success' ? '#dcfce7' : '#fee2e2',
                    color: snackbar.severity === 'success' ? '#166534' : '#991b1b',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span>{snackbar.message}</span>
                    <button
                        onClick={handleCloseSnackbar}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            fontSize: '16px'
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminPaymentRequestPage;
