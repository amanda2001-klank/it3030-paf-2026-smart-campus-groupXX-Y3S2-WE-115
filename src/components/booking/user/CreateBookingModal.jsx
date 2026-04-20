import React, { useState } from 'react';
import * as bookingService from '../../../services/bookingService';

// ============================================================================
// CREATE BOOKING MODAL - Modal for user to create new booking
// ============================================================================

const CreateBookingModal = ({ isOpen, onClose, onSuccess }) => {
  // Form state
  const [formData, setFormData] = useState({
    resourceId: '',
    resourceName: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: '',
  });

  // Error and loading states
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get minimum date (today)
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Validate form fields (client-side)
  const validateForm = () => {
    const newErrors = {};
    const today = getTodayDate();

    // Required fields
    if (!formData.resourceName.trim()) {
      newErrors.resourceName = 'Resource name is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (formData.date < today) {
      newErrors.date = 'Date cannot be in the past';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    // End time must be after start time
    if (formData.startTime && formData.endTime) {
      if (formData.endTime <= formData.startTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    } else if (formData.purpose.length > 500) {
      newErrors.purpose = 'Purpose cannot exceed 500 characters';
    }

    // Expected attendees validation (optional but validate if provided)
    if (formData.expectedAttendees && parseInt(formData.expectedAttendees) < 1) {
      newErrors.expectedAttendees = 'Expected attendees must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Clear API error when user makes changes
    if (apiError) {
      setApiError('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      // Convert date and time to ISO format
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endDateTime = `${formData.date}T${formData.endTime}:00`;

      // Prepare payload
      const payload = {
        resourceId: formData.resourceId || formData.resourceName,
        resourceName: formData.resourceName,
        startTime: startDateTime,
        endTime: endDateTime,
        purpose: formData.purpose,
        expectedAttendees: formData.expectedAttendees
          ? parseInt(formData.expectedAttendees)
          : null,
      };

      // Call API
      await bookingService.createBooking(payload);

      // Success - reset form and close modal
      setFormData({
        resourceId: '',
        resourceName: '',
        date: '',
        startTime: '',
        endTime: '',
        purpose: '',
        expectedAttendees: '',
      });
      setErrors({});

      // Call parent success callback
      onSuccess();
      onClose();
    } catch (err) {
      // Handle API errors
      if (err.response?.status === 409) {
        setApiError(
          'This resource is already booked for the selected time. Please choose a different slot.'
        );
      } else if (err.response?.status === 400) {
        // Validation error from backend
        setApiError('Invalid booking data. Please check your inputs.');
      } else {
        setApiError('Something went wrong. Please try again.');
      }
      console.error('Error creating booking:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleCancel = () => {
    setFormData({
      resourceId: '',
      resourceName: '',
      date: '',
      startTime: '',
      endTime: '',
      purpose: '',
      expectedAttendees: '',
    });
    setErrors({});
    setApiError('');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 flex items-start justify-center pt-10 z-50"
        onClick={handleCancel}
      >
        {/* Modal Content */}
        <div
          className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg mx-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Create New Booking
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Request a resource for your event
          </p>

          {/* API Error Alert */}
          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{apiError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Resource Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resource Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="resourceName"
                value={formData.resourceName}
                onChange={handleChange}
                placeholder="e.g., Auditorium A, Lab 201"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                  errors.resourceName
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              {errors.resourceName && (
                <p className="text-red-500 text-xs mt-1">{errors.resourceName}</p>
              )}
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={getTodayDate()}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                  errors.date
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date}</p>
              )}
            </div>

            {/* Time Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Start Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                    errors.startTime
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
                {errors.startTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>
                )}
              </div>

              {/* End Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                    errors.endTime
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                  }`}
                />
                {errors.endTime && (
                  <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>
                )}
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose <span className="text-red-500">*</span>
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                placeholder="Describe the purpose of booking"
                rows="3"
                maxLength="500"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all resize-none ${
                  errors.purpose
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              <div className="flex justify-between mt-1">
                <div>
                  {errors.purpose && (
                    <p className="text-red-500 text-xs">{errors.purpose}</p>
                  )}
                </div>
                <span className="text-gray-400 text-xs">
                  {formData.purpose.length}/500
                </span>
              </div>
            </div>

            {/* Expected Attendees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Attendees (Optional)
              </label>
              <input
                type="number"
                name="expectedAttendees"
                value={formData.expectedAttendees}
                onChange={handleChange}
                min="1"
                placeholder="e.g., 30"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-all ${
                  errors.expectedAttendees
                    ? 'border-red-500 focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                }`}
              />
              {errors.expectedAttendees && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.expectedAttendees}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Create Booking'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default CreateBookingModal;
