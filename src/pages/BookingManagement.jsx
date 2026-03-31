// ============================================================================
// BOOKING MANAGEMENT PAGE - Display and manage resource booking requests
// ============================================================================

import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import BookingTable from '../components/booking/BookingTable';
import CreateBookingModal from '../components/booking/CreateBookingModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import SkeletonLoader from '../components/common/SkeletonLoader';
import Toast from '../components/common/Toast';
import * as bookingService from '../services/bookingService';

const BookingManagement = () => {
  // Track active filter tab
  const [activeTab, setActiveTab] = useState('all');
  const [activeMainTab, setActiveMainTab] = useState('requests');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isApproving, setIsApproving] = useState(null);
  const [isRejecting, setIsRejecting] = useState(null);
  const [isCancelling, setIsCancelling] = useState(null);

  // Main navigation tabs
  const mainTabs = [
    { id: 'requests', label: 'All Requests' },
    { id: 'history', label: 'History' },
    { id: 'resources', label: 'Resources' },
  ];

  // Filter tab configuration
  const filterTabs = [
    { id: 'all', label: 'All Requests', icon: '📋' },
    { id: 'my', label: 'My Bookings', icon: '📝' },
    { id: 'approved', label: 'Approved', icon: '✅' },
    { id: 'pending', label: 'Pending', icon: '⏳' },
  ];

  // Load bookings on component mount and when filters change
  useEffect(() => {
    loadBookings();
    // Check if user is admin from localStorage (team will replace with auth context)
    const userRole = localStorage.getItem('userRole') || 'USER';
    setIsAdmin(userRole === 'ADMIN');
  }, [activeTab]);

  // Fetch bookings based on active tab
  const loadBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (activeTab === 'my') {
        response = await bookingService.getMyBookings();
      } else if (activeTab === 'pending') {
        response = await bookingService.getAllBookings('PENDING');
      } else if (activeTab === 'approved') {
        response = await bookingService.getAllBookings('APPROVED');
      } else {
        response = await bookingService.getAllBookings();
      }
      setBookings(response.data || []);
    } catch (err) {
      // Detailed error handling for different types of failures
      if (err.code === 'ECONNABORTED' || err.message === 'Network Error') {
        setError({
          type: 'connection',
          title: '🌐 Connection Error',
          message: 'Unable to connect to server. Please check your internet connection and try again.'
        });
      } else if (!err.response) {
        setError({
          type: 'connection',
          title: '🌐 Server Unavailable',
          message: 'The server is not responding. Please try again in a moment.'
        });
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError({
          type: 'auth',
          title: '🔒 Access Denied',
          message: 'You do not have permission to view these bookings.'
        });
      } else if (err.response?.status >= 500) {
        setError({
          type: 'server',
          title: '⚠️ Server Error',
          message: 'The server encountered an error. Please try again later.'
        });
      } else {
        setError({
          type: 'generic',
          title: '❌ Error',
          message: 'Failed to load bookings. Please try again.'
        });
      }
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle booking form submission
  const handleBookingSubmit = async (formData) => {
    try {
      // Validate date is not in the past
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setToast({ 
          message: '📅 Cannot book for past dates. Please select a future date.', 
          type: 'error' 
        });
        return;
      }

      // Combine date and time fields into ISO format
      const datetime = `${formData.date}T${formData.startTime}`;
      const endtime = `${formData.date}T${formData.endTime}`;

      const payload = {
        resourceId: formData.resourceId || formData.resourceName,
        resourceName: formData.resourceName,
        startTime: datetime,
        endTime: endtime,
        purpose: formData.purpose,
        expectedAttendees: parseInt(formData.expectedAttendees),
      };

      await bookingService.createBooking(payload);
      setToast({ message: '✅ Booking created successfully!', type: 'success' });
      setIsModalOpen(false);
      loadBookings(); // Refresh the list
    } catch (err) {
      console.error('Error creating booking:', err);
      
      if (err.response?.status === 409) {
        setToast({ 
          message: '⚠️ This resource is already booked for the selected time. Please choose a different time or resource.', 
          type: 'error' 
        });
      } else if (err.response?.status === 400) {
        setToast({ 
          message: '❌ Invalid booking data. Please check all fields and try again.', 
          type: 'error' 
        });
      } else if (!err.response) {
        setToast({ 
          message: '🌐 Unable to connect to server. Please check your connection.', 
          type: 'error' 
        });
      } else {
        setToast({ 
          message: '❌ Failed to create booking. Please try again.', 
          type: 'error' 
        });
      }
    }
  };

  // Handle approve booking
  const handleApprove = async (id) => {
    setIsApproving(id);
    try {
      await bookingService.approveBooking(id);
      setToast({ message: '✅ Booking approved successfully!', type: 'success' });
      loadBookings();
    } catch (err) {
      console.error('Error approving booking:', err);
      if (!err.response) {
        setToast({ message: '🌐 Unable to connect to server', type: 'error' });
      } else if (err.response?.status === 404) {
        setToast({ message: '❌ Booking not found', type: 'error' });
      } else {
        setToast({ message: '❌ Failed to approve booking. Please try again.', type: 'error' });
      }
    } finally {
      setIsApproving(null);
    }
  };

  // Handle reject booking
  const handleReject = async (id) => {
    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    setIsRejecting(id);
    try {
      await bookingService.rejectBooking(id, reason);
      setToast({ message: '✅ Booking rejected successfully!', type: 'success' });
      loadBookings();
    } catch (err) {
      console.error('Error rejecting booking:', err);
      if (!err.response) {
        setToast({ message: '🌐 Unable to connect to server', type: 'error' });
      } else if (err.response?.status === 404) {
        setToast({ message: '❌ Booking not found', type: 'error' });
      } else {
        setToast({ message: '❌ Failed to reject booking. Please try again.', type: 'error' });
      }
    } finally {
      setIsRejecting(null);
    }
  };

  // Handle cancel booking
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    setIsCancelling(id);
    try {
      await bookingService.cancelBooking(id);
      setToast({ message: '✅ Booking cancelled successfully!', type: 'success' });
      loadBookings();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      if (err.response?.status === 403) {
        setToast({ message: '🔒 You can only cancel your own bookings', type: 'error' });
      } else if (!err.response) {
        setToast({ message: '🌐 Unable to connect to server', type: 'error' });
      } else if (err.response?.status === 404) {
        setToast({ message: '❌ Booking not found', type: 'error' });
      } else if (err.response?.status === 400) {
        setToast({ message: '❌ Cannot cancel booking in current status', type: 'error' });
      } else {
        setToast({ message: '❌ Failed to cancel booking. Please try again.', type: 'error' });
      }
    } finally {
      setIsCancelling(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Smart Campus Hub</h1>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Booking
          </button>
        </div>

        {/* Main Tabs */}
        <div className="flex space-x-8 border-b border-gray-200">
          {mainTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id)}
              className={`pb-4 px-1 text-sm font-medium transition-colors ${
                activeMainTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        {/* Page Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">Booking Management</h2>

        {/* Filter Tabs */}
        <div className="mb-6 flex space-x-6 border-b border-gray-200">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200">
            <table className="w-full">
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
              <tbody>
                {[...Array(3)].map((_, idx) => (
                  <tr key={idx} className="bg-white border-b border-gray-200 h-16">
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : error ? (
          <div className={`border rounded-lg p-6 mb-8 ${
            error.type === 'connection' 
              ? 'bg-orange-50 border-orange-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <h3 className={`text-lg font-bold mb-2 ${
              error.type === 'connection' 
                ? 'text-orange-900' 
                : 'text-red-900'
            }`}>
              {error.title}
            </h3>
            <p className={`text-sm mb-4 ${
              error.type === 'connection' 
                ? 'text-orange-800' 
                : 'text-red-800'
            }`}>
              {error.message}
            </p>
            <button
              onClick={loadBookings}
              className={`px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium ${
                error.type === 'connection'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              🔄 Retry
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'my' && "You haven't made any bookings yet."}
              {activeTab === 'pending' && "No pending booking requests waiting for approval."}
              {activeTab === 'approved' && "No approved bookings found."}
              {activeTab === 'all' && "No bookings found. Create one to get started!"}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Create Booking
            </button>
          </div>
        ) : (
          <BookingTable
            bookings={bookings}
            onApprove={handleApprove}
            onReject={handleReject}
            onCancel={handleCancel}
            isAdmin={isAdmin}
            isApproving={isApproving}
            isRejecting={isRejecting}
            isCancelling={isCancelling}
          />
        )}

        {/* Two Column Section */}
        <div className="grid grid-cols-2 gap-8">
          {/* Critical Conflicts - Placeholder */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Critical Conflicts</h3>
            <p className="text-gray-600 text-sm">No conflicts detected. All bookings are properly scheduled.</p>
          </div>

          {/* Facility Utilization - Placeholder */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Facility Utilization</h3>
            <p className="text-gray-600 text-sm">Utilization data is being loaded...</p>
          </div>
        </div>
      </div>

      {/* Create Booking Modal */}
      <CreateBookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleBookingSubmit}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default BookingManagement;
