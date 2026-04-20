import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AssetCataloguePage from './pages/AssetCataloguePage';
import AssetDetailPage from './pages/AssetDetailPage';
import AssetListPage from './pages/AssetListPage';
import AssetListDetailPage from './pages/AssetListDetailPage';
import AdminBookingPage from './pages/AdminBookingPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LoginPage from './pages/LoginPage';
import PlaceholderPage from './pages/PlaceholderPage';
import RegisterPage from './pages/RegisterPage';
import UserBookingPage from './pages/UserBookingPage';
import { getCurrentUser, hasAnyRole, isAdmin, isAuthenticated, USER_ROLES } from './utils/auth';

const ALL_AUTH_ROLES = Object.values(USER_ROLES);
const MANAGER_ROLES = [USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER];

const getDefaultPathForRole = (role) => {
  if (isAdmin(role)) {
    return '/dashboard';
  }

  if (hasAnyRole(role, MANAGER_ROLES)) {
    return '/assets';
  }

  return '/bookings';
};

const PublicOnlyRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to={getDefaultPathForRole(getCurrentUser().userRole)} replace />;
  }

  return children;
};

const PrivateRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const RoleRoute = ({ allowedRoles, children }) => {
  const currentUser = getCurrentUser();

  if (!hasAnyRole(currentUser.userRole, allowedRoles)) {
    return <Navigate to={getDefaultPathForRole(currentUser.userRole)} replace />;
  }

  return children;
};

const ProtectedShell = () => {
  const defaultPath = getDefaultPathForRole(getCurrentUser().userRole);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 min-w-0 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to={defaultPath} replace />} />

          <Route
            path="/dashboard"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AdminDashboardPage />
              </RoleRoute>
            }
          />

          <Route
            path="/assets"
            element={
              <RoleRoute allowedRoles={MANAGER_ROLES}>
                <AssetCataloguePage />
              </RoleRoute>
            }
          />
          <Route
            path="/assets/:assetId"
            element={
              <RoleRoute allowedRoles={MANAGER_ROLES}>
                <AssetDetailPage />
              </RoleRoute>
            }
          />

          <Route
            path="/asset-list"
            element={
              <RoleRoute allowedRoles={ALL_AUTH_ROLES}>
                <AssetListPage />
              </RoleRoute>
            }
          />
          <Route
            path="/asset-list/:assetId"
            element={
              <RoleRoute allowedRoles={ALL_AUTH_ROLES}>
                <AssetListDetailPage />
              </RoleRoute>
            }
          />

          <Route
            path="/bookings"
            element={
              <RoleRoute allowedRoles={ALL_AUTH_ROLES}>
                <UserBookingPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AdminBookingPage />
              </RoleRoute>
            }
          />

          <Route
            path="/tickets"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <PlaceholderPage
                  title="Incident Tickets"
                  description="Ticketing workflows can be added here with role-based triage and technician assignment."
                />
              </RoleRoute>
            }
          />
          <Route
            path="/users"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <PlaceholderPage
                  title="User Management"
                  description="User administration route is protected for admins and ready for role management features."
                />
              </RoleRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <PlaceholderPage
                  title="Settings"
                  description="System-wide settings route is protected for admins and available for configuration modules."
                />
              </RoleRoute>
            }
          />

          <Route path="*" element={<Navigate to={defaultPath} replace />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <ProtectedShell />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
