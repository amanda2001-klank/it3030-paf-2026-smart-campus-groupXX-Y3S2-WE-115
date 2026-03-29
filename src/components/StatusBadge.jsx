import React from 'react';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⏳' },
    APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅' },
    REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌' },
    CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: '🚫' },
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
