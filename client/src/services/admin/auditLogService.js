import api from '../api';

const auditLogService = {
  searchLogs: (params = {}) =>
    api.get('/admin/audit-logs', { params }).then(res => res.data),
  getAvailableRoles: () =>
    api.get('/admin/audit-logs/filters/roles').then(res => res.data),
  getAvailableActions: () =>
    api.get('/admin/audit-logs/filters/actions').then(res => res.data),
};

export default auditLogService;
