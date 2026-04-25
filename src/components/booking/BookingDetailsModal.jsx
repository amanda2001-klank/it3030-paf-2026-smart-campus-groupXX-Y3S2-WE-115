import React from 'react';
import StatusBadge from '../StatusBadge';

const formatDateTime = (value) => {
  if (!value) return 'N/A';

  const date = new Date(value);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const BookingDetailsModal = ({ isOpen, booking, onClose, onDownloadReceipt }) => {
  if (!isOpen || !booking) return null;

  const isApproved = booking.status === 'APPROVED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">Booking Details</h2>
            {isApproved && (
              <button
                type="button"
                onClick={() => onDownloadReceipt(booking.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                <span>Download Receipt</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Booking ID</p>
              <p className="mt-1 text-sm text-gray-900 break-all">{booking.id || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
              <div className="mt-1">
                <StatusBadge status={booking.status} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Resource Name</p>
              <p className="mt-1 text-sm text-gray-900">{booking.resourceName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Resource ID</p>
              <p className="mt-1 text-sm text-gray-900 break-all">{booking.resourceId || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Requested By</p>
              <p className="mt-1 text-sm text-gray-900">{booking.requestedByName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Requester ID</p>
              <p className="mt-1 text-sm text-gray-900 break-all">{booking.requestedById || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Start Time</p>
              <p className="mt-1 text-sm text-gray-900">{formatDateTime(booking.startTime)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">End Time</p>
              <p className="mt-1 text-sm text-gray-900">{formatDateTime(booking.endTime)}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Expected Attendees</p>
              <p className="mt-1 text-sm text-gray-900">{booking.expectedAttendees ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created At</p>
              <p className="mt-1 text-sm text-gray-900">{formatDateTime(booking.createdAt)}</p>
            </div>

            <div className="md:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Purpose</p>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{booking.purpose || 'N/A'}</p>
            </div>

            {booking.rejectionReason ? (
              <div className="md:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Rejection Reason</p>
                <p className="mt-1 text-sm text-red-700 whitespace-pre-wrap">{booking.rejectionReason}</p>
              </div>
            ) : null}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Last Updated</p>
              <p className="mt-1 text-sm text-gray-900">{formatDateTime(booking.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;