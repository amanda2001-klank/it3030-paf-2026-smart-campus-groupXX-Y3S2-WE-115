import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getMyBookings } from '../services/bookingService';
import { searchAssets } from '../services/catalogService';
import { getMyAssignedIncidents } from '../services/incidentService';
import StatusBadge from '../components/StatusBadge';

const TechnicianDashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    myBookings: 0,
    assignedTickets: 0,
    criticalTickets: 0,
    resolvedToday: 0,
  });
  const [workQueue, setWorkQueue] = useState([]);

  const loadDashboard = async () => {
    setLoading(true);
    setError('');

    try {
      const [maintenanceResponse, outOfServiceResponse, myBookingsResponse, myAssignedIncidentsResponse] = await Promise.all([
        searchAssets({ status: 'MAINTENANCE', page: 0, size: 1 }),
        searchAssets({ status: 'OUT_OF_SERVICE', page: 0, size: 1 }),
        getMyBookings(),
        getMyAssignedIncidents(),
      ]);

      const bookingItems = myBookingsResponse.data || [];
      const incidentItems = myAssignedIncidentsResponse.data || [];

      setStats({
        maintenanceAssets: maintenanceResponse.data?.totalElements || 0,
        outOfServiceAssets: outOfServiceResponse.data?.totalElements || 0,
        myBookings: bookingItems.length,
        assignedTickets: incidentItems.filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length,
        criticalTickets: incidentItems.filter(i => i.priority === 'CRITICAL' && i.status !== 'RESOLVED').length,
        resolvedToday: incidentItems.filter(i => i.status === 'RESOLVED').length, // Simplified
      });

      setWorkQueue(
        [...incidentItems]
          .filter(i => i.status !== 'RESOLVED' && i.status !== 'CLOSED')
          .sort((a, b) => {
            const priorityMap = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            return priorityMap[a.priority] - priorityMap[b.priority];
          })
          .slice(0, 6)
      );
    } catch (dashboardError) {
      const message = dashboardError?.response?.data?.message;
      setError(message || 'Failed to load technician dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading technician dashboard..." />;
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
        <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-amber-900 to-slate-900 p-8 text-white shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">Technician Console</p>
          <h1 className="mt-3 text-3xl font-bold">Service and Availability Dashboard</h1>
          <p className="mt-3 max-w-3xl text-sm text-amber-100">
            Track maintenance-sensitive assets, monitor your booking activity, and keep key spaces operational.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/asset-list')}
              className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              View Asset List
            </button>
            <button
              type="button"
              onClick={() => navigate('/bookings')}
              className="rounded-xl border border-amber-200 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
            >
              View My Bookings
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700">Assigned Tickets</p>
            <p className="mt-3 text-3xl font-bold text-rose-800">{stats.assignedTickets}</p>
          </article>
          <article className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Critical Priority</p>
            <p className="mt-3 text-3xl font-bold text-red-800">{stats.criticalTickets}</p>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Resolved Today</p>
            <p className="mt-3 text-3xl font-bold text-emerald-800">{stats.resolvedToday}</p>
          </article>
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Maintenance Assets</p>
            <p className="mt-3 text-3xl font-bold text-amber-800">{stats.maintenanceAssets}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">My Total Bookings</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stats.myBookings}</p>
          </article>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Work Queue</h2>
            <button
              type="button"
              onClick={() => navigate('/dashboard/technician/tickets')}
              className="text-sm font-semibold text-amber-600 hover:text-amber-700"
            >
              View Full Queue
            </button>
          </div>

          {workQueue.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-12 text-center">
              <p className="text-gray-500">No active tickets assigned to you.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workQueue.map((ticket) => (
                <article
                  key={ticket.id}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-gray-50 p-5 transition hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate('/dashboard/technician/tickets')}
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        ticket.priority === 'CRITICAL'
                          ? 'bg-red-100 text-red-700'
                          : ticket.priority === 'HIGH'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {ticket.priority}
                    </span>
                    <StatusBadge status={ticket.status} />
                  </div>
                  <h3 className="font-semibold text-gray-900 line-clamp-1">{ticket.title}</h3>
                  <p className="mt-2 flex-1 text-xs text-gray-600 line-clamp-2">{ticket.description}</p>
                  <div className="mt-4 border-t border-gray-200 pt-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">
                      Reported: {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TechnicianDashboardPage;
