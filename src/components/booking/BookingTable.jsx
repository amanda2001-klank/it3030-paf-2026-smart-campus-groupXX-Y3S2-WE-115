import React from 'react';
import StatusBadge from '../StatusBadge';

const BookingTable = ({ 
  bookings, 
  onApprove, 
  onReject, 
  onCancel, 
  isAdmin,
  isApproving = null,
  isRejecting = null,
  isCancelling = null
}) => {
  // Format date and time from ISO format to "Oct 24, 2023 | 09:00 – 11:30"
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

  // Render action buttons based on status and isAdmin flag
  const renderActions = (booking) => {
    // Admin actions for PENDING bookings
    if (booking.status === 'PENDING' && isAdmin) {
      return (
        <div className="flex space-x-2">
          <button
            onClick={() => onApprove(booking.id)}
            disabled={isApproving === booking.id || isRejecting === booking.id}
            className="px-3 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {isApproving === booking.id ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Approving...
              </>
            ) : (
              '✓ Approve'
            )}
          </button>
          <button
            onClick={() => onReject(booking.id)}
            disabled={isApproving === booking.id || isRejecting === booking.id}
            className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {isRejecting === booking.id ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Rejecting...
              </>
            ) : (
              '✕ Reject'
            )}
          </button>
        </div>
      );
    }
    
    // User can cancel their own APPROVED bookings
    if (booking.status === 'APPROVED') {
      return (
        <button
          onClick={() => onCancel(booking.id)}
          disabled={isCancelling === booking.id}
          className="px-3 py-1 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {isCancelling === booking.id ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Cancelling...
            </>
          ) : (
            '✕ Cancel'
          )}
        </button>
      );
    }
    
    return (
      <span className="text-xs text-gray-500">No actions available</span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        {/* Table Header */}
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Resource Name
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Requested By
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Date & Time
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Purpose
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Status
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-gray-200">
          {bookings.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                No bookings found
              </td>
            </tr>
          ) : (
            bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                {/* Resource Name */}
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {booking.resourceName}
                </td>

                {/* Requested By */}
                <td className="px-6 py-4 text-sm text-gray-900">
                  {booking.requestedByName}
                </td>

                {/* Date & Time */}
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDateTime(booking.startTime, booking.endTime)}
                </td>

                {/* Purpose */}
                <td className="px-6 py-4 text-sm text-gray-600">
                  {booking.purpose}
                </td>

                {/* Status */}
                <td className="px-6 py-4">
                  <StatusBadge status={booking.status} />
                </td>

                {/* Actions */}
                <td className="px-6 py-4">
                  {renderActions(booking)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BookingTable;
