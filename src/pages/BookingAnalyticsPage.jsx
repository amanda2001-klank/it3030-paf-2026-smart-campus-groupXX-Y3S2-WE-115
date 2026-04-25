import React, { useEffect, useState } from 'react';
import AssetUsageAnalyticsPanel from '../components/booking/AssetUsageAnalyticsPanel';
import * as bookingService from '../services/bookingService';
import { getCurrentUser, USER_ROLES } from '../utils/auth';

const BookingAnalyticsPage = () => {
  const currentRole = getCurrentUser().userRole || USER_ROLES.USER;
  const [usagePeriod, setUsagePeriod] = useState('WEEKLY');
  const [usageAnalytics, setUsageAnalytics] = useState(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageError, setUsageError] = useState('');

  const loadUsageAnalytics = async (period = usagePeriod) => {
    setUsageLoading(true);
    setUsageError('');

    try {
      const response = await bookingService.getAssetUsageAnalytics(period);
      setUsageAnalytics(response.data || null);
    } catch (err) {
      setUsageError(err.response?.data?.message || 'Failed to load usage analytics.');
    } finally {
      setUsageLoading(false);
    }
  };

  useEffect(() => {
    loadUsageAnalytics(usagePeriod);
  }, [usagePeriod]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {currentRole === USER_ROLES.ADMIN ? 'Admin Insights' : 'Asset Manager Insights'}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Booking Analytics</h1>
          <p className="mt-1 text-sm text-gray-600">
            Analyze weekly and monthly asset usage trends through charts and detailed tables.
          </p>
        </div>

        <AssetUsageAnalyticsPanel
          data={usageAnalytics}
          period={usagePeriod}
          loading={usageLoading}
          error={usageError}
          onPeriodChange={setUsagePeriod}
          onRetry={() => loadUsageAnalytics(usagePeriod)}
          sectionId="usage-analytics"
        />
      </div>
    </div>
  );
};

export default BookingAnalyticsPage;