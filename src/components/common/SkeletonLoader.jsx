import React from 'react';

/**
 * SkeletonLoader - Animated placeholder for loading table rows
 * Shows 3 rows of skeleton content while data is being fetched
 */
const SkeletonLoader = () => {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="animate-pulse">
          <tr className="bg-white border-b border-gray-200">
            <td className="px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
            </td>
            <td className="px-6 py-4">
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </td>
          </tr>
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
