import api from '../api';

const auditLogService = {
  searchLogs: (params = {}) =>
    api.get('/admin/audit-logs', { params }).then(res => res.data),
};

export default auditLogService;
