import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createIncident } from '../services/incidentService';
import Toast from '../components/common/Toast';

const RaiseTicketPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createIncident(formData);
      setToast({ type: 'success', message: 'Ticket raised successfully!' });
      setTimeout(() => navigate('/tickets/my'), 1500);
    } catch (error) {
      setToast({ type: 'error', message: 'Failed to raise ticket. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Raise New Incident</h1>
          <p className="mt-2 text-slate-500">Provide details about the issue you're experiencing.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <div>
            <label className="block text-sm font-bold text-slate-700">Issue Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Projector not working in LH 204"
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
            >
              <option value="LOW">Low - General inquiry or minor issue</option>
              <option value="MEDIUM">Medium - Functional issue with workaround</option>
              <option value="HIGH">High - Critical issue affecting operations</option>
              <option value="CRITICAL">Critical - Immediate attention required</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700">Description</label>
            <textarea
              required
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the issue in detail..."
              className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-4 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Ticket'}
            </button>
          </div>
        </form>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default RaiseTicketPage;
