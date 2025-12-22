import api from './api';

const paymentService = {
  /**
   * Create PayPal payment order
   */
  createPayPalOrder: async (amount, description, orderId) => {
    const response = await api.post('/payment/create-order', {
      amount,
      description,
      orderId
    });
    return response.data;
  },

  /**
   * Capture PayPal payment
   */
  capturePayment: async (paypalOrderId, orderId) => {
    const response = await api.post(`/payment/capture/${paypalOrderId}`, null, {
      params: { orderId }
    });
    return response.data;
  },

  /**
   * Get payment status
   */
  getPaymentStatus: async (paypalOrderId) => {
    const response = await api.get(`/payment/status/${paypalOrderId}`);
    return response.data;
  },

  /**
   * Send payment request email
   */
  sendPaymentRequest: async (orderId) => {
    const response = await api.post(`/payment/send-request/${orderId}`);
    return response.data;
  },

  /**
   * Send payment reminder
   */
  sendPaymentReminder: async (orderId) => {
    const response = await api.post(`/payment/send-reminder/${orderId}`);
    return response.data;
  },

  /**
   * Generate PayPal payment link for frontend
   */
  generatePaymentLink: async (orderId) => {
    try {
      console.log('Generating payment link for order:', orderId);

      // Get order details
      const response = await api.get(`/customer/me/orders/${orderId}`);
      const order = response.data;
      console.log('Order details:', order);

      if (order.shippingFee) {
        console.log('Creating PayPal order for amount:', order.shippingFee);

        // Create PayPal order directly for frontend payment
        const paypalOrder = await paymentService.createPayPalOrder(
          order.shippingFee,
          `Payment for Order #${order.orderId} - ${order.customerName}`,
          orderId
        );

        console.log('PayPal order created:', paypalOrder);

        // Extract approval URL from PayPal response
        if (paypalOrder.links) {
          const approveLink = paypalOrder.links.find(link => link.rel === 'approve');
          console.log('PayPal approval link:', approveLink?.href);
          return approveLink?.href;
        }
      }

      throw new Error('Unable to generate payment link - no shipping fee or invalid order');
    } catch (error) {
      console.error('Error generating payment link:', error);
      throw error;
    }
  }
};

export default paymentService;
