import apiClient from './apiClient';

/**
 * Incident Service
 * Communicates with the backend API for incident management.
 */

export const getIncidents = () => {
  return apiClient.get('/api/ticketing/incidents');
};

export const getMyReportedIncidents = () => {
  return apiClient.get('/api/ticketing/incidents/my-reported');
};

export const getMyAssignedIncidents = () => {
  return apiClient.get('/api/ticketing/incidents/my-assigned');
};

export const getIncidentById = (id) => {
  return apiClient.get(`/api/ticketing/incidents/${id}`);
};

export const createIncident = (formData) => {
  return apiClient.post('/api/ticketing/incidents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateIncident = (id, payload) => {
  return apiClient.put(`/api/ticketing/incidents/${id}`, payload);
};

export const addComment = (id, message) => {
  return apiClient.post(`/api/ticketing/incidents/${id}/comments`, { message });
};

// For stats in Admin Dashboard
export const getIncidentStats = async () => {
  const res = await getIncidents();
  const incidents = res.data || [];
  
  return {
    data: {
      critical: incidents.filter(i => i.priority === 'CRITICAL').length,
      inProgress: incidents.filter(i => i.status === 'IN_PROGRESS').length,
      resolvedToday: incidents.filter(i => i.status === 'RESOLVED').length, // Simplified
      avgResolution: '4.2h' // Placeholder as it needs backend calculation
    }
  };
};
