import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import IncidentStatusBadge from '../components/incident/IncidentStatusBadge';
import IncidentPriorityBadge from '../components/incident/IncidentPriorityBadge';
import * as incidentService from '../services/incidentService';

const MyTicketsPage = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ id: '', title: '', priority: '', description: '', category: '' });
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    try {
      const res = await incidentService.getMyReportedIncidents();
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

  const handleOpenEdit = (ticket) => {
    setEditData({
      id: ticket.id,
      title: ticket.title,
      priority: ticket.priority,
      description: ticket.description,
      category: ticket.category
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    setUpdating(true);
    try {
      await incidentService.updateIncident(editData.id, editData);
      setTickets(prev => prev.map(inc => inc.id === editData.id ? { ...inc, ...editData } : inc));
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update ticket:', error);
      alert('Failed to update ticket.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ticket? This action cannot be undone.')) return;
    
    try {
      await incidentService.deleteIncident(id);
      setTickets(tickets.filter(t => t.id !== id));
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      alert('Failed to delete ticket. Tickets can only be deleted while their status is OPEN.');
    }
  };

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
            <div key={ticket.id} className="flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-xs font-bold text-slate-400">{ticket.ticketNumber}</div>
                  <div>
                    <h3 className="font-bold text-slate-800">{ticket.title}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{ticket.category}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Reported on {new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <IncidentPriorityBadge priority={ticket.priority} />
                  <IncidentStatusBadge status={ticket.status} />
                  <div className="h-8 w-[1px] bg-gray-100"></div>
                  <div className="text-right min-w-[120px]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ASSIGNED TO</p>
                    <p className="text-xs font-bold text-slate-700">{ticket.assignedTechnicianName || 'Pending'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-50 pt-4">
                {ticket.status === 'OPEN' && (
                  <>
                    <button
                      onClick={() => handleOpenEdit(ticket)}
                      className="rounded-lg px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition"
                    >
                      Edit Ticket
                    </button>
                    <button
                      onClick={() => handleDelete(ticket.id)}
                      className="rounded-lg px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
                    >
                      Delete
                    </button>
                  </>
                )}
                <button
                  onClick={() => navigate(`/tickets/my/${ticket.id}`)}
                  className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  View Details & Discussion
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Edit Ticket Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Title</label>
                <input 
                  type="text" 
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                  <select 
                    value={editData.category}
                    onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="FACILITIES">FACILITIES</option>
                    <option value="EQUIPMENT">EQUIPMENT</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Priority</label>
                  <select 
                    value={editData.priority}
                    onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Description</label>
                <textarea 
                  rows={4}
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-8 flex gap-4">
              <button 
                onClick={() => setShowEditModal(false)}
                className="flex-1 rounded-xl bg-slate-100 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={updating}
                className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTicketsPage;
