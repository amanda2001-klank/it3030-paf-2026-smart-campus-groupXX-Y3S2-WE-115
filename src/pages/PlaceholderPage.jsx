import React from 'react';

const PlaceholderPage = ({ title, description }) => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
          Module Workspace
        </p>
        <h1 className="mt-4 text-3xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600">{description}</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;
