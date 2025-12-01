import api from '../api';

const registerDriver = async (payload) => {
  const { data } = await api.post('/auth/driver/register', payload);
  return data;
};

export default {
  registerDriver,
};
