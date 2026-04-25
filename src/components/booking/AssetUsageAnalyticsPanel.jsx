import React from 'react';

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatNumber = (value) => Number(value || 0).toLocaleString('en-US');

const formatHours = (value) => Number(value || 0).toFixed(2);

const AssetUsageAnalyticsPanel = ({
  data,
  period,
  loading,
  error,
  onPeriodChange,
  onRetry,
  sectionId = 'usage-analytics',
}) => {
  const assets = data?.assets || [];
  const maxBookings = Math.max(...assets.map((item) => item.totalBookings), 1);

  return (
    <section id={sectionId} className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Asset Usage Analytics</h3>
          <p className="mt-1 text-sm text-gray-600">
            Review weekly or monthly usage trends to understand booking demand by asset.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {['WEEKLY', 'MONTHLY'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onPeriodChange(option)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                period === option
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option === 'WEEKLY' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          <div className="h-5 w-52 animate-pulse rounded bg-gray-200" />
          <div className="h-40 animate-pulse rounded bg-gray-100" />
          <div className="h-32 animate-pulse rounded bg-gray-100" />
        </div>
      ) : error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">Failed to load analytics</p>
          <p className="mt-1 text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <article className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Total Bookings</p>
              <p className="mt-2 text-2xl font-bold text-blue-900">{formatNumber(data?.totalBookings)}</p>
            </article>
            <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Total Hours</p>
              <p className="mt-2 text-2xl font-bold text-emerald-900">{formatHours(data?.totalBookedHours)}</p>
            </article>
            <article className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-700">Range</p>
              <p className="mt-2 text-xs font-medium text-gray-800">
                {formatDateTime(data?.rangeStart)} - {formatDateTime(data?.rangeEnd)}
              </p>
            </article>
          </div>

          <div className="mt-6 rounded-xl border border-gray-200 p-4">
            <h4 className="text-sm font-semibold text-gray-900">Booking Count by Asset</h4>
            {assets.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No booking usage data in this period.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {assets.slice(0, 8).map((item) => {
                  const widthPercent = Math.max((item.totalBookings / maxBookings) * 100, 5);
                  return (
                    <div key={item.resourceId}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-medium text-gray-700">{item.resourceName}</p>
                        <p className="text-xs font-semibold text-gray-900">{item.totalBookings}</p>
                      </div>
                      <div className="h-2 rounded bg-gray-100">
                        <div className="h-2 rounded bg-blue-600" style={{ width: `${widthPercent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full min-w-[960px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Bookings</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Hours</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Approved</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Pending</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Rejected</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Cancelled</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Share %</th>
                </tr>
              </thead>
              <tbody>
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-6 text-center text-sm text-gray-500">
                      No analytics rows available.
                    </td>
                  </tr>
                ) : (
                  assets.map((item) => (
                    <tr key={item.resourceId} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.resourceName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatNumber(item.totalBookings)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatHours(item.bookedHours)}</td>
                      <td className="px-4 py-3 text-sm text-emerald-700">{formatNumber(item.approvedBookings)}</td>
                      <td className="px-4 py-3 text-sm text-amber-700">{formatNumber(item.pendingBookings)}</td>
                      <td className="px-4 py-3 text-sm text-red-700">{formatNumber(item.rejectedBookings)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{formatNumber(item.cancelledBookings)}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-blue-700">{Number(item.bookingSharePercent || 0).toFixed(2)}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
};

export default AssetUsageAnalyticsPanel;
