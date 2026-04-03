import React from 'react';

const formatBytes = (bytes) => {
  if (!bytes) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const AssetMediaPreviewDialog = ({
  isOpen,
  media,
  previewUrl,
  loading,
  error,
  onClose,
  onDownload,
}) => {
  if (!isOpen || !media) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 px-4 py-8">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
              Asset Media Preview
            </p>
            <h3 className="mt-2 truncate text-xl font-semibold text-gray-900">
              {media.originalFileName}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {media.mediaType} | {formatBytes(media.fileSize)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              onClick={() => onDownload(media)}
              className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>

        <div className="grid flex-1 gap-6 overflow-y-auto bg-gray-50 p-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-gray-200 bg-white p-6">
            {loading ? (
              <p className="text-sm font-medium text-gray-500">Loading preview...</p>
            ) : error ? (
              <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-sm font-medium text-red-700">{error}</p>
              </div>
            ) : previewUrl ? (
              media.mediaType === 'VIDEO' ? (
                <video
                  controls
                  className="max-h-[70vh] w-full rounded-2xl bg-black"
                  src={previewUrl}
                >
                  Your browser does not support video playback.
                </video>
              ) : (
                <img
                  src={previewUrl}
                  alt={media.originalFileName}
                  className="max-h-[70vh] w-full rounded-2xl object-contain"
                />
              )
            ) : (
              <p className="text-sm text-gray-500">Preview is not available.</p>
            )}
          </div>

          <div className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                Media Details
              </p>
              <div className="mt-4 space-y-3 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-900">Original file name</p>
                  <p className="mt-1 break-all">{media.originalFileName}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Content type</p>
                  <p className="mt-1 break-all">{media.contentType || 'Unknown'}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">File size</p>
                  <p className="mt-1">{formatBytes(media.fileSize)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900">Stored path</p>
                  <p className="mt-1 break-all text-xs text-gray-500">{media.relativePath}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="text-sm font-medium text-blue-900">Usage</p>
              <p className="mt-2 text-sm leading-6 text-blue-800">
                Use preview to inspect the current upload, then download the original file if it needs
                to be shared or archived.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetMediaPreviewDialog;
