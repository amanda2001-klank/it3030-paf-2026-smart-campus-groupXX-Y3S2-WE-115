const AUTH_STORAGE_KEY = 'smartCampusAuth';
const AUTH_TOKEN_KEY = 'authToken';

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  ASSET_MANAGER: 'ASSET_MANAGER',
  TECHNICIAN: 'TECHNICIAN',
};

const EMPTY_USER = {
  userId: '',
  userName: '',
  email: '',
  userRole: 'USER',
  avatarUrl: '',
};

const isBrowser = () => typeof window !== 'undefined';

const parseJSON = (value) => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

export const getAuthState = () => {
  if (!isBrowser()) {
    return null;
  }

  const stored = parseJSON(localStorage.getItem(AUTH_STORAGE_KEY));
  if (stored?.token && stored?.user?.userId) {
    return stored;
  }

  const legacyUserId = localStorage.getItem('userId');
  const legacyUserName = localStorage.getItem('userName');
  const legacyUserRole = localStorage.getItem('userRole');
  const legacyToken = localStorage.getItem(AUTH_TOKEN_KEY);

  if (legacyToken && legacyUserId) {
    return {
      token: legacyToken,
      expiresAt: null,
      user: {
        userId: legacyUserId,
        userName: legacyUserName || '',
        userRole: legacyUserRole || 'USER',
        email: '',
        avatarUrl: '',
      },
    };
  }

  return null;
};

export const setAuthState = (authResponse) => {
  if (!isBrowser() || !authResponse?.token || !authResponse?.user?.userId) {
    return;
  }

  const normalizedState = {
    token: authResponse.token,
    expiresAt: authResponse.expiresAt || null,
    user: {
      userId: authResponse.user.userId,
      userName: authResponse.user.userName || '',
      email: authResponse.user.email || '',
      userRole: authResponse.user.userRole || 'USER',
      avatarUrl: authResponse.user.avatarUrl || '',
    },
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalizedState));
  localStorage.setItem(AUTH_TOKEN_KEY, normalizedState.token);
  localStorage.setItem('userId', normalizedState.user.userId);
  localStorage.setItem('userName', normalizedState.user.userName);
  localStorage.setItem('userRole', normalizedState.user.userRole);
};

export const clearAuthState = () => {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('userRole');
};

export const getCurrentUser = () => {
  const state = getAuthState();
  return state?.user || EMPTY_USER;
};

export const getAuthToken = () => {
  const state = getAuthState();
  if (state?.token) {
    return state.token;
  }

  if (!isBrowser()) {
    return '';
  }

  return localStorage.getItem(AUTH_TOKEN_KEY) || '';
};

export const isAuthenticated = () => {
  const state = getAuthState();
  if (!state?.token || !state?.user?.userId) {
    return false;
  }

  if (!state.expiresAt) {
    return true;
  }

  return Number(state.expiresAt) > Date.now();
};

export const normalizeRole = (role) => (role || '').toUpperCase();

export const ROLE_DASHBOARD_PATHS = {
  [USER_ROLES.ADMIN]: '/dashboard/admin',
  [USER_ROLES.ASSET_MANAGER]: '/dashboard/asset-manager',
  [USER_ROLES.TECHNICIAN]: '/dashboard/technician',
  [USER_ROLES.USER]: '/dashboard/user',
};

export const getDashboardPathForRole = (role) => {
  const normalizedRole = normalizeRole(role);
  return ROLE_DASHBOARD_PATHS[normalizedRole] || ROLE_DASHBOARD_PATHS[USER_ROLES.USER];
};

export const hasRole = (role, expectedRole) =>
  normalizeRole(role) === normalizeRole(expectedRole);

export const hasAnyRole = (role, roles = []) =>
  roles.some((candidateRole) => hasRole(role, candidateRole));

export const canManageCatalogue = (role) =>
  hasAnyRole(role, [USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER]);

export const isAdmin = (role) => hasRole(role, USER_ROLES.ADMIN);

export const formatRoleLabel = (role) =>
  (role || '')
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
