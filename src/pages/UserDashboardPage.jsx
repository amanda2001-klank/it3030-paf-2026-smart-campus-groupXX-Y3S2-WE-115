import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getMyBookings } from '../services/bookingService';
import { listAllAssets, searchAssets } from '../services/catalogService';

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
  });

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [allAssetsResponse, bookableAssetsResponse, myBookingsResponse] = await Promise.all([
        listAllAssets({ page: 0, size: 1 }),
        searchAssets({ isBookable: true, page: 0, size: 1 }),
        getMyBookings(),
      ]);

      const bookingItems = myBookingsResponse.data || [];

      setStats({
        totalAssets: allAssetsResponse.data?.totalElements || 0,
        bookableAssets: bookableAssetsResponse.data?.totalElements || 0,
        myBookings: bookingItems.length,
        pendingBookings: bookingItems.filter((item) => item.status === 'PENDING').length,
        approvedBookings: bookingItems.filter((item) => item.status === 'APPROVED').length,
      });
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
        </section>
      </div>
    </div>
  );
};

export default UserDashboardPage;
