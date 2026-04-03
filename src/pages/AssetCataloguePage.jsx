import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Toast from '../components/common/Toast';
import AssetFormModal from '../components/catalog/AssetFormModal';
import AssetTypeFormModal from '../components/catalog/AssetTypeFormModal';
import LocationFormModal from '../components/catalog/LocationFormModal';
import PaginationControls from '../components/catalog/PaginationControls';
import {
  createAsset,
  createAssetType,
  createLocation,
  deleteAsset,
  deleteAssetType,
  deleteLocation,
  getAssetById,
  getAssetTypeById,
  getLocationById,
  listAllAssets,
  listAssetTypes,
  listLocations,
  searchAssets,
  updateAsset,
  updateAssetType,
  updateLocation,
} from '../services/catalogService';
import { canManageCatalogue, ensureMockUser, formatRoleLabel, getMockUser } from '../utils/mockAuth';

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

const defaultLocationFilters = {
  query: '',
  building: '',
  floor: '',
  roomCode: '',
  page: 0,
  size: 10,
  sortBy: 'createdAt',
  sortDir: 'desc',
};

const defaultAssetTypeFilters = {
  query: '',
  code: '',
  page: 0,
  size: 10,
  sortBy: 'name',
  sortDir: 'asc',
};

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

const sectionTabs = [
  { id: 'assets', label: 'Assets', helper: 'Catalogue records, media, and availability.' },
  { id: 'locations', label: 'Locations', helper: 'Buildings, floors, and room references.' },
  { id: 'types', label: 'Asset Types', helper: 'Taxonomy used to classify resources.' },
];

const assetSortOptions = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'assetName', label: 'Asset Name' },
  { value: 'assetCode', label: 'Asset Code' },
  { value: 'capacity', label: 'Capacity' },
  { value: 'status', label: 'Status' },
];

const locationSortOptions = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'locationName', label: 'Location Name' },
  { value: 'building', label: 'Building' },
  { value: 'floor', label: 'Floor' },
  { value: 'roomCode', label: 'Room Code' },
];

const assetTypeSortOptions = [
  { value: 'name', label: 'Name' },
  { value: 'code', label: 'Code' },
];

const statusOptions = ['ACTIVE', 'OUT_OF_SERVICE', 'MAINTENANCE', 'INACTIVE'];

const getErrorMessage = (error, fallbackMessage) => {
  if (!error.response) {
    return 'Unable to reach the server. Check that the backend is running.';
  }

  if (error.response?.data?.fieldErrors?.length) {
    return error.response.data.fieldErrors.map((item) => item.message).join(' ');
  }

  return error.response?.data?.message || fallbackMessage;
};

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

const buildLocationParams = (filters) => {
  const params = {
    page: filters.page,
    size: filters.size,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  };

  if (filters.query.trim()) {
    params.query = filters.query.trim();
  }

  if (filters.building.trim()) {
    params.building = filters.building.trim();
  }

  if (filters.floor.trim()) {
    params.floor = filters.floor.trim();
  }

  if (filters.roomCode.trim()) {
    params.roomCode = filters.roomCode.trim();
  }

  return params;
};

