import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getIncidentById, addComment } from '../services/incidentService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import IncidentStatusBadge from '../components/incident/IncidentStatusBadge';
import IncidentPriorityBadge from '../components/incident/IncidentPriorityBadge';
import EvidenceAttachments from '../components/incident/EvidenceAttachments';
import DiscussionSection from '../components/incident/DiscussionSection';

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchIncident = async () => {
    try {
      const res = await getIncidentById(id);
      setIncident(res.data);
    } catch (error) {
      console.error('Failed to fetch incident:', error);
      alert('Failed to load ticket details.');
      navigate('/tickets/my');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [id]);

  const handleSendMessage = async (message) => {
    try {
      const res = await addComment(id, message);
      setIncident(prev => ({
        ...prev,
        discussion: res.data.discussion
      }));
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to send message.');
    }
  };

  if (loading) return <LoadingSpinner label="Loading ticket details..." />;
  if (!incident) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="mb-8 flex items-center gap-4">
        <button 
          onClick={() => navigate('/tickets/my')}
          className="rounded-xl bg-white p-3 text-slate-400 shadow-sm transition hover:text-blue-600 hover:shadow-md"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{incident.title}</h1>
          <p className="text-sm font-medium text-slate-500">Ticket {incident.ticketNumber} • Reported on {new Date(incident.createdAt).toLocaleString()}</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-8">
          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-800">Issue Description</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{incident.description}</p>
          </section>

          <EvidenceAttachments 
            attachments={incident.attachmentUrls?.map((url, index) => ({ 
              id: index, 
              path: url, 
              name: `Attachment ${index + 1}` 
            }))} 
          />
        </div>

        <div className="space-y-8">
          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <h3 className="mb-6 text-lg font-bold text-slate-800">Status & Priority</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Status</span>
                <IncidentStatusBadge status={incident.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Priority Level</span>
                <IncidentPriorityBadge priority={incident.priority} />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">ASSIGNED TECHNICIAN</p>
                <p className="mt-1 text-sm font-bold text-slate-700">{incident.assignedTechnicianName || 'Pending Assignment'}</p>
              </div>
            </div>
          </section>

          <div className="h-[500px]">
            <DiscussionSection 
              discussions={incident.discussion} 
              onSendMessage={handleSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailPage;
