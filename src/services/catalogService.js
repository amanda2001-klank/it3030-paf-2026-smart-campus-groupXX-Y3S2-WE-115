import apiClient from './apiClient';

const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null)
  );

const buildAssetFormData = (payload) => {
  const formData = new FormData();

  formData.append('assetCode', payload.assetCode);
  formData.append('assetName', payload.assetName);
  formData.append('assetTypeId', payload.assetTypeId);

  if (payload.locationId) {
    formData.append('locationId', payload.locationId);
  }

  if (payload.capacity !== '' && payload.capacity !== undefined && payload.capacity !== null) {
    formData.append('capacity', String(payload.capacity));
  }

  if (payload.description) {
    formData.append('description', payload.description);
  }

  formData.append('status', payload.status);
  formData.append('isBookable', String(Boolean(payload.isBookable)));

  if (payload.removeMediaIds?.length) {
    formData.append('removeMediaIds', payload.removeMediaIds.join(','));
  }

  (payload.files || []).forEach((file) => {
    formData.append('files', file);
  });

  return formData;
};

export const listLocations = (params) =>
  apiClient.get('/api/catalog/locations', { params: cleanParams(params) });

export const getLocationById = (id) => apiClient.get(`/api/catalog/locations/${id}`);

export const createLocation = (payload) => apiClient.post('/api/catalog/locations', payload);

export const updateLocation = (id, payload) =>
  apiClient.put(`/api/catalog/locations/${id}`, payload);

export const deleteLocation = (id) => apiClient.delete(`/api/catalog/locations/${id}`);

export const listAssetTypes = (params) =>
  apiClient.get('/api/catalog/asset-types', { params: cleanParams(params) });

export const getAssetTypeById = (id) => apiClient.get(`/api/catalog/asset-types/${id}`);

export const createAssetType = (payload) => apiClient.post('/api/catalog/asset-types', payload);

export const updateAssetType = (id, payload) =>
  apiClient.put(`/api/catalog/asset-types/${id}`, payload);

export const deleteAssetType = (id) => apiClient.delete(`/api/catalog/asset-types/${id}`);

export const listAllAssets = (params) =>
  apiClient.get('/api/catalog/assets/all', { params: cleanParams(params) });

export const searchAssets = (params) =>
  apiClient.get('/api/catalog/assets', { params: cleanParams(params) });

export const getAssetById = (id) => apiClient.get(`/api/catalog/assets/${id}`);

export const createAsset = (payload) =>
  apiClient.post('/api/catalog/assets', buildAssetFormData(payload), {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const updateAsset = (id, payload) =>
  apiClient.put(`/api/catalog/assets/${id}`, buildAssetFormData(payload), {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const deleteAsset = (id) => apiClient.delete(`/api/catalog/assets/${id}`);
