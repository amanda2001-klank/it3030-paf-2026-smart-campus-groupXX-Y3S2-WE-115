import React, { useEffect, useState } from 'react';
import { 
  getIncidents, 
  getIncidentById, 
  getIncidentStats, 
  updateIncident, 
  addComment,
  deleteIncident,
  getTechnicians
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
  const [technicians, setTechnicians] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ title: '', priority: '', description: '', category: '' });
  const [workflowData, setWorkflowData] = useState({ status: '', technicianId: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incidentsRes, statsRes, techRes] = await Promise.all([
        getIncidents(),
        getIncidentStats(),
        getTechnicians()
      ]);
      setIncidents(incidentsRes.data);
      setStats(statsRes.data);
      setTechnicians(techRes.data);
      
      // Select the first incident by default
      if (incidentsRes.data.length > 0 && !selectedIncident) {
        handleSelectIncident(incidentsRes.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch incident data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIncident = async (id) => {
    // 1. Find the basic info from our current list to show immediately
    const basicInfo = incidents.find(inc => inc.id === id);
    if (basicInfo) {
      setSelectedIncident(basicInfo);
    }
    
    try {
      // 2. Fetch full details (including latest discussion) from server
      const res = await getIncidentById(id);
      
      // 3. Update with full details
      setSelectedIncident(res.data);
    } catch (error) {
      console.error('Failed to fetch incident details:', error);
    }
  };

  const handleSaveWorkflow = async () => {
    if (!selectedIncident) return;
    setUpdating(true);
    try {
      const res = await updateIncident(selectedIncident.id, { 
        title: selectedIncident.title,
        description: selectedIncident.description,
        category: selectedIncident.category,
        priority: selectedIncident.priority,
        status: workflowData.status,
        assignedTechnicianId: workflowData.technicianId 
      });
      setSelectedIncident(res.data);
      setIncidents(prev => prev.map(inc => inc.id === selectedIncident.id ? res.data : inc));
      alert('Workflow updated successfully');
    } catch (error) {
      console.error('Failed to update workflow:', error);
      alert('Failed to update workflow');
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
        // Update the incident in the list as well to persist the discussion
        setIncidents(list => list.map(inc => inc.id === updated.id ? updated : inc));
        return updated;
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await deleteIncident(id);
      setIncidents(prev => prev.filter(inc => inc.id !== id));
      if (selectedIncident?.id === id) {
        setSelectedIncident(null);
      }
    } catch (error) {
      console.error('Failed to delete incident:', error);
    }
  };

  const handleAssignTechnician = (techId) => {
    setWorkflowData(prev => ({ ...prev, technicianId: techId }));
  };

  const handleOpenEdit = () => {
    if (!selectedIncident) return;
    setEditData({
      title: selectedIncident.title,
      priority: selectedIncident.priority,
      description: selectedIncident.description,
      category: selectedIncident.category
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedIncident) return;
    setUpdating(true);
    try {
      const res = await updateIncident(selectedIncident.id, editData);
      setSelectedIncident(res.data);
      setIncidents(prev => prev.map(inc => inc.id === selectedIncident.id ? res.data : inc));
      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update incident:', error);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update workflowData when selectedIncident changes
  useEffect(() => {
    if (selectedIncident) {
      setWorkflowData({
        status: selectedIncident.status || '',
        technicianId: selectedIncident.assignedTechnicianId || ''
      });
    }
  }, [selectedIncident]);

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
                    <th className="px-6 py-4">ASSIGNED</th>
                    <th className="rounded-r-xl px-6 py-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredIncidents.map((inc) => (
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
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                          {inc.assignedTechnicianName ? (
                            <>
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600">
                                {inc.assignedTechnicianName.split(' ').map(n => n[0]).join('')}
                              </div>
                              <span className="text-sm font-medium text-slate-600">{inc.assignedTechnicianName}</span>
                            </>
                          ) : (
                            <span className="text-sm italic text-slate-400">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => { handleSelectIncident(inc.id); handleOpenEdit(); }}
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100 transition"
                            title="Edit Ticket"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDeleteTicket(inc.id)}
                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 transition"
                            title="Delete Ticket"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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
              path: url, 
              name: `Attachment ${index + 1}` 
            }))} 
          />
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Ticket Overview Card */}
          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Ticket Overview</h3>
              {selectedIncident && (
                <div className="flex gap-2">
                  <IncidentPriorityBadge priority={selectedIncident.priority} />
                  <IncidentStatusBadge status={selectedIncident.status} />
                </div>
              )}
            </div>
            {selectedIncident ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">REPORTED BY</label>
                  <p className="text-sm font-medium text-slate-700">{selectedIncident.reportedByName || 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">DESCRIPTION</label>
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-3" title={selectedIncident.description}>
                    {selectedIncident.description}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">CREATED ON</label>
                  <p className="text-sm text-slate-600">
                    {selectedIncident.createdAt ? new Date(selectedIncident.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm italic text-slate-400">Select a ticket to view details</p>
            )}
          </section>

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
                <p className="text-xs opacity-60">Ticket #{selectedIncident?.ticketNumber} Lifecycle</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest opacity-60">UPDATE STATUS</label>
                <div className="relative">
                  <select 
                    value={workflowData.status}
                    onChange={(e) => setWorkflowData({ ...workflowData, status: e.target.value })}
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
                    <select 
                      value={workflowData.technicianId}
                      onChange={(e) => handleAssignTechnician(e.target.value)}
                      className="w-full appearance-none rounded-xl bg-white/10 px-5 py-4 text-sm font-bold backdrop-blur-md focus:bg-white/20 focus:outline-none border border-white/10 text-white"
                    >
                      <option value="" className="text-slate-800">Select Technician</option>
                      <option value="UNASSIGNED" className="text-slate-800">Unassign</option>
                      {technicians.map(tech => (
                        <option key={tech.userId} value={tech.userId} className="text-slate-800">
                          {tech.userName}
                        </option>
                      ))}
                    </select>
                    <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleSaveWorkflow}
                disabled={updating || !selectedIncident}
                className="w-full rounded-xl bg-emerald-500 py-4 text-sm font-bold text-white shadow-xl shadow-emerald-900/20 transition hover:bg-emerald-600 active:scale-[0.98] mt-2 disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Workflow Changes'}
              </button>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button 
                  onClick={handleOpenEdit}
                  className="rounded-xl bg-white py-4 text-sm font-bold text-blue-700 shadow-xl shadow-blue-900/20 transition hover:bg-blue-50 active:scale-[0.98]"
                >
                  Edit Details
                </button>
                <button 
                  onClick={() => handleDeleteTicket(selectedIncident.id)}
                  className="rounded-xl bg-red-600/20 py-4 text-sm font-bold text-white border border-white/20 transition hover:bg-red-600/30 active:scale-[0.98]"
                >
                  Delete Ticket
                </button>
              </div>
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

export default IncidentTicketsPage;
