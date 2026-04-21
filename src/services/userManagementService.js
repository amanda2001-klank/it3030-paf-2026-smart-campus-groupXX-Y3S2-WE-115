import apiClient from './apiClient';

export const listUsers = () => apiClient.get('/api/admin/users');

export const getUserById = (userId) => apiClient.get(`/api/admin/users/${userId}`);

export const createUser = (payload) => apiClient.post('/api/admin/users', payload);

export const updateUser = (userId, payload) => apiClient.put(`/api/admin/users/${userId}`, payload);

export const updateUserRole = (userId, role) =>
  apiClient.put(`/api/admin/users/${userId}/role`, { role });

export const deleteUser = (userId) => apiClient.delete(`/api/admin/users/${userId}`);
