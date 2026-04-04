import React, { useEffect, useMemo, useRef, useState } from 'react';

const emptyForm = {
  assetCode: '',
  assetName: '',
  assetTypeId: '',
  locationId: '',
  capacity: '',
  description: '',
  status: 'ACTIVE',
  isBookable: true,
};

const assetStatusOptions = ['ACTIVE', 'OUT_OF_SERVICE', 'MAINTENANCE', 'INACTIVE'];

const formatBytes = (bytes) => {
  if (!bytes) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const AssetFormModal = ({
  isOpen,
  mode,
  initialData,
  assetTypes,
  locations,
  onClose,
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [removedMediaIds, setRemovedMediaIds] = useState([]);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const existingMedia = useMemo(() => initialData?.media || [], [initialData]);
  const keptExistingMediaCount = existingMedia.filter(
    (mediaItem) => !removedMediaIds.includes(mediaItem.id)
  ).length;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData(
      initialData
        ? {
            assetCode: initialData.assetCode || '',
            assetName: initialData.assetName || '',
            assetTypeId: initialData.assetTypeId || '',
            locationId: initialData.locationId || '',
            capacity:
              initialData.capacity === null || initialData.capacity === undefined
                ? ''
                : String(initialData.capacity),
            description: initialData.description || '',
            status: initialData.status || 'ACTIVE',
            isBookable: initialData.isBookable ?? true,
          }
        : emptyForm
    );
    setSelectedFiles([]);
    setRemovedMediaIds([]);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [initialData, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((previous) => ({
      ...previous,
      [name]: '',
    }));
  };

  const handleFileChange = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    setSelectedFiles(nextFiles);

    const totalFiles = keptExistingMediaCount + nextFiles.length;

    setErrors((previous) => ({
      ...previous,
      files: totalFiles > 4 ? 'You can keep or upload a maximum of 4 files per asset.' : '',
    }));
  };

  const toggleRemoveMedia = (mediaId) => {
    setRemovedMediaIds((previous) =>
      previous.includes(mediaId)
        ? previous.filter((existingId) => existingId !== mediaId)
        : [...previous, mediaId]
    );
  };

  const validate = () => {
    const nextErrors = {};

    if (!formData.assetCode.trim()) {
      nextErrors.assetCode = 'Asset code is required.';
    }

    if (!formData.assetName.trim()) {
      nextErrors.assetName = 'Asset name is required.';
    }

    if (!formData.assetTypeId) {
      nextErrors.assetTypeId = 'Asset type is required.';
    }

    if (formData.capacity !== '' && Number(formData.capacity) < 0) {
      nextErrors.capacity = 'Capacity cannot be negative.';
    }

    if (!formData.status) {
      nextErrors.status = 'Status is required.';
    }

    if (keptExistingMediaCount + selectedFiles.length > 4) {
      nextErrors.files = 'You can keep or upload a maximum of 4 files per asset.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    await onSubmit({
      assetCode: formData.assetCode.trim(),
      assetName: formData.assetName.trim(),
      assetTypeId: formData.assetTypeId,
      locationId: formData.locationId,
      capacity: formData.capacity === '' ? '' : Number(formData.capacity),
      description: formData.description.trim(),
      status: formData.status,
      isBookable: formData.isBookable,
      files: selectedFiles,
      removeMediaIds: removedMediaIds,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 px-4 py-8">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-5">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'edit' ? 'Update Asset' : 'Create Asset'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Add resource details, media evidence, and current booking availability.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[calc(92vh-88px)] overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Asset Code</label>
                <input
                  type="text"
                  name="assetCode"
                  value={formData.assetCode}
                  onChange={handleChange}
                  placeholder="LH-301"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    errors.assetCode
                      ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                />
                {errors.assetCode && <p className="mt-2 text-xs text-red-600">{errors.assetCode}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Asset Name</label>
                <input
                  type="text"
                  name="assetName"
                  value={formData.assetName}
                  onChange={handleChange}
                  placeholder="Lecture Hall 301"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    errors.assetName
                      ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                />
                {errors.assetName && <p className="mt-2 text-xs text-red-600">{errors.assetName}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Asset Type</label>
                <select
                  name="assetTypeId"
                  value={formData.assetTypeId}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    errors.assetTypeId
                      ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                >
                  <option value="">Select asset type</option>
                  {assetTypes.map((assetType) => (
                    <option key={assetType.id} value={assetType.id}>
                      {assetType.name} ({assetType.code})
                    </option>
                  ))}
                </select>
                {errors.assetTypeId && (
                  <p className="mt-2 text-xs text-red-600">{errors.assetTypeId}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Location</label>
                <select
                  name="locationId"
                  value={formData.locationId}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">No linked location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.locationName} ({location.roomCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  min="0"
                  onChange={handleChange}
                  placeholder="120"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    errors.capacity
                      ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                />
                {errors.capacity && <p className="mt-2 text-xs text-red-600">{errors.capacity}</p>}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
                    errors.status
                      ? 'border-red-400 focus:ring-2 focus:ring-red-100'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                  }`}
                >
                  {assetStatusOptions.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
                {errors.status && <p className="mt-2 text-xs text-red-600">{errors.status}</p>}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="4"
                placeholder="Main lecture hall with projector and audio support"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Media attachments</h4>
                  <p className="mt-1 text-sm text-gray-500">
                    Keep or upload up to 4 image or video files for this asset.
                  </p>
                </div>

                <label className="inline-flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                  <input
                    type="checkbox"
                    name="isBookable"
                    checked={formData.isBookable}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Bookable asset
                </label>
              </div>

              {existingMedia.length > 0 && (
                <div className="mt-5 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Existing files
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {existingMedia.map((mediaItem) => {
                      const markedForRemoval = removedMediaIds.includes(mediaItem.id);

                      return (
                        <button
                          type="button"
                          key={mediaItem.id}
                          onClick={() => toggleRemoveMedia(mediaItem.id)}
                          className={`rounded-2xl border px-4 py-3 text-left transition ${
                            markedForRemoval
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">
                                {mediaItem.originalFileName}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                {mediaItem.mediaType} • {formatBytes(mediaItem.fileSize)}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                markedForRemoval
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {markedForRemoval ? 'Remove' : 'Keep'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">Upload files</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="block w-full rounded-xl border border-dashed border-gray-300 bg-white px-4 py-4 text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-blue-700"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Selected files replace the current upload selection for this save action.
                </p>
                {errors.files && <p className="mt-2 text-xs text-red-600">{errors.files}</p>}
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2 rounded-xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    New uploads
                  </p>
                  {selectedFiles.map((file) => (
                    <div key={`${file.name}-${file.size}`} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-700">{file.name}</span>
                      <span className="text-xs text-gray-500">{formatBytes(file.size)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : mode === 'edit' ? 'Save Asset' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetFormModal;
