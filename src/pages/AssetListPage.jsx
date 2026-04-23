import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import PaginationControls from '../components/catalog/PaginationControls';
import RatingSummaryBadge from '../components/catalog/RatingSummaryBadge';
import { listAllAssets, previewAssetMedia, searchAssets } from '../services/catalogService';

const defaultAssetFilters = {
  query: '',
  assetTypeId: '',
  locationId: '',
  status: '',
  isBookable: '',
  minCapacity: '',
  maxCapacity: '',
  page: 0,
  size: 10,
  sortBy: 'createdAt',
  sortDir: 'desc',
};

const assetSortOptions = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'assetName', label: 'Asset Name' },
  { value: 'assetCode', label: 'Asset Code' },
  { value: 'capacity', label: 'Capacity' },
  { value: 'status', label: 'Status' },
];

const statusOptions = ['ACTIVE', 'OUT_OF_SERVICE', 'MAINTENANCE', 'INACTIVE'];

const emptyPage = (defaults) => ({
  content: [],
  page: defaults.page,
  size: defaults.size,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
  sortBy: defaults.sortBy,
  sortDir: defaults.sortDir,
});

const getErrorMessage = (error, fallbackMessage) => {
  if (!error.response) {
    return 'Unable to reach the server. Check that the backend is running.';
  }

  if (error.response?.data?.fieldErrors?.length) {
    return error.response.data.fieldErrors.map((item) => item.message).join(' ');
  }

  return error.response?.data?.message || fallbackMessage;
};

const buildAssetParams = (filters) => {
  const params = {
    page: filters.page,
    size: filters.size,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  };

  if (filters.query.trim()) {
    params.query = filters.query.trim();
  }

  if (filters.assetTypeId) {
    params.assetTypeId = filters.assetTypeId;
  }

  if (filters.locationId) {
    params.locationId = filters.locationId;
  }

  if (filters.status) {
    params.status = filters.status;
  }

  if (filters.isBookable !== '') {
    params.isBookable = filters.isBookable === 'true';
  }

  if (filters.minCapacity !== '') {
    params.minCapacity = Number(filters.minCapacity);
  }

  if (filters.maxCapacity !== '') {
    params.maxCapacity = Number(filters.maxCapacity);
  }

  return params;
};

const hasAssetSearchFilters = (filters) =>
  Boolean(
    filters.query.trim() ||
      filters.assetTypeId ||
      filters.locationId ||
      filters.status ||
      filters.isBookable !== '' ||
      filters.minCapacity !== '' ||
      filters.maxCapacity !== ''
  );

