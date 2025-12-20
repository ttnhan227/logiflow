import api from '../api';

const registerCustomer = async (payload) => {
  const { data } = await api.post('/registration/customer', payload);
  return data;
};

export default {
  registerCustomer,
};
