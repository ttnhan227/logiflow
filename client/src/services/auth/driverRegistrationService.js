import api from '../api';

const registerDriver = async (payload) => {
  const { data } = await api.post('/registration/driver', payload);
  return data;
};

export default {
  registerDriver,
};
