import api from '../api';

const paymentRequestService = {
    /**
     * Get all delivered orders that need payment review
     */
    getDeliveredOrders: (page = 0, size = 10) => {
        return api.get('/admin/payment-requests/delivered-orders', {
            params: { page, size }
        });
    },

    /**
     * Get delivered orders by customer name
     */
    getDeliveredOrdersByCustomer: (customerName, page = 0, size = 10) => {
        return api.get('/admin/payment-requests/delivered-orders/by-customer', {
            params: { customerName, page, size }
        });
    },

    /**
     * Get delivered orders by date range
     */
    getDeliveredOrdersByDate: (startDate, endDate, page = 0, size = 10) => {
        return api.get('/admin/payment-requests/delivered-orders/by-date', {
            params: { 
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                page, 
                size 
            }
        });
    },

    /**
     * Get delivered orders by priority level
     */
    getDeliveredOrdersByPriority: (priority, page = 0, size = 10) => {
        return api.get('/admin/payment-requests/delivered-orders/by-priority', {
            params: { priority, page, size }
        });
    },

    /**
     * Send payment request for a specific order
     */
    sendPaymentRequest: (orderId) => {
        return api.post(`/admin/payment-requests/${orderId}/send-request`);
    },

    /**
     * Send payment requests for multiple orders
     */
    sendPaymentRequests: (orderIds) => {
        return api.post('/admin/payment-requests/send-requests', orderIds);
    },

    /**
     * Get payment statistics for delivered orders
     */
    getPaymentStatistics: () => {
        return api.get('/admin/payment-requests/statistics');
    },

    /**
     * Get payment history for an order
     */
    getPaymentHistory: (orderId) => {
        return api.get(`/admin/payment-requests/${orderId}/payment-history`);
    },

    /**
     * Get payment history for a customer (all their orders)
     */
    getCustomerPaymentHistory: (customerName) => {
        return api.get(`/admin/payment-requests/customer/${encodeURIComponent(customerName)}/payment-history`);
    },

    /**
     * Get customers with their orders for payment management
     */
    getCustomersWithOrders: () => {
        return api.get('/admin/payment-requests/customers-with-orders');
    },

    /**
     * Get payment request summary for selected orders
     */
    getPaymentRequestSummary: (orderIds) => {
        return api.post('/admin/payment-requests/summary', orderIds);
    }
};

export default paymentRequestService;
