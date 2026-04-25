import React from 'react';

const IncidentStatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status?.toUpperCase()) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'RESOLVED':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'CLOSED':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatStatus = (s) => s?.replace('_', ' ') || 'UNKNOWN';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusStyles()}`}>
      {formatStatus(status)}
    </span>
  );
};

export default IncidentStatusBadge;
