import apiClient from './apiClient';

// ============================================================================
// BOOKING SERVICE - Axios instance and API calls
// ============================================================================

// ============================================================================
// USER-SIDE BOOKING FUNCTIONS
// ============================================================================

/**
 * Get current user's bookings
 * @returns {Promise} Array of user's bookings
 */
export const getMyBookings = () => {
  return apiClient.get('/api/bookings/my');
};

/**
 * Create a new booking request
 * @param {object} data - Booking data
 * @param {string} data.resourceId - Resource identifier
 * @param {string} data.resourceName - Resource name
 * @param {string} data.startTime - ISO format: "2026-05-01T09:00:00"
 * @param {string} data.endTime - ISO format: "2026-05-01T11:00:00"
 * @param {string} data.purpose - Booking purpose
 * @param {number} data.expectedAttendees - Number of attendees (optional)
 * @returns {Promise} Created booking object
 */
export const createBooking = (data) => {
  return apiClient.post('/api/bookings', data);
};

/**
 * Cancel a user's own booking
 * @param {string} id - Booking ID
 * @returns {Promise} Cancelled booking object
 */
export const cancelBooking = (id) => {
  return apiClient.delete(`/api/bookings/${id}`);
};

// ============================================================================
// ADMIN-SIDE BOOKING FUNCTIONS
// ============================================================================

/**
 * Get all bookings with optional status filter
 * @param {string} status - Filter by status (optional): PENDING, APPROVED, REJECTED, CANCELLED
 * @returns {Promise} Array of bookings
 */
export const getAllBookings = (status) => {
  const params = status ? { status: status.toUpperCase() } : {};
  return apiClient.get('/api/bookings', { params });
};

/**
 * Get a specific booking by ID
 * @param {string} id - Booking ID
 * @returns {Promise} Single booking object
 */
export const getBookingById = (id) => {
  return apiClient.get(`/api/bookings/${id}`);
};

/**
 * Get booking analytics grouped by asset
 * @param {string} period - WEEKLY or MONTHLY
 * @returns {Promise} Analytics payload with totals and per-asset metrics
 */
export const getAssetUsageAnalytics = (period = 'WEEKLY') => {
  return apiClient.get('/api/bookings/analytics/asset-usage', {
    params: { period: period.toUpperCase() },
  });
};

/**
 * Approve a pending booking request (Asset Manager only)
 * @param {string} id - Booking ID
 * @returns {Promise} Updated booking object with status APPROVED
 */
export const approveBooking = (id) => {
  return apiClient.put(`/api/bookings/${id}/approve`);
};

/**
 * Reject a pending booking request (Asset Manager only)
 * @param {string} id - Booking ID
 * @param {string} reason - Rejection reason
 * @returns {Promise} Updated booking object with status REJECTED
 */
export const rejectBooking = (id, reason) => {
  return apiClient.put(`/api/bookings/${id}/reject`, { reason });
};

/**
 * Download booking receipt PDF
 * @param {string} id - Booking ID
 * @returns {Promise} Resolves when download starts
 */
export const downloadReceipt = async (id) => {
  const response = await apiClient.get(`/api/bookings/${id}/receipt`, {
    responseType: 'blob',
  });

  // Create a URL for the blob
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Booking_Receipt_${id}.pdf`);
  document.body.appendChild(link);
  link.click();

  // Cleanup
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default apiClient;
