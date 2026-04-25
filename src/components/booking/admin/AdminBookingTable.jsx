import React from 'react';
import StatusBadge from '../../StatusBadge';

// ============================================================================
// ADMIN BOOKING TABLE - Table for displaying and managing all bookings
// ============================================================================

const AdminBookingTable = ({ bookings, loading, onViewDetails, onDownloadReceipt }) => {
  // Format date and time
  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { dateStr, timeStr };
  };

  // Extract initials from name
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('');
  };

  // Get avatar color based on initials
  const getAvatarColor = (name) => {
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700',
      'bg-pink-100 text-pink-700',
      'bg-green-100 text-green-700',
      'bg-yellow-100 text-yellow-700',
      'bg-red-100 text-red-700',
      'bg-indigo-100 text-indigo-700',
      'bg-orange-100 text-orange-700',
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Truncate text
  const truncate = (text, length = 20) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  // Skeleton Loading Row
  const SkeletonRow = () => (
    <tr className="border-t border-gray-200">
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
          <div className="h-3 bg-gray-100 rounded w-24 animate-pulse" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse" />
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-16 animate-pulse" />
        </div>
      </td>
    </tr>
  );

  // Empty State
  if (!loading && bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="text-4xl mb-3">📋</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          No booking requests found
        </h3>
        <p className="text-gray-600">
          There are no booking requests to display at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Table Header */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Resource
                </span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Requested By
                </span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Date & Time
                </span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Purpose
                </span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Status
                </span>
              </th>
              <th className="px-6 py-3 text-left">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Action
                </span>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {loading ? (
              <>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            ) : (
              bookings.map((booking) => {
                const { dateStr, timeStr } = formatDateTime(
                  booking.startTime
                );
                const endTime = new Date(booking.endTime).toLocaleTimeString(
                  'en-US',
                  { hour: '2-digit', minute: '2-digit' }
                );
                const requestedByName = booking.requestedByName || 'Unknown User';
                const avatarColor = getAvatarColor(requestedByName);
                const initials = getInitials(requestedByName);

                return (
                  <tr
                    key={booking.id}
                    className="border-t border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {/* Resource Name */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {booking.resourceName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {booking.resourceId}
                        </p>
                      </div>
                    </td>

                    {/* Requested By (with Avatar) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${avatarColor}`}
                        >
                          {initials}
                        </div>
                        <span className="text-sm text-gray-700">
                          {requestedByName}
                        </span>
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {dateStr}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {timeStr} – {endTime}
                        </p>
                      </div>
                    </td>

                    {/* Purpose */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">
                        {truncate(booking.purpose, 20)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={booking.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetails(booking.id)}
                          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                        >
                          Details
                        </button>
                        {booking.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => onDownloadReceipt(booking.id)}
                            className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            Receipt
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBookingTable;
