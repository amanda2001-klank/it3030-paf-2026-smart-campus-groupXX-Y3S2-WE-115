import apiClient from './apiClient';

export const getNotifications = ({ unreadOnly = false, limit = 25 } = {}) =>
  apiClient.get('/api/notifications', {
    params: {
      unreadOnly,
      limit,
    },
  });

export const getUnreadNotificationCount = () =>
  apiClient.get('/api/notifications/unread-count');

export const markNotificationAsRead = (notificationId) =>
  apiClient.put(`/api/notifications/${notificationId}/read`);

export const markAllNotificationsAsRead = () =>
  apiClient.put('/api/notifications/read-all');
