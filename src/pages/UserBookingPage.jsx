import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserBookingTable from '../components/booking/user/UserBookingTable';
import CreateBookingModal from '../components/booking/user/CreateBookingModal';
import Toast from '../components/common/Toast';
import * as bookingService from '../services/bookingService';
import { getCurrentUser, isAdmin } from '../utils/auth';

// ============================================================================
// USER BOOKING PAGE - User can view and manage their own bookings
// ============================================================================

const UserBookingPage = () => {
  const navigate = useNavigate();
  
  // State management
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Filter tabs configuration
  const filterTabs = [
    { id: 'ALL', label: 'All Bookings' },
    { id: 'PENDING', label: 'Pending Approval' },
    { id: 'APPROVED', label: 'Approved' },
  ];

  // Redirect admins to their dashboard
  useEffect(() => {
    if (isAdmin(getCurrentUser().userRole)) {
      navigate('/admin/bookings', { replace: true });
    }
  }, [navigate]);

  // Load bookings on component mount
  useEffect(() => {
    loadBookings();
  }, []);

  // Fetch user's bookings from API
  const loadBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await bookingService.getMyBookings();
      setBookings(response.data);
    } catch (err) {
      setError('Failed to load your bookings. Please try again.');
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings based on active tab
  const getFilteredBookings = () => {
    if (activeTab === 'ALL') {
      return bookings;
    }
    return bookings.filter((booking) => booking.status === activeTab);
  };

  const filteredBookings = getFilteredBookings();

  // Handle modal close
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Handle new booking submission
  const handleBookingSuccess = () => {
    setToast({ message: 'Booking created successfully!', type: 'success' });
    handleCloseModal();
    loadBookings(); // Refresh the list
  };

  // Handle cancel booking
  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await bookingService.cancelBooking(id);
      setToast({ message: 'Booking cancelled successfully!', type: 'success' });
      loadBookings();
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || 'Failed to cancel booking',
        type: 'error'
      });
      console.error('Error cancelling booking:', err);
    }
  };

  // Handle download receipt
  const handleDownloadReceipt = async (id) => {
    try {
      setToast({ message: 'Downloading receipt...', type: 'info' });
      await bookingService.downloadReceipt(id);
    } catch (err) {
      setToast({ 
        message: err.response?.data?.message || 'Failed to download receipt',
        type: 'error'
      });
      console.error('Error downloading receipt:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            {!isAdmin(getCurrentUser().userRole) && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                + New Booking
              </button>
            )}
          </div>
          <p className="text-gray-600">Manage your resource booking requests</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
            <button
              onClick={loadBookings}
              className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Bookings Table or Empty State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">📅</div>
            <p className="text-gray-500 text-lg">You have no bookings yet</p>
            <p className="text-gray-400 text-sm mt-2">Create a new booking to get started</p>
          </div>
        ) : (
          <UserBookingTable
            bookings={filteredBookings}
            onCancel={handleCancel}
            onDownloadReceipt={handleDownloadReceipt}
            loading={loading}
          />
        )}
      </div>

      {/* Create Booking Modal */}
      <CreateBookingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleBookingSuccess}
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

export default UserBookingPage;
