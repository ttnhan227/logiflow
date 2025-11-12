import api from '../api';

const settingsService = {
  getSettings: (page = 0, size = 10) =>
    api.get('/admin/system-settings', { params: { page, size } }).then(res => res.data),

  searchSettings: (term, page = 0, size = 10) =>
    api.get('/admin/system-settings/search', { params: { term, page, size } }).then(res => res.data),

  getSettingById: (id) =>
    api.get(`/admin/system-settings/${id}`).then(res => res.data),

  createSetting: (data) =>
    api.post('/admin/system-settings', data).then(res => res.data),

  updateSetting: (data) =>
    api.put('/admin/system-settings', data).then(res => res.data),

  deleteSetting: (id) =>
    api.delete(`/admin/system-settings/${id}`),
};

export default settingsService;
