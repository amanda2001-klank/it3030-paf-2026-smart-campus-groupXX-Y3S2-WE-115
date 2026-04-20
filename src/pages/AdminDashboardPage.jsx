import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import * as bookingService from '../services/bookingService';
import { listAllAssets, searchAssets } from '../services/catalogService';

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

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalAssets: 0,
    activeAssets: 0,
    bookableAssets: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
  });

  const recentBookings = useMemo(
    () => [...bookings].sort(sortByCreatedAtDesc).slice(0, 6),
    [bookings]
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
      ] = await Promise.all([
        bookingService.getAllBookings(),
        listAllAssets({ page: 0, size: 1 }),
        searchAssets({ status: 'ACTIVE', page: 0, size: 1 }),
        searchAssets({ isBookable: true, page: 0, size: 1 }),
      ]);

      const bookingItems = bookingsResponse.data || [];
      const pendingBookings = bookingItems.filter((booking) => booking.status === 'PENDING').length;
      const approvedBookings = bookingItems.filter((booking) => booking.status === 'APPROVED').length;

      setBookings(bookingItems);
      setStats({
        totalAssets: allAssetsResponse.data?.totalElements || 0,
        activeAssets: activeAssetsResponse.data?.totalElements || 0,
        bookableAssets: bookableAssetsResponse.data?.totalElements || 0,
        totalBookings: bookingItems.length,
        pendingBookings,
        approvedBookings,
      });
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
              onClick={() => navigate('/admin/bookings')}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Review Booking Queue
            </button>
            <button
              type="button"
              onClick={() => navigate('/assets')}
              className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Manage Asset Catalogue
            </button>
          </div>
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
