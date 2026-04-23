import React from 'react';

const formatAverageRating = (averageRating) => {
  const numericValue = Number(averageRating);
  return Number.isFinite(numericValue) ? numericValue.toFixed(1) : '0.0';
};

const normalizeRatingCount = (ratingCount) => {
  const numericValue = Number(ratingCount);
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
};

const RatingSummaryBadge = ({
  averageRating,
  ratingCount,
  className = '',
  textClassName = '',
  starClassName = 'h-4 w-4 text-yellow-400',
}) => (
  <div className={`inline-flex items-center gap-1.5 whitespace-nowrap ${className}`.trim()}>
    <svg
      className={starClassName}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.037 3.193a1 1 0 00.95.69h3.357c.969 0 1.371 1.24.588 1.81l-2.716 1.974a1 1 0 00-.364 1.118l1.037 3.193c.3.921-.755 1.688-1.538 1.118l-2.716-1.974a1 1 0 00-1.176 0l-2.716 1.974c-.783.57-1.838-.197-1.539-1.118l1.038-3.193a1 1 0 00-.364-1.118L2.167 8.62c-.783-.57-.38-1.81.588-1.81h3.357a1 1 0 00.951-.69l1.037-3.193z" />
    </svg>
    <span className={textClassName}>
      {formatAverageRating(averageRating)} ({normalizeRatingCount(ratingCount)})
    </span>
  </div>
);

export default RatingSummaryBadge;
