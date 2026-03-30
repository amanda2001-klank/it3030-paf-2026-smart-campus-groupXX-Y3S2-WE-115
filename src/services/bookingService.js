import axios from 'axios';

// ============================================================================
// BOOKING SERVICE - Axios instance and API calls
// ============================================================================

// Create Axios instance with base configuration
const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add user context headers
// Team will replace with OAuth2 authentication in future
apiClient.interceptors.request.use(
  (config) => {
    const userId = localStorage.getItem('userId') || 'test-user-123';
    const userRole = localStorage.getItem('userRole') || 'USER';
    
    config.headers['X-User-Id'] = userId;
    config.headers['X-User-Role'] = userRole;
    
    return config;
  },
  (error) => Promise.reject(error)
);

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
  const params = status ? { status } : {};
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
