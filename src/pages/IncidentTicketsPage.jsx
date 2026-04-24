import React, { useEffect, useState } from 'react';
import { 
  getIncidents, 
  getIncidentById, 
  getIncidentStats, 
  updateIncident, 
  addComment 
} from '../services/incidentService';
import { API_BASE_URL } from '../services/apiClient';
import LoadingSpinner from '../components/common/LoadingSpinner';
import IncidentStatusBadge from '../components/incident/IncidentStatusBadge';
import IncidentPriorityBadge from '../components/incident/IncidentPriorityBadge';
import EvidenceAttachments from '../components/incident/EvidenceAttachments';
import DiscussionSection from '../components/incident/DiscussionSection';

const StatsCard = ({ label, value, colorClass }) => (
  <div className={`flex flex-col rounded-2xl border-l-4 ${colorClass} bg-white p-6 shadow-sm`}>
    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</span>
    <span className="mt-2 text-3xl font-bold text-slate-800">{value}</span>
  </div>
);

const IncidentTicketsPage = () => {
  const [incidents, setIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incidentsRes, statsRes] = await Promise.all([
        getIncidents(),
        getIncidentStats()
      ]);
      setIncidents(incidentsRes.data);
      setStats(statsRes.data);
      
      // Select the first incident by default
      if (incidentsRes.data.length > 0) {
        handleSelectIncident(incidentsRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch incident data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIncident = async (id) => {
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
      await updateIncident(selectedIncident.id, { status });
      setSelectedIncident(prev => ({ ...prev, status }));
      setIncidents(prev => prev.map(inc => inc.id === selectedIncident.id ? { ...inc, status } : inc));
    } finally {
      setUpdating(false);
    }
  };

  const handleSendMessage = async (message) => {
    if (!selectedIncident) return;
    try {
      const res = await addComment(selectedIncident.id, message);
      setSelectedIncident(prev => ({
        ...prev,
        discussion: [...prev.discussion, res.data]
      }));
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner label="Loading incidents..." />;

  const filteredIncidents = incidents.filter(inc => 
    inc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    inc.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-8 font-sans">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800">Smart Campus Hub</h1>
          <div className="h-6 w-[1px] bg-gray-200"></div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search incidents..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 rounded-xl border border-gray-100 bg-white px-4 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button className="relative text-gray-400 hover:text-slate-800">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.5 17a2.5 2.5 0 0 0 5 0" />
            </svg>
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-red-500"></span>
          </button>
          <button className="rounded-xl bg-[#1E293B] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 active:scale-95">
            Google Sign-in
          </button>
        </div>
      </header>

      {/* Breadcrumbs & Title Section */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <span>OPERATIONS</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-slate-600">INCIDENT TICKETS</span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">Incident Reporting & Tracking</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-medium text-slate-600">Monitoring {incidents.length} active campus facility issues</span>
          </div>
        </div>
        
        <button className="flex items-center gap-2 rounded-xl bg-[#0F766E] px-6 py-3 text-sm font-bold text-white shadow-xl shadow-teal-100 transition hover:bg-[#0D9488] active:scale-95">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Ticket
        </button>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="col-span-2 space-y-8">
          {/* Active Incidents Table */}
          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Active Incidents</h3>
              <button className="rounded-lg bg-slate-50 p-2 text-slate-400 hover:bg-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 text-left text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    <th className="rounded-l-xl px-6 py-4">ID</th>
                    <th className="px-6 py-4">TITLE</th>
                    <th className="px-6 py-4 text-center">PRIORITY</th>
                    <th className="px-6 py-4 text-center">STATUS</th>
                    <th className="rounded-r-xl px-6 py-4">ASSIGNED</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredIncidents.map((inc) => (
                    <tr 
                      key={inc.id} 
                      onClick={() => handleSelectIncident(inc.id)}
                      className={`group cursor-pointer transition duration-200 hover:bg-blue-50/50 ${selectedIncident?.id === inc.id ? 'bg-blue-50/80' : ''}`}
                    >
                      <td className="px-6 py-6 text-xs font-bold text-slate-400">{inc.id}</td>
                      <td className="px-6 py-6">
                        <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition">{inc.title}</div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <IncidentPriorityBadge priority={inc.priority} />
                      </td>
                      <td className="px-6 py-6 text-center">
                        <IncidentStatusBadge status={inc.status} />
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          {inc.assignedTo ? (
                            <>
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                {inc.assignedTo.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-sm font-medium text-slate-600">{inc.assignedTo}</span>
                            </>
                          ) : (
                            <span className="text-sm italic text-slate-400">Unassigned</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Evidence Attachments */}
          <EvidenceAttachments 
            attachments={selectedIncident?.attachmentUrls?.map((url, index) => ({ 
              id: index, 
              url: `${API_BASE_URL}/api/ticketing/incidents/media/${url}`, 
              name: `Attachment ${index + 1}` 
            }))} 
          />
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Ticket Workflow Card */}
          <section className="rounded-3xl bg-[#1D4ED8] p-8 text-white shadow-xl shadow-blue-200">
            <div className="flex items-start gap-4 mb-8">
              <div className="rounded-xl bg-white/20 p-3 backdrop-blur-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-80">TICKET WORKFLOW</h3>
                <p className="text-xs opacity-60">Ticket #{selectedIncident?.id} Lifecycle</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest opacity-60">UPDATE STATUS</label>
                <div className="relative">
                  <select 
                    value={selectedIncident?.status || ''}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    className="w-full appearance-none rounded-xl bg-white/10 px-5 py-4 text-sm font-bold backdrop-blur-md focus:bg-white/20 focus:outline-none border border-white/10"
                  >
                    <option value="OPEN" className="text-slate-800">OPEN</option>
                    <option value="IN_PROGRESS" className="text-slate-800">IN_PROGRESS</option>
                    <option value="RESOLVED" className="text-slate-800">RESOLVED</option>
                  </select>
                  <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest opacity-60">ASSIGN TECHNICIAN</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="flex items-center gap-3 w-full rounded-xl bg-white/10 px-5 py-3.5 backdrop-blur-md border border-white/10">
                      <div className="h-6 w-6 overflow-hidden rounded-full bg-white/20">
                        <div className="flex h-full w-full items-center justify-center text-[8px] font-bold">
                          {selectedIncident?.technicianAvatar || 'UA'}
                        </div>
                      </div>
                      <span className="text-sm font-bold">{selectedIncident?.assignedTo || 'Unassigned'}</span>
                    </div>
                  </div>
                  <button className="rounded-xl bg-[#15803D] p-3 shadow-lg hover:bg-[#16a34a] transition active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              <button 
                className="w-full rounded-xl bg-white py-4 text-sm font-bold text-blue-700 shadow-xl shadow-blue-900/20 transition hover:bg-blue-50 active:scale-[0.98] mt-4"
                disabled={updating}
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </section>

          {/* Discussion Section */}
          <div className="h-[500px]">
            <DiscussionSection 
              discussions={selectedIncident?.discussion} 
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>

      {/* Bottom Row - Stats */}
      <div className="mt-12 grid grid-cols-4 gap-6">
        <StatsCard 
          label="CRITICAL INCIDENTS" 
          value={stats?.critical || 0} 
          colorClass="border-red-500" 
        />
        <StatsCard 
          label="IN PROGRESS" 
          value={stats?.inProgress || 0} 
          colorClass="border-teal-500" 
        />
        <StatsCard 
          label="RESOLVED TODAY" 
          value={stats?.resolvedToday || 0} 
          colorClass="border-blue-900" 
        />
        <StatsCard 
          label="AVG RESOLUTION" 
          value={stats?.avgResolution || '0h'} 
          colorClass="border-gray-300" 
        />
      </div>
    </div>
  );
};

export default IncidentTicketsPage;
