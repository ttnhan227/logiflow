import api from '../api';

const profileService = {
  getProfile: () => api.get('/user/profile').then((res) => res.data),
  updateProfile: (payload) => api.put('/user/profile', payload).then((res) => res.data),
};

export default profileService;
