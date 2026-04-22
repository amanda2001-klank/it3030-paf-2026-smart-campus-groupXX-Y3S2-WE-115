import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import AssetMediaPreviewDialog from '../components/catalog/AssetMediaPreviewDialog';
import CreateBookingModal from '../components/booking/user/CreateBookingModal';
import {
  downloadAssetMedia,
  getAssetById,
  previewAssetMedia,
} from '../services/catalogService';

const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
};

const formatBytes = (bytes) => {
  if (!bytes) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const getErrorMessage = (error, fallbackMessage) => {
  if (!error.response) {
    return 'Unable to reach the server. Check that the backend is running.';
  }

  if (error.response?.data?.fieldErrors?.length) {
    return error.response.data.fieldErrors.map((item) => item.message).join(' ');
  }

  return error.response?.data?.message || fallbackMessage;
};

const AssetListDetailPage = () => {
  const navigate = useNavigate();
  const { assetId } = useParams();
  const [asset, setAsset] = useState(null);
  const [thumbnailState, setThumbnailState] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [downloadingId, setDownloadingId] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [previewState, setPreviewState] = useState({
    open: false,
    loading: false,
    error: '',
    media: null,
    previewUrl: '',
  });

  useEffect(() => {
    if (!previewState.previewUrl) {
      return undefined;
    }

    return () => {
      URL.revokeObjectURL(previewState.previewUrl);
    };
  }, [previewState.previewUrl]);

  useEffect(() => {
    if (!asset?.id || !asset.media?.length) {
      setThumbnailState({});
      return undefined;
    }

    let isActive = true;
    const createdUrls = [];

    setThumbnailState(
      Object.fromEntries(
        asset.media.map((media) => [media.id, { url: '', loading: true, error: false }])
      )
    );

    const loadThumbnails = async () => {
      await Promise.all(
        asset.media.map(async (media) => {
          try {
            const response = await previewAssetMedia(asset.id, media.id);
            const url = URL.createObjectURL(response.data);

            if (!isActive) {
              URL.revokeObjectURL(url);
              return;
            }

            createdUrls.push(url);
            setThumbnailState((previous) => ({
              ...previous,
              [media.id]: { url, loading: false, error: false },
            }));
          } catch (thumbnailError) {
            if (!isActive) {
              return;
            }

            setThumbnailState((previous) => ({
              ...previous,
              [media.id]: { url: '', loading: false, error: true },
            }));
          }
        })
      );
    };

    loadThumbnails();

    return () => {
      isActive = false;
      createdUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [asset]);

  useEffect(() => {
    if (!assetId) {
      setLoading(false);
      return;
    }

    const loadAsset = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await getAssetById(assetId);
        setAsset(response.data);
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Failed to load asset record.'));
      } finally {
        setLoading(false);
      }
    };

    loadAsset();
  }, [assetId]);

  const closePreview = () => {
    setPreviewState((previous) => {
      if (previous.previewUrl) {
        URL.revokeObjectURL(previous.previewUrl);
      }

      return {
        open: false,
        loading: false,
        error: '',
        media: null,
        previewUrl: '',
      };
    });
  };

  const handlePreviewMedia = async (media) => {
    if (!asset) {
      return;
    }

    setPreviewState((previous) => {
      if (previous.previewUrl) {
        URL.revokeObjectURL(previous.previewUrl);
      }

      return {
        open: true,
        loading: true,
        error: '',
        media,
        previewUrl: '',
      };
    });

    try {
      const response = await previewAssetMedia(asset.id, media.id);
      const previewUrl = URL.createObjectURL(response.data);

      setPreviewState({
        open: true,
        loading: false,
        error: '',
        media,
        previewUrl,
      });
    } catch (previewError) {
      setPreviewState({
        open: true,
        loading: false,
        error: getErrorMessage(previewError, 'Unable to preview media.'),
        media,
        previewUrl: '',
      });
    }
  };

  const handleDownloadMedia = async (media) => {
    if (!asset) {
      return;
    }

    setDownloadingId(media.id);

    try {
      const response = await downloadAssetMedia(asset.id, media.id);
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = media.originalFileName || 'asset-media';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
    } catch (downloadError) {
      setToast({
        type: 'error',
        message: getErrorMessage(downloadError, 'Unable to download media file.'),
      });
    } finally {
      setDownloadingId('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <LoadingSpinner label="Loading asset record..." />
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-medium text-red-700">{error || 'Asset not found.'}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate('/asset-list')}
              className="rounded-2xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Back to asset list
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-2xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/asset-list')}
                className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
              >
                Back to asset list
              </button>
              <button
                type="button"
                onClick={() => setIsBookingModalOpen(true)}
                className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                Book now
              </button>
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
              Asset Record
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">{asset.assetName}</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Asset code <span className="font-semibold text-gray-900">{asset.assetCode}</span> is
              currently listed as {asset.assetType?.name || 'an unknown type'} and can be reviewed
              before the booking flow is attached.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
              <div className="mt-3">
                <StatusBadge status={asset.status} />
              </div>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Availability</p>
              <p className="mt-3 text-sm font-semibold text-gray-900">
                {asset.isBookable ? 'Bookable asset' : 'Not bookable'}
              </p>
              <p className="mt-1 text-xs text-gray-500">Updated {formatDate(asset.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-8">
        <div className="grid gap-5 xl:grid-cols-4">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Asset Type</p>
            <p className="mt-4 text-xl font-semibold text-gray-900">
              {asset.assetType?.name || 'Unassigned'}
            </p>
            <p className="mt-2 text-sm text-gray-500">{asset.assetType?.code || 'N/A'}</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Location</p>
            <p className="mt-4 text-xl font-semibold text-gray-900">
              {asset.location?.locationName || 'No linked location'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {asset.location
                ? `${asset.location.building} | Floor ${asset.location.floor} | ${asset.location.roomCode}`
                : 'Link a location to map this asset physically.'}
            </p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Capacity</p>
            <p className="mt-4 text-xl font-semibold text-gray-900">{asset.capacity ?? 'N/A'}</p>
            <p className="mt-2 text-sm text-gray-500">Expected attendee or usage count</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Media Files</p>
            <p className="mt-4 text-xl font-semibold text-gray-900">{asset.media?.length || 0}</p>
            <p className="mt-2 text-sm text-gray-500">Images or videos attached to this record</p>
          </div>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.1fr)_380px]">
          <div className="space-y-8">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Asset overview</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {asset.description || 'No description has been added for this asset yet.'}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Media library</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Preview uploaded files in a dialog or download the originals directly.
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  {asset.media?.length || 0} files
                </span>
              </div>

              {!asset.media?.length ? (
                <div className="p-12 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">No media uploaded</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    This asset does not have any uploaded images or videos yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
                  {asset.media.map((media) => {
                    const thumbnail = thumbnailState[media.id] || {
                      url: '',
                      loading: true,
                      error: false,
                    };

                    return (
                      <div
                        key={media.id}
                        className="rounded-3xl border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-300 hover:bg-blue-50"
                      >
                        <button
                          type="button"
                          onClick={() => handlePreviewMedia(media)}
                          className="block w-full text-left"
                        >
                          <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-gray-900">
                            {thumbnail.loading ? (
                              <div className="flex h-full items-center justify-center bg-gray-100 text-sm font-medium text-gray-500">
                                Loading thumbnail...
                              </div>
                            ) : thumbnail.error ? (
                              <div className="flex h-full items-center justify-center bg-red-50 px-6 text-center text-sm font-medium text-red-700">
                                Thumbnail unavailable
                              </div>
                            ) : media.mediaType === 'VIDEO' ? (
                              <video
                                className="h-full w-full object-cover"
                                src={thumbnail.url}
                                muted
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={thumbnail.url}
                                alt={media.originalFileName}
                                className="h-full w-full object-cover"
                              />
                            )}

                            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
                              <span className="rounded-full bg-gray-950/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                                {media.mediaType}
                              </span>
                              <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-gray-900">
                                Click to preview
                              </span>
                            </div>
                          </div>

                          <div className="mt-4">
                            <h3 className="truncate text-base font-semibold text-gray-900">
                              {media.originalFileName}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">{formatBytes(media.fileSize)}</p>
                          </div>
                        </button>

                        <div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Uploaded
                            </p>
                            <p className="mt-1">{formatDate(media.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Content Type
                            </p>
                            <p className="mt-1 break-all">{media.contentType || 'Unknown'}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => handleDownloadMedia(media)}
                            disabled={downloadingId === media.id}
                            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {downloadingId === media.id ? 'Downloading...' : 'Download'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Location snapshot</h2>
              {asset.location ? (
                <div className="mt-4 space-y-4 text-sm text-gray-600">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Building
                    </p>
                    <p className="mt-1 text-base font-semibold text-gray-900">{asset.location.building}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Floor</p>
                    <p className="mt-1">{asset.location.floor}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Room Code
                    </p>
                    <p className="mt-1">{asset.location.roomCode}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Address</p>
                    <p className="mt-1">{asset.location.address || 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-6 text-gray-600">
                  This asset does not have a linked location yet.
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Record metadata</h2>
              <div className="mt-4 space-y-4 text-sm text-gray-600">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Created</p>
                  <p className="mt-1">{formatDate(asset.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Last Updated
                  </p>
                  <p className="mt-1">{formatDate(asset.updatedAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Created By
                  </p>
                  <p className="mt-1 break-all">{asset.createdById || 'Unknown'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AssetMediaPreviewDialog
        isOpen={previewState.open}
        media={previewState.media}
        previewUrl={previewState.previewUrl}
        loading={previewState.loading}
        error={previewState.error}
        onClose={closePreview}
        onDownload={handleDownloadMedia}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Booking Modal */}
      <CreateBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={() => {
          setIsBookingModalOpen(false);
          setToast({ message: 'Booking created successfully!', type: 'success' });
        }}
        prefilledResource={asset}
      />
    </div>
  );
};

export default AssetListDetailPage;
