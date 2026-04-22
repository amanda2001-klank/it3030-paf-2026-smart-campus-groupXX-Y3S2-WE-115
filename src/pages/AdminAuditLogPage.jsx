import React, { useEffect, useMemo, useState } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getAuditLogs, getAuditSummary } from '../services/adminAuditService';

const ACTION_OPTIONS = [
  '',
  'USER_CREATED',
  'USER_UPDATED',
  'USER_ROLE_UPDATED',
  'USER_DELETED',
  'BOOKING_APPROVED',
  'BOOKING_REJECTED',
  'ASSET_CREATED',
  'ASSET_UPDATED',
  'ASSET_DELETED',
  'ASSET_TYPE_CREATED',
  'ASSET_TYPE_UPDATED',
  'ASSET_TYPE_DELETED',
  'LOCATION_CREATED',
  'LOCATION_UPDATED',
  'LOCATION_DELETED',
];

const ENTITY_OPTIONS = ['', 'USER', 'BOOKING', 'ASSET', 'ASSET_TYPE', 'LOCATION'];

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

const normalizeLabel = (value) =>
  (value || 'UNKNOWN')
    .toLowerCase()
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

const AdminAuditLogPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total: 0, last24Hours: 0 });
  const [filters, setFilters] = useState({ action: '', entityType: '', limit: 50 });

  const loadAuditData = async (nextFilters = filters, { silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }

    setError('');

    try {
      const [logsResponse, summaryResponse] = await Promise.all([
        getAuditLogs(nextFilters),
        getAuditSummary(),
      ]);

      setItems(logsResponse.data || []);
      setSummary(summaryResponse.data || { total: 0, last24Hours: 0 });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Failed to load audit logs.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({
      ...prev,
      [name]: name === 'limit' ? Number(value) : value,
    }));
  };

  const handleApplyFilters = () => {
    loadAuditData(filters);
  };

  const humanizedLogs = useMemo(
    () => items.map((item) => ({ ...item, actionLabel: normalizeLabel(item.action), entityLabel: normalizeLabel(item.entityType) })),
    [items]
  );

  if (loading) {
    return <LoadingSpinner label="Loading admin audit logs..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 to-blue-900 p-8 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">Admin Governance</p>
          <h1 className="mt-2 text-3xl font-bold">Audit Trail</h1>
          <p className="mt-3 max-w-3xl text-sm text-blue-100">
            Track sensitive admin operations across users, bookings, and campus catalogue updates.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-blue-300/30 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-blue-100">Total Audit Events</p>
              <p className="mt-2 text-2xl font-bold text-white">{summary.total || 0}</p>
            </div>
            <div className="rounded-xl border border-blue-300/30 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-blue-100">Last 24 Hours</p>
              <p className="mt-2 text-2xl font-bold text-white">{summary.last24Hours || 0}</p>
            </div>
            <div className="rounded-xl border border-blue-300/30 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-wide text-blue-100">Displayed Records</p>
              <p className="mt-2 text-2xl font-bold text-white">{humanizedLogs.length}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label htmlFor="action" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Action
              </label>
              <select
                id="action"
                name="action"
                value={filters.action}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
              >
                {ACTION_OPTIONS.map((option) => (
                  <option key={option || 'all-actions'} value={option}>
                    {option ? normalizeLabel(option) : 'All Actions'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="entityType" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Entity
              </label>
              <select
                id="entityType"
                name="entityType"
                value={filters.entityType}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
              >
                {ENTITY_OPTIONS.map((option) => (
                  <option key={option || 'all-entities'} value={option}>
                    {option ? normalizeLabel(option) : 'All Entities'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="limit" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Limit
              </label>
              <select
                id="limit"
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
              >
                {[25, 50, 100, 150, 200].map((option) => (
                  <option key={option} value={option}>
                    {option} rows
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleApplyFilters}
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : null}

          {!error && humanizedLogs.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              No audit events found for the selected filters.
            </p>
          ) : null}

          {!error && humanizedLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-3">Time</th>
                    <th className="px-3 py-3">Action</th>
                    <th className="px-3 py-3">Entity</th>
                    <th className="px-3 py-3">Actor</th>
                    <th className="px-3 py-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {humanizedLogs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 align-top">
                      <td className="px-3 py-3 text-sm text-gray-700">{formatDateTime(log.createdAt)}</td>
                      <td className="px-3 py-3 text-sm font-medium text-slate-900">{log.actionLabel}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{log.entityLabel}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        <p className="font-medium text-gray-900">{log.actorName || 'Unknown Admin'}</p>
                        <p className="text-xs uppercase tracking-wide text-gray-500">{log.actorRole || 'Unknown'}</p>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">{log.details || 'No details provided.'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default AdminAuditLogPage;
