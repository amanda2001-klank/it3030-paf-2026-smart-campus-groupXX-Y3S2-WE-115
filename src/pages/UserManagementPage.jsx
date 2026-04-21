import React, { useEffect, useMemo, useState } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import {
  createUser,
  deleteUser,
  listUsers,
  updateUser,
  updateUserRole,
} from '../services/userManagementService';
import { formatRoleLabel, getCurrentUser, USER_ROLES } from '../utils/auth';

const ROLE_OPTIONS = Object.values(USER_ROLES);

const defaultCreateForm = {
  userName: '',
  email: '',
  password: '',
  role: USER_ROLES.USER,
};

const defaultEditForm = {
  userId: '',
  userName: '',
  email: '',
  role: USER_ROLES.USER,
  originalRole: USER_ROLES.USER,
};

const getErrorMessage = (error, fallbackMessage) => {
  if (!error?.response) {
    return 'Unable to reach the server. Make sure the backend is running on http://localhost:8080.';
  }

  if (error.response?.data?.fieldErrors?.length) {
    return error.response.data.fieldErrors.map((item) => item.message).join(' ');
  }

  return error.response?.data?.message || fallbackMessage;
};

const formatDateTime = (value) => {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const roleBadgeClass = (role) => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'border-red-200 bg-red-50 text-red-700';
    case USER_ROLES.ASSET_MANAGER:
      return 'border-indigo-200 bg-indigo-50 text-indigo-700';
    case USER_ROLES.TECHNICIAN:
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
};

const UserFormModal = ({
  title,
  actionLabel,
  loading,
  form,
  error,
  onClose,
  onSubmit,
  onChange,
  showPassword,
}) => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 px-4 py-8">
    <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">Use this form to configure account details and role access.</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100"
        >
          Close
        </button>
      </div>

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label htmlFor="userName" className="block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input
            id="userName"
            name="userName"
            value={form.userName}
            onChange={onChange}
            required
            maxLength={100}
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Enter full name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="user@example.com"
          />
        </div>

        {showPassword ? (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Temporary Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              required
              minLength={8}
              maxLength={72}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Minimum 8 characters"
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-slate-700">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={onChange}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {formatRoleLabel(role)}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Saving...' : actionLabel}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [editForm, setEditForm] = useState(defaultEditForm);
  const [formError, setFormError] = useState('');

  const currentUser = getCurrentUser();

  const roleCounts = useMemo(() => {
    return ROLE_OPTIONS.reduce(
      (counts, role) => ({
        ...counts,
        [role]: users.filter((user) => user.userRole === role).length,
      }),
      {}
    );
  }, [users]);

  const loadUsers = async (showLoader = true) => {
    if (showLoader) {
      setLoading(true);
    }

    setError('');

    try {
      const response = await listUsers();
      const items = response.data || [];
      setUsers(items);
      return items;
    } catch (listError) {
      setError(getErrorMessage(listError, 'Failed to load users.'));
      return [];
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadUsers(true);
  }, []);

  const handleCreateChange = (event) => {
    const { name, value } = event.target;
    setCreateForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleEditChange = (event) => {
    const { name, value } = event.target;
    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setFormError('');
    setCreateForm(defaultCreateForm);
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    if (actionLoading === 'create') {
      return;
    }
    setIsCreateOpen(false);
    setFormError('');
  };

  const openEditModal = (user) => {
    setFormError('');
    setEditForm({
      userId: user.userId,
      userName: user.userName || '',
      email: user.email || '',
      role: user.userRole || USER_ROLES.USER,
      originalRole: user.userRole || USER_ROLES.USER,
    });
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    if (actionLoading === 'edit') {
      return;
    }
    setIsEditOpen(false);
    setFormError('');
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setActionLoading('create');

    try {
      await createUser(createForm);
      await loadUsers(false);
      setIsCreateOpen(false);
      setCreateForm(defaultCreateForm);
      setToast({ type: 'success', message: 'User account created successfully.' });
    } catch (createError) {
      setFormError(getErrorMessage(createError, 'Failed to create user.'));
    } finally {
      setActionLoading('');
    }
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setActionLoading('edit');

    try {
      await updateUser(editForm.userId, {
        userName: editForm.userName,
        email: editForm.email,
      });

      if (editForm.role !== editForm.originalRole) {
        await updateUserRole(editForm.userId, editForm.role);
      }

      await loadUsers(false);
      setIsEditOpen(false);
      setEditForm(defaultEditForm);
      setToast({ type: 'success', message: 'User account updated successfully.' });
    } catch (editError) {
      setFormError(getErrorMessage(editError, 'Failed to update user.'));
    } finally {
      setActionLoading('');
    }
  };

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `Delete user ${user.userName || user.email}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(user.userId);

    try {
      await deleteUser(user.userId);
      await loadUsers(false);
      setToast({ type: 'success', message: 'User account deleted successfully.' });
    } catch (deleteError) {
      setToast({
        type: 'error',
        message: getErrorMessage(deleteError, 'Failed to delete user.'),
      });
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading user management..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-sky-900 to-slate-900 p-8 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-200">Administration</p>
          <h1 className="mt-3 text-3xl font-bold">User Management</h1>
          <p className="mt-3 max-w-3xl text-sm text-sky-100">
            Create accounts, edit user details, remove inactive users, and assign role-based access for the Smart Campus platform.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-6 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
          >
            Add New User
          </button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Admins</p>
            <p className="mt-3 text-3xl font-bold text-red-800">{roleCounts[USER_ROLES.ADMIN] || 0}</p>
          </article>
          <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Asset Managers</p>
            <p className="mt-3 text-3xl font-bold text-indigo-800">{roleCounts[USER_ROLES.ASSET_MANAGER] || 0}</p>
          </article>
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Technicians</p>
            <p className="mt-3 text-3xl font-bold text-amber-800">{roleCounts[USER_ROLES.TECHNICIAN] || 0}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Users</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{roleCounts[USER_ROLES.USER] || 0}</p>
          </article>
        </section>

        {error ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => loadUsers(true)}
              className="mt-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 hover:bg-red-100"
            >
              Retry
            </button>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td className="px-4 py-8 text-center text-sm text-gray-500" colSpan={6}>
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const isCurrentUser = user.userId === currentUser.userId;
                    const rowBusy = actionLoading === user.userId;

                    return (
                      <tr key={user.userId} className="border-b border-gray-100">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{user.userName || 'Unnamed User'}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{user.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${roleBadgeClass(
                              user.userRole
                            )}`}
                          >
                            {formatRoleLabel(user.userRole)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{formatRoleLabel(user.provider)}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{formatDateTime(user.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(user)}
                              disabled={rowBusy}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user)}
                              disabled={rowBusy || isCurrentUser}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              title={isCurrentUser ? 'You cannot delete your own account.' : 'Delete user'}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {isCreateOpen ? (
        <UserFormModal
          title="Create New User"
          actionLabel="Create User"
          loading={actionLoading === 'create'}
          form={createForm}
          error={formError}
          onClose={closeCreateModal}
          onSubmit={handleCreateSubmit}
          onChange={handleCreateChange}
          showPassword
        />
      ) : null}

      {isEditOpen ? (
        <UserFormModal
          title="Edit User"
          actionLabel="Save Changes"
          loading={actionLoading === 'edit'}
          form={editForm}
          error={formError}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
          onChange={handleEditChange}
          showPassword={false}
        />
      ) : null}

      {toast ? (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      ) : null}
    </div>
  );
};

export default UserManagementPage;
