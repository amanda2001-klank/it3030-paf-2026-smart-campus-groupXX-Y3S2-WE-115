import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyReportedIncidents } from '../services/incidentService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import IncidentStatusBadge from '../components/incident/IncidentStatusBadge';
import IncidentPriorityBadge from '../components/incident/IncidentPriorityBadge';

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await getMyReportedIncidents();
      setTickets(res.data || []);
    } catch (error) {
      console.error('Failed to fetch my tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner label="Loading your tickets..." />;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Incident Tickets</h1>
          <p className="mt-2 text-slate-500">Track the status of issues you've reported.</p>
        </div>
        <button
          onClick={() => navigate('/tickets/raise')}
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-95"
        >
          Raise New Ticket
        </button>
      </header>

      {tickets.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-20 text-center">
          <h2 className="text-xl font-bold text-slate-800">No Tickets Yet</h2>
          <p className="mt-2 text-slate-500">You haven't reported any incidents yet.</p>
          <button
            onClick={() => navigate('/tickets/raise')}
            className="mt-6 text-sm font-bold text-blue-600 hover:underline"
          >
            Raise your first ticket
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-6">
                <div className="text-xs font-bold text-slate-400">{ticket.ticketNumber}</div>
                <div>
                  <h3 className="font-bold text-slate-800">{ticket.title}</h3>
                  <p className="text-xs text-slate-500">Reported on {new Date(ticket.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <IncidentPriorityBadge priority={ticket.priority} />
                <IncidentStatusBadge status={ticket.status} />
                <div className="h-8 w-[1px] bg-gray-100"></div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ASSIGNED TO</p>
                  <p className="text-xs font-bold text-slate-700">{ticket.assignedTechnicianName || 'Pending Assignment'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;
