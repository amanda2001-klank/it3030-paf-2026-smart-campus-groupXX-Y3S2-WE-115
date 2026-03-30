import React, { useState } from 'react';

// ============================================================================
// REJECT MODAL - Modal for entering rejection reason
// ============================================================================

const RejectModal = ({ isOpen, onClose, onConfirm, bookingId }) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Validate reason
  const isReasonValid = () => {
    const trimmedReason = reason.trim();
    return trimmedReason.length >= 10 && trimmedReason.length <= 300;
  };

  // Handle submit
  const handleSubmit = async () => {
    setError('');

    // Validate
    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    if (reason.trim().length > 300) {
      setError('Reason must not exceed 300 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await onConfirm(reason);
      // Reset form on success
      setReason('');
      setError('');
      // Modal is closed by parent component
    } catch (err) {
      console.error('Error submitting rejection:', err);
      setError('Failed to reject booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setReason('');
    setError('');
    onClose();
  };

  // Handle close (overlay click)
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
        onClick={handleOverlayClick}
      >
        {/* Modal Content */}
        <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-auto">
          {/* Header */}
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Reject Booking Request
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Please provide a reason for rejecting this booking request
          </p>

          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Reason Textarea */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Rejection
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="Explain why this booking request is being rejected..."
              rows="5"
              maxLength="300"
              disabled={isSubmitting}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500 resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
            />

            {/* Character count */}
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-500">
                {reason.length >= 10 ? '✓ ' : ''}
                Minimum 10 characters required
              </span>
              <span className="text-xs text-gray-500">
                {reason.length}/300
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !isReasonValid()}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Confirm Reject'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default RejectModal;
