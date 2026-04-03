import React from 'react';

const PaginationControls = ({
  page,
  size,
  totalPages,
  totalElements,
  onPageChange,
  onPageSizeChange,
}) => {
  const safeTotalPages = Math.max(totalPages || 0, 1);

  return (
    <div className="flex flex-col gap-4 border-t border-gray-200 px-6 py-4 md:flex-row md:items-center md:justify-between">
      <div className="text-sm text-gray-600">
        Showing page <span className="font-semibold text-gray-900">{page + 1}</span> of{' '}
        <span className="font-semibold text-gray-900">{safeTotalPages}</span>
        <span className="mx-2 text-gray-300">|</span>
        <span className="font-semibold text-gray-900">{totalElements}</span> total records
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          Rows
          <select
            value={size}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          >
            {[5, 10, 20, 50].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 0}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page + 1 >= safeTotalPages}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaginationControls;
