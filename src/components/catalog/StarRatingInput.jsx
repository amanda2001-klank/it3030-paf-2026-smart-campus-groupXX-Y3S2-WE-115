import React from 'react';

const StarIcon = ({ filled }) => (
  <svg
    className={`h-8 w-8 transition ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.037 3.193a1 1 0 00.95.69h3.357c.969 0 1.371 1.24.588 1.81l-2.716 1.974a1 1 0 00-.364 1.118l1.037 3.193c.3.921-.755 1.688-1.538 1.118l-2.716-1.974a1 1 0 00-1.176 0l-2.716 1.974c-.783.57-1.838-.197-1.539-1.118l1.038-3.193a1 1 0 00-.364-1.118L2.167 8.62c-.783-.57-.38-1.81.588-1.81h3.357a1 1 0 00.951-.69l1.037-3.193z" />
  </svg>
);

const StarRatingInput = ({ value, onChange, disabled = false }) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            disabled={disabled}
            aria-label={`Set rating to ${starValue} out of 5`}
            className="rounded-full p-1 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <StarIcon filled={value >= starValue} />
          </button>
        );
      })}
    </div>
    <span className="text-sm font-semibold text-gray-600">
      {value ? `${value} / 5` : 'Choose a rating'}
    </span>
  </div>
);

export default StarRatingInput;
