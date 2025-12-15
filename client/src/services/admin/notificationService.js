import api from '../api';

const getAllNotifications = async (page = 0, size = 20) => {
  const res = await api.get('/admin/notifications', { params: { page, size } });
  return res.data;
};

const getUnreadNotifications = async () => {
  const res = await api.get('/admin/notifications/unread');
  return res.data;
};

const getUnreadCount = async () => {
  const res = await api.get('/admin/notifications/count');
  return res.data;
};

const markAsRead = async (notificationId) => {
  await api.post(`/admin/notifications/${notificationId}/read`);
};

const markMultipleAsRead = async (notificationIds) => {
  await api.post('/admin/notifications/read', notificationIds);
};

const markAllAsRead = async () => {
  await api.post('/admin/notifications/mark-all-read');
};

const getRecentNotifications = async (since) => {
  const res = await api.get('/admin/notifications/recent', {
    params: { since: since.toISOString() }
  });
  return res.data;
};

const getNotificationsByType = async (type) => {
  const res = await api.get(`/admin/notifications/types/${type}`);
  return res.data;
};

export const notificationService = {
  getAllNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  getRecentNotifications,
  getNotificationsByType,
};

export default notificationService;
