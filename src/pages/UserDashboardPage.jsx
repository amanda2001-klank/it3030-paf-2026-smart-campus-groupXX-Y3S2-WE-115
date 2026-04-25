import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getMyBookings } from '../services/bookingService';
import { listAllAssets, searchAssets } from '../services/catalogService';
import { getMyReportedIncidents } from '../services/incidentService';
import StatusBadge from '../components/StatusBadge';

const UserDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalAssets: 0,
    bookableAssets: 0,
    myBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    totalTickets: 0,
    openTickets: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [allAssetsResponse, bookableAssetsResponse, myBookingsResponse, myIncidentsResponse] = await Promise.all([
        listAllAssets({ page: 0, size: 1 }),
        searchAssets({ isBookable: true, page: 0, size: 1 }),
        getMyBookings(),
        getMyReportedIncidents(),
      ]);

      const bookingItems = myBookingsResponse.data || [];
      const incidentItems = myIncidentsResponse.data || [];

      setStats({
        totalAssets: allAssetsResponse.data?.totalElements || 0,
        bookableAssets: bookableAssetsResponse.data?.totalElements || 0,
        myBookings: bookingItems.length,
        pendingBookings: bookingItems.filter((item) => item.status === 'PENDING').length,
        approvedBookings: bookingItems.filter((item) => item.status === 'APPROVED').length,
        totalTickets: incidentItems.length,
        openTickets: incidentItems.filter((item) => item.status !== 'RESOLVED' && item.status !== 'CLOSED').length,
      });

      // Set recent bookings (newest first)
      setRecentBookings(
        [...bookingItems]
          .sort((a, b) => new Date(b.createdAt || b.startTime) - new Date(a.createdAt || a.startTime))
          .slice(0, 5)
      );

      // Set recent tickets
      setRecentTickets(
        [...incidentItems]
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
      );
    } catch (dashboardError) {
      const message = dashboardError?.response?.data?.message;
      setError(message || 'Failed to load user dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading your dashboard..." />;
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
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">Personal Workspace</p>
          <h1 className="mt-3 text-3xl font-bold">Welcome to Smart Campus</h1>
          <p className="mt-3 max-w-3xl text-sm text-blue-100">
            Browse available spaces, create booking requests, and track approvals from one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/asset-list')}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Explore Assets
            </button>
            <button
              type="button"
              onClick={() => navigate('/bookings')}
              className="rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Manage My Bookings
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Total Assets</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stats.totalAssets}</p>
          </article>
          <article className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Bookable Assets</p>
            <p className="mt-3 text-3xl font-bold text-blue-800">{stats.bookableAssets}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">My Total Bookings</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stats.myBookings}</p>
          </article>
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Pending Bookings</p>
            <p className="mt-3 text-3xl font-bold text-amber-800">{stats.pendingBookings}</p>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Approved Bookings</p>
            <p className="mt-3 text-3xl font-bold text-emerald-800">{stats.approvedBookings}</p>
          </article>
          <article className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Total Tickets</p>
            <p className="mt-3 text-3xl font-bold text-indigo-800">{stats.totalTickets}</p>
          </article>
          <article className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Open Tickets</p>
            <p className="mt-3 text-3xl font-bold text-rose-800">{stats.openTickets}</p>
          </article>
        </section>

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Recent Bookings</h2>
              <button
                type="button"
                onClick={() => navigate('/bookings')}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>

            {recentBookings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
                <p className="text-slate-500">No recent bookings to display.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">{booking.resourceName}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(booking.startTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                          booking.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : booking.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Recent Tickets</h2>
              <button
                type="button"
                onClick={() => navigate('/tickets/my')}
                className="text-sm font-semibold text-rose-600 hover:text-rose-700"
              >
                View My Tickets
              </button>
            </div>

            {recentTickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-12 text-center">
                <p className="text-slate-500">No recent tickets to display.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:bg-slate-100"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="truncate font-semibold text-slate-900">{ticket.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {' \u2022 '}
                        {ticket.category}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={ticket.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserDashboardPage;
