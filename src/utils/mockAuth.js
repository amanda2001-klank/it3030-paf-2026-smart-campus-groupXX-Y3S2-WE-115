const DEFAULT_MOCK_USER = {
  userId: 'asset-manager-001',
  userName: 'Mock Asset Manager',
  userRole: 'ASSET_MANAGER',
};

export const ensureMockUser = () => {
  if (typeof window === 'undefined') {
    return DEFAULT_MOCK_USER;
  }

  const storedUserId = localStorage.getItem('userId');
  const storedUserName = localStorage.getItem('userName');
  const storedUserRole = localStorage.getItem('userRole');

  if (!storedUserId) {
    localStorage.setItem('userId', DEFAULT_MOCK_USER.userId);
  }

  if (!storedUserName) {
    localStorage.setItem('userName', DEFAULT_MOCK_USER.userName);
  }

  if (!storedUserRole) {
    localStorage.setItem('userRole', DEFAULT_MOCK_USER.userRole);
  }

  return {
    userId: localStorage.getItem('userId') || DEFAULT_MOCK_USER.userId,
    userName: localStorage.getItem('userName') || DEFAULT_MOCK_USER.userName,
    userRole: localStorage.getItem('userRole') || DEFAULT_MOCK_USER.userRole,
  };
};

export const getMockUser = () => ensureMockUser();

export const canManageCatalogue = (role) =>
  ['ADMIN', 'ASSET_MANAGER'].includes((role || '').toUpperCase());

export const formatRoleLabel = (role) =>
  (role || '')
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Unknown Role';
