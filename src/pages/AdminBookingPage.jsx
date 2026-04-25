import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminBookingTable from '../components/booking/admin/AdminBookingTable';
import BookingDetailsModal from '../components/booking/BookingDetailsModal';
import Toast from '../components/common/Toast';
import * as bookingService from '../services/bookingService';

// ============================================================================
// ADMIN BOOKING PAGE - Dashboard for admins to manage all booking requests
// ============================================================================

const AdminBookingPage = () => {
  const navigate = useNavigate();

  // State management
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ message: '', type: '' });

  // Load all bookings on mount and when tab changes
  useEffect(() => {
    loadBookings(activeTab === 'all' ? null : activeTab);
  }, [activeTab]);

  // Load bookings from API
  const loadBookings = async (status = null) => {
    setLoading(true);
    setError('');
    try {
      const response = await bookingService.getAllBookings(status);
      setBookings(response.data);
      filterBookings(response.data, status);
    } catch (err) {
      if (err.response?.status === 403) {
        navigate('/bookings', { replace: true });
        return;
      }

      console.error('Error loading bookings:', err);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings by status
  const filterBookings = (bookingsToFilter, status = null) => {
    let filtered = bookingsToFilter;

    if (status) {
      filtered = bookingsToFilter.filter(
        (booking) => booking.status.toLowerCase() === status.toLowerCase()
      );
    }

    setFilteredBookings(filtered);
  };

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleViewDetails = async (bookingId) => {
    try {
      const response = await bookingService.getBookingById(bookingId);
      setSelectedBooking(response.data || null);
      setDetailsOpen(true);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to load booking details.',
        type: 'error',
      });
    }
  };

  const handleDownloadReceipt = async (id) => {
    try {
      setToast({ message: 'Downloading receipt...', type: 'info' });
      await bookingService.downloadReceipt(id);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to download receipt.',
        type: 'error',
      });
    }
  };

  // Calculate pending count for live badge
  const pendingCount = bookings.filter(
    (b) => b.status.toLowerCase() === 'pending'
  ).length;

  // Helper function to get tab badge
  const getTabBadge = (tab) => {
    if (tab === 'all') {
      return null;
    }

    const count = bookings.filter(
      (b) => b.status.toLowerCase() === tab.toLowerCase()
    ).length;

    // Show live badge for pending
    if (tab === 'pending' && count > 0) {
      return (
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-semibold">{count}</span>
        </div>
      );
    }

    return <span className="text-xs font-semibold">{count}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Booking Requests
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                View resource booking requests
              </p>
            </div>

            {/* Live indicator */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-green-700">
                  {pendingCount} Live Request{pendingCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-6 border-b border-gray-200">
            {[
              { id: 'all', label: 'All Requests' },
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: 'Approved' },
              { id: 'rejected', label: 'Rejected' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {getTabBadge(tab.id)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
            <p className="text-red-700 text-sm font-medium">{error}</p>
            <button
              onClick={() => loadBookings(activeTab === 'all' ? null : activeTab)}
              className="text-red-600 hover:text-red-700 text-sm font-medium underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Bookings Table */}
        <AdminBookingTable
          bookings={filteredBookings}
          loading={loading}
          onViewDetails={handleViewDetails}
          onDownloadReceipt={handleDownloadReceipt}
        />
      </div>

      <BookingDetailsModal
        isOpen={detailsOpen}
        booking={selectedBooking}
        onDownloadReceipt={handleDownloadReceipt}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedBooking(null);
        }}
      />

      {/* Toast Notification */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: '' })}
        />
      )}
    </div>
  );
};

export default AdminBookingPage;
