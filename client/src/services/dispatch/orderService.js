import api from '../api';

const basePath = '/dispatch';

const getOrders = async (params = {}) => {
  const response = await api.get(`${basePath}/orders`, { params });
  return response.data;
};

const createOrder = async (payload) => {
  const response = await api.post(`${basePath}/orders`, payload);
  return response.data;
};

const importOrders = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`${basePath}/orders/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

const downloadTemplate = async (format = 'csv') => {
  const response = await api.get(`${basePath}/orders/import/template`, {
    params: { format },
    responseType: 'blob'
  });
  return response.data; // blob
};

const orderService = {
  getOrders,
  createOrder,
  importOrders,
  downloadTemplate,
};

export default orderService;
