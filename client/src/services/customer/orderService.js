import api from '../api';

const basePath = '/customer/me';

const getOrders = async (params = {}) => {
  const response = await api.get(`${basePath}/orders`, { params });
  return response.data;
};

const getOrderById = async (orderId) => {
  const response = await api.get(`${basePath}/orders/${orderId}`);
  return response.data;
};

const customerOrderService = {
  getOrders,
  getOrderById,
};

export default customerOrderService;
