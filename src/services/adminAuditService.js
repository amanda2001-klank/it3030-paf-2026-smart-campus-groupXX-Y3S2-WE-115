import apiClient from './apiClient';

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  );

export const getAuditLogs = (params) =>
  apiClient.get('/api/admin/audit-logs', {
    params: cleanParams(params),
  });

export const getAuditSummary = () => apiClient.get('/api/admin/audit-logs/summary');
