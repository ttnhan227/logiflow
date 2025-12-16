import api from '../api';

const getAllNotifications = async (page = 0, size = 20) => {
  const res = await api.get('/dispatch/notifications', { params: { page, size } });
  return res.data;
};

const getUnreadNotifications = async () => {
  const res = await api.get('/dispatch/notifications/unread');
  return res.data;
};

const getUnreadCount = async () => {
  const res = await api.get('/dispatch/notifications/count');
  return res.data;
};

const markAsRead = async (notificationId) => {
  await api.post(`/dispatch/notifications/${notificationId}/read`);
};

const markMultipleAsRead = async (notificationIds) => {
  await api.post('/dispatch/notifications/read', notificationIds);
};

const markAllAsRead = async () => {
  await api.post('/dispatch/notifications/mark-all-read');
};

const getRecentNotifications = async (since) => {
  const res = await api.get('/dispatch/notifications/recent', { params: { since } });
  return res.data;
};

const getNotificationsByType = async (type) => {
  const res = await api.get(`/dispatch/notifications/types/${type}`);
  return res.data;
};

export const dispatchNotificationService = {
  getAllNotifications,
  getUnreadNotifications,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  getRecentNotifications,
  getNotificationsByType,
};

export default dispatchNotificationService;
