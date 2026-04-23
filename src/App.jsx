import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import AssetManagerDashboardPage from './pages/AssetManagerDashboardPage';
import AssetCataloguePage from './pages/AssetCataloguePage';
import AssetDetailPage from './pages/AssetDetailPage';
import AssetListPage from './pages/AssetListPage';
import AssetListDetailPage from './pages/AssetListDetailPage';
import AdminBookingPage from './pages/AdminBookingPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminAuditLogPage from './pages/AdminAuditLogPage';
import LoginPage from './pages/LoginPage';
import PlaceholderPage from './pages/PlaceholderPage';
import RegisterPage from './pages/RegisterPage';
import TechnicianDashboardPage from './pages/TechnicianDashboardPage';
import UserBookingPage from './pages/UserBookingPage';
import UserDashboardPage from './pages/UserDashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import IncidentTicketsPage from './pages/IncidentTicketsPage';
import RaiseTicketPage from './pages/RaiseTicketPage';
import MyTicketsPage from './pages/MyTicketsPage';
import TechnicianTicketsPage from './pages/TechnicianTicketsPage';
import {
  getCurrentUser,
  getDashboardPathForRole,
  hasAnyRole,
  isAuthenticated,
  USER_ROLES,
} from './utils/auth';

const ALL_AUTH_ROLES = Object.values(USER_ROLES);
const MANAGER_ROLES = [USER_ROLES.ADMIN, USER_ROLES.ASSET_MANAGER];

const getDefaultPathForRole = (role) => getDashboardPathForRole(role);

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
              <RoleRoute allowedRoles={ALL_AUTH_ROLES}>
                <Navigate to={defaultPath} replace />
              </RoleRoute>
            }
          />

          <Route
            path="/dashboard/admin"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AdminDashboardPage />
              </RoleRoute>
            }
          />

          <Route
            path="/dashboard/asset-manager"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ASSET_MANAGER]}>
                <AssetManagerDashboardPage />
              </RoleRoute>
            }
          />

          <Route
            path="/dashboard/technician"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.TECHNICIAN]}>
                <TechnicianDashboardPage />
              </RoleRoute>
            }
          />

          <Route
            path="/dashboard/user"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.USER]}>
                <UserDashboardPage />
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
              <RoleRoute allowedRoles={[USER_ROLES.USER]}>
                <AssetListPage />
              </RoleRoute>
            }
          />
          <Route
            path="/asset-list/:assetId"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.USER]}>
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
                <IncidentTicketsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/tickets/raise"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}>
                <RaiseTicketPage />
              </RoleRoute>
            }
          />
          <Route
            path="/tickets/my"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.USER, USER_ROLES.ADMIN]}>
                <MyTicketsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/dashboard/technician/tickets"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.TECHNICIAN, USER_ROLES.ADMIN]}>
                <TechnicianTicketsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AdminAuditLogPage />
              </RoleRoute>
            }
          />
          <Route
            path="/users"
            element={
              <RoleRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <UserManagementPage />
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
