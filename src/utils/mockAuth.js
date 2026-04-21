import { canManageCatalogue, formatRoleLabel, getCurrentUser } from './auth';

const FALLBACK_USER = {
  userId: '',
  userName: '',
  userRole: 'USER',
};

export const ensureMockUser = () => getCurrentUser() || FALLBACK_USER;

export const getMockUser = () => ensureMockUser();

export { canManageCatalogue, formatRoleLabel };