const AssetListPage = () => {
  const navigate = useNavigate();
  const [assetFilterDraft, setAssetFilterDraft] = useState(defaultAssetFilters);
  const [assetFilters, setAssetFilters] = useState(defaultAssetFilters);
  const [assetPage, setAssetPage] = useState(emptyPage(defaultAssetFilters));
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState('');
  const [thumbnailState, setThumbnailState] = useState({});
  const [toast, setToast] = useState(null);
  const [referenceOptions, setReferenceOptions] = useState({
    assetTypes: [],
    locations: [],
  });

  const loadReferenceOptions = async () => {
    try {
      const response = await listAllAssets({
        page: 0,
        size: 100,
        sortBy: 'assetName',
        sortDir: 'asc',
      });

      const assetTypes = [];
      const locations = [];
      const seenAssetTypes = new Set();
      const seenLocations = new Set();

      (response.data.content || []).forEach((asset) => {
        if (asset.assetType?.id && !seenAssetTypes.has(asset.assetType.id)) {
          seenAssetTypes.add(asset.assetType.id);
          assetTypes.push(asset.assetType);
        }

        if (asset.location?.id && !seenLocations.has(asset.location.id)) {
          seenLocations.add(asset.location.id);
          locations.push(asset.location);
        }
      });

      setReferenceOptions({ assetTypes, locations });
    } catch (error) {
      setToast({
        type: 'error',
        message: getErrorMessage(error, 'Failed to load asset list filters.'),
      });
    }
  };

  const loadAssets = async () => {
    setAssetsLoading(true);
    setAssetsError('');

    try {
      const response = hasAssetSearchFilters(assetFilters)
        ? await searchAssets(buildAssetParams(assetFilters))
        : await listAllAssets(buildAssetParams(assetFilters));

      setAssetPage(response.data);
    } catch (error) {
      setAssetsError(getErrorMessage(error, 'Failed to load assets.'));
    } finally {
      setAssetsLoading(false);
    }
  };

  useEffect(() => {
    loadReferenceOptions();
  }, []);

  useEffect(() => {
    loadAssets();
  }, [assetFilters]);

  useEffect(() => {
    if (!assetPage.content.length) {
      setThumbnailState({});
      return undefined;
    }

    let isActive = true;
    const createdUrls = [];

    setThumbnailState(
      Object.fromEntries(
        assetPage.content.map((asset) => {
          const firstImage = asset.media?.find((media) => media.mediaType === 'IMAGE');
          return [
            asset.id,
            {
              url: '',
              loading: Boolean(firstImage),
              error: false,
            },
          ];
        })
      )
    );

    const loadThumbnails = async () => {
      await Promise.all(
        assetPage.content.map(async (asset) => {
          const firstImage = asset.media?.find((media) => media.mediaType === 'IMAGE');

          if (!firstImage) {
            if (!isActive) {
              return;
            }

            setThumbnailState((previous) => ({
              ...previous,
              [asset.id]: { url: '', loading: false, error: false },
            }));
            return;
          }

          try {
            const response = await previewAssetMedia(asset.id, firstImage.id);
            const url = URL.createObjectURL(response.data);

            if (!isActive) {
              URL.revokeObjectURL(url);
              return;
            }

            createdUrls.push(url);
            setThumbnailState((previous) => ({
              ...previous,
              [asset.id]: { url, loading: false, error: false },
            }));
          } catch (error) {
            if (!isActive) {
              return;
            }

            setThumbnailState((previous) => ({
              ...previous,
              [asset.id]: { url: '', loading: false, error: true },
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
  }, [assetPage.content]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
            Student Asset List
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-gray-900">Browse campus assets</h1>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Explore all bookable and non-bookable assets, search the catalogue, and open any record
            to inspect its media, location, and operational status.
          </p>
        </div>
      </div>

      <div className="space-y-6 p-8">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Search and filter assets</h2>
          <p className="mt-1 text-sm text-gray-500">
            Use the same asset filters available in the catalogue search and browse the results as a
            card gallery.
          </p>

          <div className="mt-5 grid gap-4 xl:grid-cols-4">
            <input
              type="text"
              value={assetFilterDraft.query}
              onChange={(event) =>
                setAssetFilterDraft((previous) => ({ ...previous, query: event.target.value }))
              }
              placeholder="Search asset, type, location, or capacity"
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 xl:col-span-2"
            />
            <select
              value={assetFilterDraft.assetTypeId}
              onChange={(event) =>
                setAssetFilterDraft((previous) => ({
                  ...previous,
                  assetTypeId: event.target.value,
                }))
              }
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All asset types</option>
              {referenceOptions.assetTypes.map((assetType) => (
                <option key={assetType.id} value={assetType.id}>
                  {assetType.name}
                </option>
              ))}
            </select>
            <select
              value={assetFilterDraft.locationId}
              onChange={(event) =>
                setAssetFilterDraft((previous) => ({
                  ...previous,
                  locationId: event.target.value,
                }))
              }
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All locations</option>
              {referenceOptions.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.locationName}
                </option>
              ))}
            </select>
            <select
              value={assetFilterDraft.status}
              onChange={(event) =>
                setAssetFilterDraft((previous) => ({
                  ...previous,
                  status: event.target.value,
                }))
              }
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
            <select
              value={assetFilterDraft.isBookable}
              onChange={(event) =>
                setAssetFilterDraft((previous) => ({
                  ...previous,
                  isBookable: event.target.value,
                }))
              }
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All booking states</option>
              <option value="true">Bookable</option>
              <option value="false">Not bookable</option>
            </select>
            <input
              type="number"
              min="0"
              value={assetFilterDraft.minCapacity}
              onChange={(event) =>
                setAssetFilterDraft((previous) => ({
                  ...previous,
                  minCapacity: event.target.value,
                }))
              }
              placeholder="Min capacity"
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="number"
              min="0"
              value={assetFilterDraft.maxCapacity}
              onChange={(event) =>
                setAssetFilterDraft((previous) => ({
                  ...previous,
                  maxCapacity: event.target.value,
                }))
              }
              placeholder="Max capacity"
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={assetFilterDraft.sortBy}
              onChange={(event) =>
                setAssetFilterDraft((previous) => ({ ...previous, sortBy: event.target.value }))
              }
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {assetSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort by {option.label}
                </option>
              ))}
            </select>
            <select
              value={assetFilterDraft.sortDir}
              onChange={(event) =>
                setAssetFilterDraft((previous) => ({ ...previous, sortDir: event.target.value }))
              }
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                setAssetFilters((previous) => ({
                  ...previous,
                  ...assetFilterDraft,
                  page: 0,
                }))
              }
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              type="button"
              onClick={() => {
                setAssetFilterDraft(defaultAssetFilters);
                setAssetFilters(defaultAssetFilters);
              }}
              className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Asset gallery</h2>
              <p className="mt-1 text-sm text-gray-500">
                {hasAssetSearchFilters(assetFilters)
                  ? 'Showing filtered asset results.'
                  : 'Showing all catalogue assets.'}
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {assetPage.totalElements} assets
            </span>
          </div>

          {assetsLoading ? (
            <div className="p-8">
              <LoadingSpinner label="Loading assets..." />
            </div>
          ) : assetsError ? (
            <div className="p-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-medium text-red-700">{assetsError}</p>
                <button
                  type="button"
                  onClick={loadAssets}
                  className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : assetPage.content.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">No assets found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Try broadening the filters to explore more catalogue records.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 p-6 md:grid-cols-2 xl:grid-cols-3">
                {assetPage.content.map((asset) => {
                  const thumbnail = thumbnailState[asset.id] || {
                    url: '',
                    loading: false,
                    error: false,
                  };

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => navigate(`/asset-list/${asset.id}`)}
                      className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg"
                    >
                      <div className="relative min-h-[320px]">
                        {thumbnail.loading ? (
                          <div className="absolute inset-0 animate-pulse bg-gray-200" />
                        ) : thumbnail.url ? (
                          <img
                            src={thumbnail.url}
                            alt={asset.assetName}
                            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-slate-700 to-gray-900" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-gray-950/10" />

                        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
                          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900 backdrop-blur">
                            {asset.assetType?.name || 'Unknown type'}
                          </span>
                          <span className="rounded-full bg-gray-950/80 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                            {asset.status.replaceAll('_', ' ')}
                          </span>
                        </div>

                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                          <h3 className="text-2xl font-semibold">{asset.assetName}</h3>
                          <p className="mt-1 text-sm text-blue-50/90">{asset.assetCode}</p>
                          <div className="mt-4 flex items-center justify-between gap-3 text-xs">
                            <span
                              className={`rounded-full px-3 py-1.5 font-semibold backdrop-blur ${
                                asset.isBookable
                                  ? 'bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-300/40'
                                  : 'bg-red-500/20 text-red-100 ring-1 ring-red-300/40'
                              }`}
                            >
                              {asset.isBookable ? 'Bookable' : 'Not bookable'}
                            </span>
                            <RatingSummaryBadge
                              averageRating={asset.averageRating}
                              ratingCount={asset.ratingCount}
                              className="rounded-full bg-gray-950/75 px-3 py-1.5 backdrop-blur"
                              textClassName="text-xs font-semibold text-white"
                              starClassName="h-3.5 w-3.5 text-yellow-400"
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <PaginationControls
                page={assetPage.page}
                size={assetPage.size}
                totalPages={assetPage.totalPages}
                totalElements={assetPage.totalElements}
                onPageChange={(page) =>
                  setAssetFilters((previous) => ({
                    ...previous,
                    page: Math.max(page, 0),
                  }))
                }
                onPageSizeChange={(size) => {
                  setAssetFilterDraft((previous) => ({ ...previous, size }));
                  setAssetFilters((previous) => ({
                    ...previous,
                    size,
                    page: 0,
                  }));
                }}
              />
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AssetListPage;