const buildAssetTypeParams = (filters) => {
  const params = {
    page: filters.page,
    size: filters.size,
    sortBy: filters.sortBy,
    sortDir: filters.sortDir,
  };

  if (filters.query.trim()) {
    params.query = filters.query.trim();
  }

  if (filters.code.trim()) {
    params.code = filters.code.trim();
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

const AssetCataloguePage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('assets');
  const [toast, setToast] = useState(null);
  const [overview, setOverview] = useState({
    totalAssets: 0,
    activeAssets: 0,
    locationCount: 0,
    assetTypeCount: 0,
  });
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [referenceOptions, setReferenceOptions] = useState({
    assetTypes: [],
    locations: [],
  });

  const [assetFilterDraft, setAssetFilterDraft] = useState(defaultAssetFilters);
  const [assetFilters, setAssetFilters] = useState(defaultAssetFilters);
  const [assetPage, setAssetPage] = useState(emptyPage(defaultAssetFilters));
  const [assetsLoading, setAssetsLoading] = useState(true);
  const [assetsError, setAssetsError] = useState('');
  const [assetModal, setAssetModal] = useState({ open: false, mode: 'create', data: null });
  const [assetSubmitting, setAssetSubmitting] = useState(false);
  const [assetActionLoading, setAssetActionLoading] = useState('');

  const [locationFilterDraft, setLocationFilterDraft] = useState(defaultLocationFilters);
  const [locationFilters, setLocationFilters] = useState(defaultLocationFilters);
  const [locationPage, setLocationPage] = useState(emptyPage(defaultLocationFilters));
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [locationsError, setLocationsError] = useState('');
  const [locationModal, setLocationModal] = useState({ open: false, mode: 'create', data: null });
  const [locationSubmitting, setLocationSubmitting] = useState(false);
  const [locationActionLoading, setLocationActionLoading] = useState('');

  const [assetTypeFilterDraft, setAssetTypeFilterDraft] = useState(defaultAssetTypeFilters);
  const [assetTypeFilters, setAssetTypeFilters] = useState(defaultAssetTypeFilters);
  const [assetTypePage, setAssetTypePage] = useState(emptyPage(defaultAssetTypeFilters));
  const [assetTypesLoading, setAssetTypesLoading] = useState(true);
  const [assetTypesError, setAssetTypesError] = useState('');
  const [assetTypeModal, setAssetTypeModal] = useState({ open: false, mode: 'create', data: null });
  const [assetTypeSubmitting, setAssetTypeSubmitting] = useState(false);
  const [assetTypeActionLoading, setAssetTypeActionLoading] = useState('');

  const [currentUser, setCurrentUser] = useState(() => ensureMockUser());
  const hasCatalogueAccess = canManageCatalogue(currentUser.userRole);

  useEffect(() => {
    setCurrentUser(ensureMockUser());
  }, []);

  const loadOverview = async () => {
    setOverviewLoading(true);

    try {
      const [assetsResponse, activeAssetsResponse, locationsResponse, assetTypesResponse] =
        await Promise.all([
          listAllAssets({ page: 0, size: 1, sortBy: 'createdAt', sortDir: 'desc' }),
          searchAssets({ status: 'ACTIVE', page: 0, size: 1, sortBy: 'createdAt', sortDir: 'desc' }),
          listLocations({ page: 0, size: 1, sortBy: 'createdAt', sortDir: 'desc' }),
          listAssetTypes({ page: 0, size: 1, sortBy: 'name', sortDir: 'asc' }),
        ]);

      setOverview({
        totalAssets: assetsResponse.data.totalElements,
        activeAssets: activeAssetsResponse.data.totalElements,
        locationCount: locationsResponse.data.totalElements,
        assetTypeCount: assetTypesResponse.data.totalElements,
      });
    } catch (error) {
      setOverview({
        totalAssets: 0,
        activeAssets: 0,
        locationCount: 0,
        assetTypeCount: 0,
      });
    } finally {
      setOverviewLoading(false);
    }
  };

  const loadReferenceOptions = async () => {
    try {
      const [assetTypesResponse, locationsResponse] = await Promise.all([
        listAssetTypes({ page: 0, size: 100, sortBy: 'name', sortDir: 'asc' }),
        listLocations({ page: 0, size: 100, sortBy: 'createdAt', sortDir: 'desc' }),
      ]);

      setReferenceOptions({
        assetTypes: assetTypesResponse.data.content || [],
        locations: locationsResponse.data.content || [],
      });
    } catch (error) {
      setToast({
        type: 'error',
        message: getErrorMessage(error, 'Failed to load catalogue reference data.'),
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

  const loadLocations = async () => {
    setLocationsLoading(true);
    setLocationsError('');

    try {
      const response = await listLocations(buildLocationParams(locationFilters));
      setLocationPage(response.data);
    } catch (error) {
      setLocationsError(getErrorMessage(error, 'Failed to load locations.'));
    } finally {
      setLocationsLoading(false);
    }
  };

  const loadAssetTypes = async () => {
    setAssetTypesLoading(true);
    setAssetTypesError('');

    try {
      const response = await listAssetTypes(buildAssetTypeParams(assetTypeFilters));
      setAssetTypePage(response.data);
    } catch (error) {
      setAssetTypesError(getErrorMessage(error, 'Failed to load asset types.'));
    } finally {
      setAssetTypesLoading(false);
    }
  };

  useEffect(() => {
    if (!hasCatalogueAccess) {
      return;
    }

    loadReferenceOptions();
    loadOverview();
  }, [hasCatalogueAccess]);

  useEffect(() => {
    if (hasCatalogueAccess) {
      loadAssets();
    }
  }, [assetFilters, hasCatalogueAccess]);

  useEffect(() => {
    if (hasCatalogueAccess) {
      loadLocations();
    }
  }, [locationFilters, hasCatalogueAccess]);

  useEffect(() => {
    if (hasCatalogueAccess) {
      loadAssetTypes();
    }
  }, [assetTypeFilters, hasCatalogueAccess]);

  const openCreateModal = () => {
    if (activeSection === 'assets') {
      setAssetModal({ open: true, mode: 'create', data: null });
      return;
    }

    if (activeSection === 'locations') {
      setLocationModal({ open: true, mode: 'create', data: null });
      return;
    }

    setAssetTypeModal({ open: true, mode: 'create', data: null });
  };

  const handleAssetSave = async (payload) => {
    setAssetSubmitting(true);

    try {
      if (assetModal.mode === 'edit' && assetModal.data?.id) {
        await updateAsset(assetModal.data.id, payload);
        setToast({ type: 'success', message: 'Asset updated successfully.' });
      } else {
        await createAsset(payload);
        setToast({ type: 'success', message: 'Asset created successfully.' });
      }

      setAssetModal({ open: false, mode: 'create', data: null });
      await Promise.all([loadAssets(), loadOverview()]);
    } catch (error) {
      setToast({
        type: 'error',
        message: getErrorMessage(error, 'Unable to save asset.'),
      });
    } finally {
      setAssetSubmitting(false);
    }
  };

  const handleLocationSave = async (payload) => {
    setLocationSubmitting(true);

    try {
      if (locationModal.mode === 'edit' && locationModal.data?.id) {
        await updateLocation(locationModal.data.id, payload);
        setToast({ type: 'success', message: 'Location updated successfully.' });
      } else {
        await createLocation(payload);
        setToast({ type: 'success', message: 'Location created successfully.' });
      }

      setLocationModal({ open: false, mode: 'create', data: null });
      await Promise.all([loadLocations(), loadReferenceOptions(), loadOverview()]);
    } catch (error) {
      setToast({
        type: 'error',
        message: getErrorMessage(error, 'Unable to save location.'),
      });
    } finally {
      setLocationSubmitting(false);
    }
  };

  const handleAssetTypeSave = async (payload) => {
    setAssetTypeSubmitting(true);

    try {
      if (assetTypeModal.mode === 'edit' && assetTypeModal.data?.id) {
        await updateAssetType(assetTypeModal.data.id, payload);
        setToast({ type: 'success', message: 'Asset type updated successfully.' });
      } else {
        await createAssetType(payload);
        setToast({ type: 'success', message: 'Asset type created successfully.' });
      }

      setAssetTypeModal({ open: false, mode: 'create', data: null });
      await Promise.all([loadAssetTypes(), loadReferenceOptions(), loadOverview()]);
    } catch (error) {
      setToast({
        type: 'error',
        message: getErrorMessage(error, 'Unable to save asset type.'),
      });
    } finally {
      setAssetTypeSubmitting(false);
    }
  };

  const handleEditAsset = async (assetId) => {
    setAssetActionLoading(`edit-${assetId}`);

    try {
      const response = await getAssetById(assetId);
      setAssetModal({ open: true, mode: 'edit', data: response.data });
    } catch (error) {
      setToast({
        type: 'error',
        message: getErrorMessage(error, 'Unable to load asset details.'),
      });
    } finally {
      setAssetActionLoading('');
    }
  };

  const handleOpenAssetRecord = (assetId) => {
    navigate(`/assets/${assetId}`);
  };

  const handleEditLocation = async (locationId) => {
    setLocationActionLoading(`edit-${locationId}`);

    try {
      const response = await getLocationById(locationId);
      setLocationModal({ open: true, mode: 'edit', data: response.data });
    } catch (error) {
      setToast({
        type: 'error',
        message: getErrorMessage(error, 'Unable to load location details.'),
      });
    } finally {
      setLocationActionLoading('');
    }
  };

  const handleEditAssetType = async (assetTypeId) => {
    setAssetTypeActionLoading(`edit-${assetTypeId}`);

    try {
      const response = await getAssetTypeById(assetTypeId);
      setAssetTypeModal({ open: true, mode: 'edit', data: response.data });
    } catch (error) {
      setToast({
        type: 'error',
        message: getErrorMessage(error, 'Unable to load asset type details.'),
      });
    } finally {
      setAssetTypeActionLoading('');
    }
  };

  const handleDeleteAsset = async (assetId, assetName) => {
    if (!window.confirm(`Delete asset "${assetName}"?`)) {
      return;
    }

    setAssetActionLoading(`delete-${assetId}`);

    try {
      await deleteAsset(assetId);
      setToast({ type: 'success', message: 'Asset deleted successfully.' });
      await Promise.all([loadAssets(), loadOverview()]);
    } catch (error) {
      setToast({
        type: 'error',
        message: getErrorMessage(error, 'Unable to delete asset.'),
      });
    } finally {
      setAssetActionLoading('');
    }
  };

  const handleDeleteLocation = async (locationId, locationName) => {
    if (!window.confirm(`Delete location "${locationName}"?`)) {
      return;
    }

    setLocationActionLoading(`delete-${locationId}`);

    try {
      await deleteLocation(locationId);
      setToast({ type: 'success', message: 'Location deleted successfully.' });
      await Promise.all([loadLocations(), loadReferenceOptions(), loadOverview()]);
    } catch (error) {
      setToast({
        type: 'error',
        message: getErrorMessage(error, 'Unable to delete location.'),
      });
    } finally {
      setLocationActionLoading('');
    }
  };

  const handleDeleteAssetType = async (assetTypeId, assetTypeName) => {
    if (!window.confirm(`Delete asset type "${assetTypeName}"?`)) {
      return;
    }

    setAssetTypeActionLoading(`delete-${assetTypeId}`);

    try {
      await deleteAssetType(assetTypeId);
      setToast({ type: 'success', message: 'Asset type deleted successfully.' });
      await Promise.all([loadAssetTypes(), loadReferenceOptions(), loadOverview()]);
    } catch (error) {
      setToast({
        type: 'error',
        message: getErrorMessage(error, 'Unable to delete asset type.'),
      });
    } finally {
      setAssetTypeActionLoading('');
    }
  };

  const renderAssetsSection = () => {
    if (assetsLoading) {
      return (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <LoadingSpinner label="Loading assets..." />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Search and filter assets</h2>
          <p className="mt-1 text-sm text-gray-500">
            Query by text, narrow by asset type or location, and page through results.
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
                setAssetFilterDraft((previous) => ({ ...previous, status: event.target.value }))
              }
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Any status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
            <select
              value={assetFilterDraft.isBookable}
              onChange={(event) =>
                setAssetFilterDraft((previous) => ({ ...previous, isBookable: event.target.value }))
              }
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Any booking state</option>
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
              <h2 className="text-xl font-semibold text-gray-900">Asset inventory</h2>
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

          {assetsError ? (
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
                Create a new asset or adjust the filters to broaden the catalogue results.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Asset
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Capacity
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Media
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Updated
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assetPage.content.map((asset) => (
                      <tr
                        key={asset.id}
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => handleOpenAssetRecord(asset.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleOpenAssetRecord(asset.id);
                          }
                        }}
                        tabIndex={0}
                      >
                        <td className="px-6 py-4 align-top">
                          <p className="text-sm font-semibold text-gray-900">{asset.assetName}</p>
                          <p className="mt-1 text-xs text-gray-500">{asset.assetCode}</p>
                          <p className="mt-2 text-xs text-gray-500">
                            {asset.isBookable ? 'Bookable' : 'Not bookable'}
                          </p>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-gray-700">
                          <p>{asset.assetType?.name || 'Unassigned'}</p>
                          <p className="mt-1 text-xs text-gray-500">{asset.assetType?.code || 'N/A'}</p>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-gray-700">
                          {asset.location ? (
                            <>
                              <p>{asset.location.locationName}</p>
                              <p className="mt-1 text-xs text-gray-500">
                                {asset.location.building} | Floor {asset.location.floor} |{' '}
                                {asset.location.roomCode}
                              </p>
                            </>
                          ) : (
                            <span className="text-xs text-gray-500">No linked location</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-gray-700">
                          {asset.capacity ?? 'N/A'}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <StatusBadge status={asset.status} />
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-gray-700">
                          {asset.media?.length || 0} files
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-gray-700">
                          {formatDate(asset.updatedAt)}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleOpenAssetRecord(asset.id);
                              }}
                              className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                            >
                              Open
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEditAsset(asset.id);
                              }}
                              disabled={Boolean(assetActionLoading)}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {assetActionLoading === `edit-${asset.id}` ? 'Loading...' : 'Edit'}
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteAsset(asset.id, asset.assetName);
                              }}
                              disabled={Boolean(assetActionLoading)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {assetActionLoading === `delete-${asset.id}` ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
    );
  };

  const renderLocationsSection = () => {
    if (locationsLoading) {
      return (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <LoadingSpinner label="Loading locations..." />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Location filters</h2>
          <p className="mt-1 text-sm text-gray-500">
            Search room records and narrow by building, floor, or room code.
          </p>

          <div className="mt-5 grid gap-4 xl:grid-cols-4">
            <input
              type="text"
              value={locationFilterDraft.query}
              onChange={(event) =>
                setLocationFilterDraft((previous) => ({ ...previous, query: event.target.value }))
              }
              placeholder="Search building, room, or address"
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 xl:col-span-2"
            />
            <input
              type="text"
              value={locationFilterDraft.building}
              onChange={(event) =>
                setLocationFilterDraft((previous) => ({
                  ...previous,
                  building: event.target.value,
                }))
              }
              placeholder="Building"
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="text"
              value={locationFilterDraft.floor}
              onChange={(event) =>
                setLocationFilterDraft((previous) => ({ ...previous, floor: event.target.value }))
              }
              placeholder="Floor"
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <input
              type="text"
              value={locationFilterDraft.roomCode}
              onChange={(event) =>
                setLocationFilterDraft((previous) => ({
                  ...previous,
                  roomCode: event.target.value,
                }))
              }
              placeholder="Room code"
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={locationFilterDraft.sortBy}
              onChange={(event) =>
                setLocationFilterDraft((previous) => ({ ...previous, sortBy: event.target.value }))
              }
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {locationSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort by {option.label}
                </option>
              ))}
            </select>
            <select
              value={locationFilterDraft.sortDir}
              onChange={(event) =>
                setLocationFilterDraft((previous) => ({ ...previous, sortDir: event.target.value }))
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
                setLocationFilters((previous) => ({
                  ...previous,
                  ...locationFilterDraft,
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
                setLocationFilterDraft(defaultLocationFilters);
                setLocationFilters(defaultLocationFilters);
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
              <h2 className="text-xl font-semibold text-gray-900">Location directory</h2>
              <p className="mt-1 text-sm text-gray-500">Manage physical spaces linked to assets.</p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {locationPage.totalElements} locations
            </span>
          </div>

          {locationsError ? (
            <div className="p-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-medium text-red-700">{locationsError}</p>
                <button
                  type="button"
                  onClick={loadLocations}
                  className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : locationPage.content.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">No locations found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Add a location to start linking assets to campus spaces.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Building
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Floor / Room
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Address
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {locationPage.content.map((location) => (
                      <tr key={location.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 align-top">
                          <p className="text-sm font-semibold text-gray-900">{location.locationName}</p>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-gray-700">{location.building}</td>
                        <td className="px-6 py-4 align-top text-sm text-gray-700">
                          Floor {location.floor} | {location.roomCode}
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-gray-700">{location.address || 'N/A'}</td>
                        <td className="px-6 py-4 align-top text-sm text-gray-700">
                          {formatDate(location.createdAt)}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditLocation(location.id)}
                              disabled={Boolean(locationActionLoading)}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {locationActionLoading === `edit-${location.id}` ? 'Loading...' : 'Edit'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteLocation(location.id, location.locationName)}
                              disabled={Boolean(locationActionLoading)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {locationActionLoading === `delete-${location.id}`
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                page={locationPage.page}
                size={locationPage.size}
                totalPages={locationPage.totalPages}
                totalElements={locationPage.totalElements}
                onPageChange={(page) =>
                  setLocationFilters((previous) => ({
                    ...previous,
                    page: Math.max(page, 0),
                  }))
                }
                onPageSizeChange={(size) => {
                  setLocationFilterDraft((previous) => ({ ...previous, size }));
                  setLocationFilters((previous) => ({
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
    );
  };

  const renderAssetTypesSection = () => {
    if (assetTypesLoading) {
      return (
        <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
          <LoadingSpinner label="Loading asset types..." />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Asset type filters</h2>
          <p className="mt-1 text-sm text-gray-500">
            Search the asset taxonomy by code or name and page through the results.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-4">
            <input
              type="text"
              value={assetTypeFilterDraft.query}
              onChange={(event) =>
                setAssetTypeFilterDraft((previous) => ({ ...previous, query: event.target.value }))
              }
              placeholder="Search name or code"
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 lg:col-span-2"
            />
            <input
              type="text"
              value={assetTypeFilterDraft.code}
              onChange={(event) =>
                setAssetTypeFilterDraft((previous) => ({ ...previous, code: event.target.value }))
              }
              placeholder="Code"
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <select
              value={assetTypeFilterDraft.sortBy}
              onChange={(event) =>
                setAssetTypeFilterDraft((previous) => ({ ...previous, sortBy: event.target.value }))
              }
              className="rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {assetTypeSortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Sort by {option.label}
                </option>
              ))}
            </select>
            <select
              value={assetTypeFilterDraft.sortDir}
              onChange={(event) =>
                setAssetTypeFilterDraft((previous) => ({ ...previous, sortDir: event.target.value }))
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
                setAssetTypeFilters((previous) => ({
                  ...previous,
                  ...assetTypeFilterDraft,
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
                setAssetTypeFilterDraft(defaultAssetTypeFilters);
                setAssetTypeFilters(defaultAssetTypeFilters);
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
              <h2 className="text-xl font-semibold text-gray-900">Asset types</h2>
              <p className="mt-1 text-sm text-gray-500">
                Maintain the set of resource categories used across the catalogue.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {assetTypePage.totalElements} types
            </span>
          </div>

          {assetTypesError ? (
            <div className="p-6">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <p className="text-sm font-medium text-red-700">{assetTypesError}</p>
                <button
                  type="button"
                  onClick={loadAssetTypes}
                  className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : assetTypePage.content.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">No asset types found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Create a type such as LAB or PROJECTOR to organize the catalogue.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Code
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {assetTypePage.content.map((assetType) => (
                      <tr key={assetType.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{assetType.code}</td>
                        <td className="px-6 py-4 text-sm text-gray-700">{assetType.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditAssetType(assetType.id)}
                              disabled={Boolean(assetTypeActionLoading)}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {assetTypeActionLoading === `edit-${assetType.id}` ? 'Loading...' : 'Edit'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAssetType(assetType.id, assetType.name)}
                              disabled={Boolean(assetTypeActionLoading)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {assetTypeActionLoading === `delete-${assetType.id}`
                                ? 'Deleting...'
                                : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                page={assetTypePage.page}
                size={assetTypePage.size}
                totalPages={assetTypePage.totalPages}
                totalElements={assetTypePage.totalElements}
                onPageChange={(page) =>
                  setAssetTypeFilters((previous) => ({
                    ...previous,
                    page: Math.max(page, 0),
                  }))
                }
                onPageSizeChange={(size) => {
                  setAssetTypeFilterDraft((previous) => ({ ...previous, size }));
                  setAssetTypeFilters((previous) => ({
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
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600">
              Facilities & Assets Catalogue
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-gray-900">Asset operations workspace</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600">
              Manage asset records, supporting locations, and asset types from one module. Current
              mock access is running as <span className="font-semibold text-gray-900">{currentUser.userName}</span>{' '}
              ({formatRoleLabel(currentUser.userRole)}).
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            disabled={!hasCatalogueAccess}
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {activeSection === 'assets'
              ? 'New Asset'
              : activeSection === 'locations'
                ? 'New Location'
                : 'New Asset Type'}
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {sectionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                activeSection === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <p>{tab.label}</p>
              <p
                className={`mt-1 text-xs ${
                  activeSection === tab.id ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {tab.helper}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-8 p-8">
        <div className="grid gap-5 lg:grid-cols-4">
          {[
            { label: 'Total Assets', value: overview.totalAssets, helper: 'All catalogue records' },
            { label: 'Active Assets', value: overview.activeAssets, helper: 'Currently in service' },
            { label: 'Locations', value: overview.locationCount, helper: 'Campus spaces mapped' },
            { label: 'Asset Types', value: overview.assetTypeCount, helper: 'Classification entries' },
          ].map((card) => (
            <div key={card.label} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">{card.label}</p>
              <p className="mt-4 text-3xl font-semibold text-gray-900">
                {overviewLoading ? '--' : card.value}
              </p>
              <p className="mt-2 text-sm text-gray-500">{card.helper}</p>
            </div>
          ))}
        </div>

        {!hasCatalogueAccess ? (
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8">
            <h2 className="text-xl font-semibold text-amber-900">Catalogue access is restricted</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-800">
              This module currently allows only ADMIN and ASSET_MANAGER access. Update the mock role
              in local storage if you need to keep working on the catalogue screens.
            </p>
          </div>
        ) : activeSection === 'assets' ? (
          renderAssetsSection()
        ) : activeSection === 'locations' ? (
          renderLocationsSection()
        ) : (
          renderAssetTypesSection()
        )}
      </div>

      <AssetFormModal
        isOpen={assetModal.open}
        mode={assetModal.mode}
        initialData={assetModal.data}
        assetTypes={referenceOptions.assetTypes}
        locations={referenceOptions.locations}
        onClose={() => setAssetModal({ open: false, mode: 'create', data: null })}
        onSubmit={handleAssetSave}
        isSubmitting={assetSubmitting}
      />

      <LocationFormModal
        isOpen={locationModal.open}
        mode={locationModal.mode}
        initialData={locationModal.data}
        onClose={() => setLocationModal({ open: false, mode: 'create', data: null })}
        onSubmit={handleLocationSave}
        isSubmitting={locationSubmitting}
      />

      <AssetTypeFormModal
        isOpen={assetTypeModal.open}
        mode={assetTypeModal.mode}
        initialData={assetTypeModal.data}
        onClose={() => setAssetTypeModal({ open: false, mode: 'create', data: null })}
        onSubmit={handleAssetTypeSave}
        isSubmitting={assetTypeSubmitting}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AssetCataloguePage;
