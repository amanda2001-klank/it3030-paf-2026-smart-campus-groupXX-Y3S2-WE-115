import React from 'react';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '\u231B' },
    APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: '\u2705' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: '\u274C' },
    CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-600', icon: '\u26D4' },
    ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: '\u2714' },
    OUT_OF_SERVICE: { bg: 'bg-red-100', text: 'text-red-800', icon: '\u26A0' },
    MAINTENANCE: { bg: 'bg-amber-100', text: 'text-amber-800', icon: '\u2699' },
    INACTIVE: { bg: 'bg-gray-100', text: 'text-gray-600', icon: '\u25CF' },
    // Incident Statuses
    OPEN: { bg: 'bg-blue-100', text: 'text-blue-800', icon: '\u25CB' },
    IN_PROGRESS: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: '\u2699' },
    RESOLVED: { bg: 'bg-gray-100', text: 'text-gray-600', icon: '\u2713' },
    CLOSED: { bg: 'bg-slate-100', text: 'text-slate-600', icon: '\u1F512' },
  };

  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
    >
      <span className="mr-1">{config.icon}</span>
      {status}
    </span>
  );
};

export default StatusBadge;
