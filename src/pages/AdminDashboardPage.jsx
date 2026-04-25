import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { getAuditLogs, getAuditSummary } from '../services/adminAuditService';
import * as bookingService from '../services/bookingService';
import { listAllAssets, searchAssets } from '../services/catalogService';
import { listUsers } from '../services/userManagementService';
import { getIncidents, getIncidentStats } from '../services/incidentService';

const formatDateTime = (value) => {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const sortByCreatedAtDesc = (left, right) => {
  const leftDate = new Date(left.createdAt || left.startTime || 0).getTime();
  const rightDate = new Date(right.createdAt || right.startTime || 0).getTime();
  return rightDate - leftDate;
};

const normalizeLabel = (value) =>
  (value || 'UNKNOWN')
    .toLowerCase()
    .split('_')
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [recentAuditEvents, setRecentAuditEvents] = useState([]);
  const [stats, setStats] = useState({
    totalAssets: 0,
    activeAssets: 0,
    bookableAssets: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    adminUsers: 0,
    technicianUsers: 0,
    auditEventsLast24Hours: 0,
    criticalIncidents: 0,
    inProgressIncidents: 0,
    resolvedIncidentsToday: 0,
  });

  const recentBookings = useMemo(
    () => [...bookings].sort(sortByCreatedAtDesc).slice(0, 6),
    [bookings]
  );

  const priorityIncidents = useMemo(
    () => [...incidents]
      .filter(i => i.priority === 'CRITICAL' || i.priority === 'HIGH')
      .filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED')
      .sort(sortByCreatedAtDesc)
      .slice(0, 6),
    [incidents]
  );

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        bookingsResponse,
        allAssetsResponse,
        activeAssetsResponse,
        bookableAssetsResponse,
        usersResponse,
        auditLogsResponse,
        auditSummaryResponse,
        incidentsResponse,
        incidentStatsResponse,
      ] = await Promise.all([
        bookingService.getAllBookings(),
        listAllAssets({ page: 0, size: 1 }),
        searchAssets({ status: 'ACTIVE', page: 0, size: 1 }),
        searchAssets({ isBookable: true, page: 0, size: 1 }),
        listUsers(),
        getAuditLogs({ limit: 6 }),
        getAuditSummary(),
        getIncidents(),
        getIncidentStats(),
      ]);

      const bookingItems = bookingsResponse.data || [];
      const incidentItems = incidentsResponse.data || [];
      const incidentStats = incidentStatsResponse.data || {};
      const users = usersResponse.data || [];
      const pendingBookings = bookingItems.filter((booking) => booking.status === 'PENDING').length;
      const approvedBookings = bookingItems.filter((booking) => booking.status === 'APPROVED').length;
      const adminUsers = users.filter((user) => user.role === 'ADMIN').length;
      const technicianUsers = users.filter((user) => user.role === 'TECHNICIAN').length;

      setBookings(bookingItems);
      setRecentAuditEvents(auditLogsResponse.data || []);
      setStats({
        totalAssets: allAssetsResponse.data?.totalElements || 0,
        activeAssets: activeAssetsResponse.data?.totalElements || 0,
        bookableAssets: bookableAssetsResponse.data?.totalElements || 0,
        totalBookings: bookingItems.length,
        pendingBookings,
        approvedBookings,
        totalUsers: users.length,
        adminUsers,
        technicianUsers,
        auditEventsLast24Hours: auditSummaryResponse.data?.last24Hours || 0,
        criticalIncidents: incidentStats.critical || 0,
        inProgressIncidents: incidentStats.inProgress || 0,
        resolvedIncidentsToday: incidentStats.resolvedToday || 0,
      });
      setIncidents(incidentItems);
    } catch (dashboardError) {
      if (dashboardError?.response?.status === 403) {
        navigate('/bookings', { replace: true });
        return;
      }

      const message = dashboardError?.response?.data?.message;
      setError(message || 'Failed to load admin dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading admin dashboard..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-red-700">Unable to load dashboard</h1>
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={loadDashboard}
            className="mt-6 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="space-y-8">
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 p-8 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">Admin Command Center</p>
          <h1 className="mt-3 text-3xl font-bold">Smart Campus Operations Overview</h1>
          <p className="mt-3 max-w-3xl text-sm text-blue-100">
            Monitor booking demand, track asset availability, and jump to high-priority admin workflows.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
            >
              Incident Queue
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/audit-logs')}
              className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              View Audit Trail
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Critical Incidents</p>
            <p className="mt-3 text-3xl font-bold text-rose-800">{stats.criticalIncidents}</p>
          </article>
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">In Progress</p>
            <p className="mt-3 text-3xl font-bold text-amber-800">{stats.inProgressIncidents}</p>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Resolved Today</p>
            <p className="mt-3 text-3xl font-bold text-emerald-800">{stats.resolvedIncidentsToday}</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Avg Resolution</p>
            <p className="mt-3 text-3xl font-bold text-gray-900">4.2h</p>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Assets</p>
            <p className="mt-3 text-3xl font-bold text-gray-900">{stats.totalAssets}</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Active Assets</p>
            <p className="mt-3 text-3xl font-bold text-green-700">{stats.activeAssets}</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Bookable Assets</p>
            <p className="mt-3 text-3xl font-bold text-blue-700">{stats.bookableAssets}</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Bookings</p>
            <p className="mt-3 text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
          </article>
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending Approvals</p>
            <p className="mt-3 text-3xl font-bold text-amber-800">{stats.pendingBookings}</p>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Approved Bookings</p>
            <p className="mt-3 text-3xl font-bold text-emerald-800">{stats.approvedBookings}</p>
          </article>
          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Users</p>
            <p className="mt-3 text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          </article>
          <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Admin Accounts</p>
            <p className="mt-3 text-3xl font-bold text-blue-800">{stats.adminUsers}</p>
          </article>
          <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Technician Accounts</p>
            <p className="mt-3 text-3xl font-bold text-indigo-800">{stats.technicianUsers}</p>
          </article>
          <article className="rounded-2xl border border-purple-200 bg-purple-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">Audit Events (24h)</p>
            <p className="mt-3 text-3xl font-bold text-purple-800">{stats.auditEventsLast24Hours}</p>
          </article>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Priority Incident Queue</h2>
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100"
            >
              View All Incidents
            </button>
          </div>

          {priorityIncidents.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              No high-priority incidents in the queue.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-3">Incident</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Reported At</th>
                  </tr>
                </thead>
                <tbody>
                  {priorityIncidents.map((incident) => (
                    <tr key={incident.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-gray-900">{incident.title}</p>
                        <p className="text-xs text-gray-500">Reported by: {incident.reportedByName || 'Unknown'}</p>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700">{incident.category}</td>
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                          {incident.priority}
                        </span>
                      </td>
                      <td className="px-3 py-3"><StatusBadge status={incident.status} /></td>
                      <td className="px-3 py-3 text-sm text-gray-700">{formatDateTime(incident.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Booking Requests</h2>
            <button
              type="button"
              onClick={() => navigate('/admin/bookings')}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-700 hover:bg-gray-100"
            >
              View All
            </button>
          </div>

          {recentBookings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
              No bookings found yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-3">Resource</th>
                    <th className="px-3 py-3">Requested By</th>
                    <th className="px-3 py-3">Created</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((booking) => (
                    <tr key={booking.id} className="border-b border-gray-100">
                      <td className="px-3 py-3 text-sm font-medium text-gray-900">{booking.resourceName}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{booking.requestedByName || 'Unknown User'}</td>
                      <td className="px-3 py-3 text-sm text-gray-700">{formatDateTime(booking.createdAt)}</td>
                      <td className="px-3 py-3"><StatusBadge status={booking.status} /></td>
                      <td className="px-3 py-3 text-sm text-gray-700">
                        {booking.purpose?.length > 60 ? `${booking.purpose.slice(0, 60)}...` : booking.purpose}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
