import api from './api';

const getMyOrders = async () => {
  const response = await api.get('/customer/me/orders');
  return response.data;
};

const trackOrder = async (orderId) => {
  const response = await api.get(`/customer/me/orders/${orderId}/track`);
  return response.data;
};

const customerService = {
  getMyOrders,
  trackOrder,
};

export default customerService;
