import React from 'react';

// ============================================================================
// USER BOOKING TABLE - Display user's bookings with cancel action
// ============================================================================

const UserBookingTable = ({ bookings, onCancel, loading }) => {
  // Format date and time: "Oct 24, 2023 | 09:00 – 11:30"
  const formatDateTime = (startTime, endTime) => {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const month = monthNames[startDate.getMonth()];
    const date = startDate.getDate();
    const year = startDate.getFullYear();

    const startHours = String(startDate.getHours()).padStart(2, '0');
    const startMinutes = String(startDate.getMinutes()).padStart(2, '0');
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0');

    return `${month} ${date}, ${year} | ${startHours}:${startMinutes} – ${endHours}:${endMinutes}`;
  };

  // Status badges with proper styling
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      PENDING: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-300',
      },
      APPROVED: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-300',
      },
      REJECTED: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
      },
      CANCELLED: {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-300',
      },
    };

    const config = statusConfig[status] || statusConfig.PENDING;

    return (
      <span
        className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
      >
        {status}
      </span>
    );
  };

  // Render action for each row
  const renderAction = (booking) => {
    if (booking.status === 'APPROVED') {
      return (
        <button
          onClick={() => onCancel(booking.id)}
          className="px-3 py-1 text-xs font-medium text-white bg-gray-500 hover:bg-gray-600 rounded-lg transition-colors"
        >
          Cancel
        </button>
      );
    }

    if (booking.status === 'PENDING') {
      return (
        <span className="text-xs text-gray-500 italic">Awaiting Approval</span>
      );
    }

    if (booking.status === 'REJECTED' && booking.rejectionReason) {
      return (
        <div className="text-xs">
          <p className="text-red-600 font-medium">Rejected</p>
          <p className="text-gray-500">{booking.rejectionReason}</p>
        </div>
      );
    }

    return null;
  };

  // Loading skeleton rows
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Resource
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Date & Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Purpose
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((i) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-40" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <table className="w-full">
        {/* Table Header */}
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
              Resource Name
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
              Date & Time
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
              Purpose
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
              Status
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">
              Action
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-gray-200">
          {bookings.map((booking) => (
            <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
              {/* Resource Name */}
              <td className="px-6 py-4">
                <p className="text-sm font-medium text-gray-900">
                  {booking.resourceName}
                </p>
              </td>

              {/* Date & Time */}
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600">
                  {formatDateTime(booking.startTime, booking.endTime)}
                </p>
              </td>

              {/* Purpose */}
              <td className="px-6 py-4">
                <p className="text-sm text-gray-600">
                  {booking.purpose.length > 30
                    ? `${booking.purpose.substring(0, 30)}...`
                    : booking.purpose}
                </p>
              </td>

              {/* Status */}
              <td className="px-6 py-4">
                <StatusBadge status={booking.status} />
              </td>

              {/* Action */}
              <td className="px-6 py-4">
                {renderAction(booking)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserBookingTable;
