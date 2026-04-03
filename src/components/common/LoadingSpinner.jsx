import React from 'react';

const LoadingSpinner = ({ label = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        <p className="font-medium text-gray-600">{label}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
