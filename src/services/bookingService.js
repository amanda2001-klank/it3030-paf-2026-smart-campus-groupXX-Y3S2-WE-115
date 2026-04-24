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

/**
 * Download booking receipt as PDF
 * @param {string} id - Booking ID
 * @returns {Promise} PDF file as ArrayBuffer
 */
export const downloadBookingReceipt = async (id) => {
  const response = await apiClient.get(`/api/bookings/${id}/receipt`, {
    responseType: 'arraybuffer'
  });
  return response.data;
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
 * Approve a pending booking request (Admin only)
 * @param {string} id - Booking ID
 * @returns {Promise} Updated booking object with status APPROVED
 */
export const approveBooking = (id) => {
  return apiClient.put(`/api/bookings/${id}/approve`);
};

/**
 * Reject a pending booking request (Admin only)
 * @param {string} id - Booking ID
 * @param {string} reason - Rejection reason
 * @returns {Promise} Updated booking object with status REJECTED
 */
export const rejectBooking = (id, reason) => {
  return apiClient.put(`/api/bookings/${id}/reject`, { reason });
};

export default apiClient;
