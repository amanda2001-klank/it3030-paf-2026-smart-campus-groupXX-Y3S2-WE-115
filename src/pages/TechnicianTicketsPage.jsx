import React, { useEffect, useState } from 'react';
import { 
  getMyAssignedIncidents, 
  getIncidentById, 
  updateIncident, 
  addComment 
} from '../services/incidentService';
import { API_BASE_URL } from '../services/apiClient';
import LoadingSpinner from '../components/common/LoadingSpinner';
import IncidentStatusBadge from '../components/incident/IncidentStatusBadge';
import IncidentPriorityBadge from '../components/incident/IncidentPriorityBadge';
import EvidenceAttachments from '../components/incident/EvidenceAttachments';
import DiscussionSection from '../components/incident/DiscussionSection';

const TechnicianTicketsPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getMyAssignedIncidents();
      setIncidents(res.data || []);
      if (res.data && res.data.length > 0) {
        handleSelectIncident(res.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch assigned incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIncident = async (id) => {
    // Show basic info from list first
    const basicInfo = incidents.find(inc => inc.id === id);
    if (basicInfo) {
      setSelectedIncident(basicInfo);
    }

    try {
      const res = await getIncidentById(id);
      setSelectedIncident(res.data);
    } catch (error) {
      console.error('Failed to fetch incident details:', error);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedIncident) return;
    setUpdating(true);
    try {
      await updateIncident(selectedIncident.id, { 
        title: selectedIncident.title || 'Untitled Ticket',
        description: selectedIncident.description || 'No description provided',
        category: selectedIncident.category || 'TECHNICAL',
        priority: selectedIncident.priority || 'MEDIUM',
        assignedTechnicianId: selectedIncident.assignedTechnicianId,
        status 
      });
      setSelectedIncident(prev => ({ ...prev, status }));
      setIncidents(prev => prev.map(inc => inc.id === selectedIncident.id ? { ...inc, status } : inc));
    } catch (error) {
        console.error('Failed to update status:', error);
        const errorMsg = error.response?.data?.message || 'Please check if all fields are valid.';
        alert(`Failed to update status: ${errorMsg}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (!selectedIncident) return;
    try {
      const res = await addComment(selectedIncident.id, message);
      setSelectedIncident(prev => {
        const updated = { ...prev, discussion: res.data.discussion };
        // Update the list too so comments persist when switching tabs
        setIncidents(list => list.map(inc => inc.id === updated.id ? updated : inc));
        return updated;
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner label="Loading assigned tasks..." />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Technician Workspace</h1>
        <p className="mt-2 text-slate-600">Manage and update your assigned incident tickets.</p>
      </header>

      {incidents.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white p-20 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="mt-6 text-xl font-bold text-slate-800">No Assigned Tickets</h2>
          <p className="mt-2 text-slate-500">You don't have any tickets assigned to you at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2 space-y-8">
            <section className="rounded-3xl bg-white p-8 shadow-sm">
              <h3 className="mb-6 text-lg font-bold text-slate-800">My Assigned Tasks</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      <th className="rounded-l-xl px-6 py-4">ID</th>
                      <th className="px-6 py-4">TITLE</th>
                      <th className="px-6 py-4 text-center">PRIORITY</th>
                      <th className="px-6 py-4 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {incidents.map((inc) => (
                      <tr 
                        key={inc.id} 
                        onClick={() => handleSelectIncident(inc.id)}
                        className={`group cursor-pointer transition duration-200 hover:bg-blue-50/50 ${selectedIncident?.id === inc.id ? 'bg-blue-50/80' : ''}`}
                      >
                        <td className="px-6 py-6 text-xs font-bold text-slate-400">{inc.ticketNumber}</td>
                        <td className="px-6 py-6">
                          <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">{inc.title}</div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <IncidentPriorityBadge priority={inc.priority} />
                        </td>
                        <td className="px-6 py-6 text-center">
                          <IncidentStatusBadge status={inc.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <EvidenceAttachments 
              attachments={selectedIncident?.attachmentUrls?.map((url, index) => ({ 
                id: index, 
                path: url, 
                name: `Attachment ${index + 1}` 
              }))} 
            />
          </div>

          <div className="space-y-8">
            <section className="rounded-3xl bg-[#1D4ED8] p-8 text-white shadow-xl shadow-blue-200">
               <div className="flex items-start gap-4 mb-8">
                  <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">UPDATE PROGRESS</h3>
                    <p className="text-xs opacity-60">Status Management</p>
                  </div>
                </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest opacity-60">CURRENT STATUS</label>
                  <div className="relative">
                    <select 
                      value={selectedIncident?.status || ''}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="w-full appearance-none rounded-xl bg-white/10 px-5 py-4 text-sm font-bold backdrop-blur-md focus:bg-white/20 focus:outline-none border border-white/10"
                    >
                      <option value="OPEN" className="text-slate-800">OPEN</option>
                      <option value="IN_PROGRESS" className="text-slate-800">IN_PROGRESS</option>
                      <option value="RESOLVED" className="text-slate-800">RESOLVED</option>
                      <option value="CLOSED" className="text-slate-800">CLOSED</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            <div className="h-[400px]">
              <DiscussionSection 
                discussions={selectedIncident?.discussion} 
                onSendMessage={handleSendMessage}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianTicketsPage;
