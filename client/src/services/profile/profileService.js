import api from '../api';

const changePassword = async (currentPassword, newPassword) => {
  await api.put('/user/profile/password', null, {
    params: { currentPassword, newPassword }
  });
};

const profileService = {
  getProfile: () => api.get('/user/profile').then((res) => res.data),
  updateProfile: (payload) => api.put('/user/profile', payload).then((res) => res.data),
  changePassword,
};

export default profileService;
