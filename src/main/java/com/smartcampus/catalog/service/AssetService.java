package com.smartcampus.catalog.service;

import com.smartcampus.booking.exception.BadRequestException;
import com.smartcampus.booking.exception.ConflictException;
import com.smartcampus.booking.exception.ResourceNotFoundException;
import com.smartcampus.catalog.dto.AssetRequest;
import com.smartcampus.catalog.dto.AssetResponse;
import com.smartcampus.catalog.dto.AssetSearchRequest;
import com.smartcampus.catalog.dto.AssetListRequest;
import com.smartcampus.catalog.dto.AssetMediaContent;
import com.smartcampus.catalog.dto.PageResponse;
import com.smartcampus.catalog.model.Asset;
import com.smartcampus.catalog.model.AssetMedia;
import com.smartcampus.catalog.model.AssetStatus;
import com.smartcampus.catalog.model.AssetType;
import com.smartcampus.catalog.model.Location;
import com.smartcampus.catalog.repository.AssetRepository;
import com.smartcampus.catalog.repository.AssetTypeRepository;
import com.smartcampus.catalog.repository.LocationRepository;
import com.smartcampus.catalog.util.IdValidationUtils;
import com.smartcampus.notification.service.NotificationService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
@Transactional
public class AssetService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "assetCode", "assetName", "capacity", "status", "isBookable", "createdAt", "updatedAt"
    );
    private static final Set<AssetStatus> NON_BOOKABLE_STATUSES = Set.of(
            AssetStatus.OUT_OF_SERVICE,
            AssetStatus.MAINTENANCE,
            AssetStatus.INACTIVE
    );

    private final AssetRepository assetRepository;
    private final AssetTypeRepository assetTypeRepository;
    private final LocationRepository locationRepository;
    private final AssetMediaStorageService assetMediaStorageService;
    private final MongoTemplate mongoTemplate;
    private final NotificationService notificationService;

    public AssetService(AssetRepository assetRepository,
                        AssetTypeRepository assetTypeRepository,
                        LocationRepository locationRepository,
                        AssetMediaStorageService assetMediaStorageService,
                        MongoTemplate mongoTemplate,
                        NotificationService notificationService) {
        this.assetRepository = assetRepository;
        this.assetTypeRepository = assetTypeRepository;
        this.locationRepository = locationRepository;
        this.assetMediaStorageService = assetMediaStorageService;
        this.mongoTemplate = mongoTemplate;
        this.notificationService = notificationService;
    }

    public AssetResponse createAsset(AssetRequest request, String createdByUserId, List<MultipartFile> files) {
        List<MultipartFile> normalizedFiles = assetMediaStorageService.normalizeFiles(files);
        String normalizedAssetCode = normalizeAssetCode(request.getAssetCode());
        if (assetRepository.existsByAssetCodeIgnoreCase(normalizedAssetCode)) {
            throw new ConflictException("Asset code already exists: " + normalizedAssetCode);
        }

        AssetType assetType = getRequiredAssetType(request.getAssetTypeId());
        Location location = getOptionalLocation(request.getLocationId());

        Asset asset = new Asset();
        applyAssetRequest(asset, request, normalizedAssetCode, assetType.getId(), location);
        asset.setCreatedById(createdByUserId);
        if (asset.getIsBookable() == null) {
            asset.setIsBookable(Boolean.TRUE);
        }

        Asset savedAsset = assetRepository.save(asset);
        try {
            List<AssetMedia> media = assetMediaStorageService.saveMediaFiles(
                    savedAsset.getId(),
                    normalizedFiles,
                    createdByUserId
            );
            notificationService.notifyAssetCreated(savedAsset);
            return AssetResponse.fromAsset(savedAsset, assetType, location, media);
        } catch (RuntimeException ex) {
            assetMediaStorageService.deleteAllMediaForAsset(savedAsset.getId());
            assetRepository.deleteById(savedAsset.getId());
            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<AssetResponse> getAllAssets(AssetListRequest request) {
        String sortBy = validateSortField(request.getSortBy());
        Sort.Direction direction = resolveSortDirection(request.getSortDir());

        Query query = new Query();
        long total = mongoTemplate.count(query, Asset.class);

        query.with(PageRequest.of(request.getPage(), request.getSize(), Sort.by(direction, sortBy)));
        List<Asset> assets = mongoTemplate.find(query, Asset.class);
        List<AssetResponse> content = enrichAssets(assets);

        return buildPageResponse(content, request.getPage(), request.getSize(), total, sortBy, direction);
    }

    @Transactional(readOnly = true)
    public PageResponse<AssetResponse> searchAssets(AssetSearchRequest request) {
        if (request.getMinCapacity() != null && request.getMaxCapacity() != null
                && request.getMinCapacity() > request.getMaxCapacity()) {
            throw new BadRequestException("minCapacity cannot be greater than maxCapacity");
        }

        String sortBy = validateSortField(request.getSortBy());
        Sort.Direction direction = resolveSortDirection(request.getSortDir());

        Query query = new Query();
        List<Criteria> filters = new ArrayList<>();

        String searchQuery = IdValidationUtils.trimToNull(request.getQuery());
        if (searchQuery != null) {
            filters.add(buildAssetSearchCriteria(searchQuery));
        }

        String assetTypeId = IdValidationUtils.optionalObjectId(request.getAssetTypeId(), "Asset type ID");
        if (assetTypeId != null) {
            filters.add(Criteria.where("assetTypeId").is(assetTypeId));
        }

        String assetTypeCode = IdValidationUtils.trimToNull(request.getAssetTypeCode());
        if (assetTypeCode != null) {
            AssetType assetType = assetTypeRepository.findByCodeIgnoreCase(normalizeTypeCodeForFilter(assetTypeCode))
                    .orElse(null);
            if (assetType == null) {
                return PageResponse.empty(request.getPage(), request.getSize(), sortBy, direction.name());
            }
            filters.add(Criteria.where("assetTypeId").is(assetType.getId()));
        }

        String locationId = IdValidationUtils.optionalObjectId(request.getLocationId(), "Location ID");
        if (locationId != null) {
            filters.add(Criteria.where("locationId").is(locationId));
        }

        Set<String> filteredLocationIds = resolveLocationIdsByFilters(request);
        if (filteredLocationIds != null) {
            if (filteredLocationIds.isEmpty()) {
                return PageResponse.empty(request.getPage(), request.getSize(), sortBy, direction.name());
            }
            filters.add(Criteria.where("locationId").in(filteredLocationIds));
        }

        String statusValue = IdValidationUtils.trimToNull(request.getStatus());
        if (statusValue != null) {
            filters.add(Criteria.where("status").is(resolveStatus(statusValue)));
        }

        if (request.getIsBookable() != null) {
            filters.add(Criteria.where("isBookable").is(request.getIsBookable()));
        }

        if (request.getMinCapacity() != null || request.getMaxCapacity() != null) {
            Criteria capacityCriteria = Criteria.where("capacity");
            if (request.getMinCapacity() != null) {
                capacityCriteria.gte(request.getMinCapacity());
            }
            if (request.getMaxCapacity() != null) {
                capacityCriteria.lte(request.getMaxCapacity());
            }
            filters.add(capacityCriteria);
        }

        applyFilters(query, filters);
        long total = mongoTemplate.count(query, Asset.class);

        query.with(PageRequest.of(request.getPage(), request.getSize(), Sort.by(direction, sortBy)));
        List<Asset> assets = mongoTemplate.find(query, Asset.class);
        List<AssetResponse> content = enrichAssets(assets);

        return buildPageResponse(content, request.getPage(), request.getSize(), total, sortBy, direction);
    }

    @Transactional(readOnly = true)
    public AssetResponse getAssetById(String id) {
        Asset asset = getAssetEntity(id);
        AssetType assetType = getAssetTypeById(asset.getAssetTypeId());
        Location location = getLocationById(asset.getLocationId());
        List<AssetMedia> media = assetMediaStorageService.getMediaByAssetId(asset.getId());
        return AssetResponse.fromAsset(asset, assetType, location, media);
    }

    @Transactional(readOnly = true)
    public AssetMediaContent getAssetMediaContent(String assetId, String mediaId) {
        getAssetEntity(assetId);
        AssetMedia media = assetMediaStorageService.getRequiredMedia(assetId, mediaId);
        return new AssetMediaContent(media, assetMediaStorageService.loadMediaAsResource(media));
    }

    public AssetResponse updateAsset(String id, AssetRequest request, String removeMediaIds, String updatedByUserId,
                                     List<MultipartFile> files) {
        Asset asset = getAssetEntity(id);
        List<MultipartFile> normalizedFiles = assetMediaStorageService.normalizeFiles(files);
        String normalizedAssetCode = normalizeAssetCode(request.getAssetCode());
        if (assetRepository.existsByAssetCodeIgnoreCaseAndIdNot(normalizedAssetCode, asset.getId())) {
            throw new ConflictException("Asset code already exists: " + normalizedAssetCode);
        }

        AssetType assetType = getRequiredAssetType(request.getAssetTypeId());
        Location location = getOptionalLocation(request.getLocationId());

        applyAssetRequest(asset, request, normalizedAssetCode, assetType.getId(), location);
        if (request.getIsBookable() == null) {
            asset.setIsBookable(asset.getIsBookable() != null ? asset.getIsBookable() : Boolean.TRUE);
        }

        int finalMediaCount = assetMediaStorageService.calculateFinalMediaCount(asset.getId(), removeMediaIds, normalizedFiles);
        if (finalMediaCount > AssetMediaStorageService.MAX_MEDIA_FILES_PER_ASSET) {
            throw new BadRequestException("An asset can have at most "
                    + AssetMediaStorageService.MAX_MEDIA_FILES_PER_ASSET + " media files");
        }
        if (finalMediaCount < 0) {
            throw new BadRequestException("removeMediaIds contains more items than the asset currently has");
        }

        Asset updatedAsset = assetRepository.save(asset);
        List<AssetMedia> uploadedMedia = assetMediaStorageService.saveMediaFiles(
                asset.getId(),
                normalizedFiles,
                updatedByUserId
        );
        try {
            assetMediaStorageService.removeSelectedMedia(asset.getId(), removeMediaIds);
        } catch (RuntimeException ex) {
            assetMediaStorageService.deleteMediaEntries(uploadedMedia);
            throw ex;
        }

        List<AssetMedia> allMedia = assetMediaStorageService.getMediaByAssetId(asset.getId());
        notificationService.notifyAssetUpdated(updatedAsset);
        return AssetResponse.fromAsset(updatedAsset, assetType, location, allMedia);
    }

    public void deleteAsset(String id) {
        Asset asset = getAssetEntity(id);
        assetMediaStorageService.deleteAllMediaForAsset(asset.getId());
        assetRepository.deleteById(asset.getId());
        notificationService.notifyAssetDeleted(asset.getId(), asset.getAssetName());
    }

    private Asset getAssetEntity(String id) {
        String validatedId = IdValidationUtils.requireValidObjectId(id, "Asset ID");
        return assetRepository.findById(validatedId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + validatedId));
    }

    private AssetType getRequiredAssetType(String assetTypeId) {
        String validatedAssetTypeId = IdValidationUtils.requireValidObjectId(assetTypeId, "Asset type ID");
        return assetTypeRepository.findById(validatedAssetTypeId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset type not found with id: " + validatedAssetTypeId));
    }

    private Location getOptionalLocation(String locationId) {
        String validatedLocationId = IdValidationUtils.optionalObjectId(locationId, "Location ID");
        if (validatedLocationId == null) {
            return null;
        }
        return locationRepository.findById(validatedLocationId)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + validatedLocationId));
    }

    private AssetType getAssetTypeById(String assetTypeId) {
        if (assetTypeId == null) {
            return null;
        }
        return assetTypeRepository.findById(assetTypeId).orElse(null);
    }

    private Location getLocationById(String locationId) {
        if (locationId == null) {
            return null;
        }
        return locationRepository.findById(locationId).orElse(null);
    }

    private void applyAssetRequest(Asset asset, AssetRequest request, String normalizedAssetCode,
                                   String assetTypeId, Location location) {
        asset.setAssetCode(normalizedAssetCode);
        asset.setAssetName(normalizeRequired(request.getAssetName(), "Asset name"));
        asset.setAssetTypeId(assetTypeId);
        asset.setLocationId(location != null ? location.getId() : null);
        asset.setCapacity(request.getCapacity());
        asset.setDescription(IdValidationUtils.trimToNull(request.getDescription()));
        asset.setStatus(request.getStatus());
        if (NON_BOOKABLE_STATUSES.contains(request.getStatus())) {
            asset.setIsBookable(Boolean.FALSE);
        } else if (request.getIsBookable() != null) {
            asset.setIsBookable(request.getIsBookable());
        }
    }

    private List<AssetResponse> enrichAssets(List<Asset> assets) {
        if (assets.isEmpty()) {
            return List.of();
        }

        Set<String> assetTypeIds = new HashSet<>();
        Set<String> locationIds = new HashSet<>();
        Set<String> assetIds = new HashSet<>();
        for (Asset asset : assets) {
            assetIds.add(asset.getId());
            if (asset.getAssetTypeId() != null) {
                assetTypeIds.add(asset.getAssetTypeId());
            }
            if (asset.getLocationId() != null) {
                locationIds.add(asset.getLocationId());
            }
        }

        Map<String, AssetType> assetTypesById = new HashMap<>();
        StreamSupport.stream(assetTypeRepository.findAllById(assetTypeIds).spliterator(), false)
                .forEach(assetType -> assetTypesById.put(assetType.getId(), assetType));

        Map<String, Location> locationsById = new HashMap<>();
        StreamSupport.stream(locationRepository.findAllById(locationIds).spliterator(), false)
                .forEach(location -> locationsById.put(location.getId(), location));

        Map<String, List<AssetMedia>> mediaByAssetId = assetMediaStorageService.getMediaByAssetIds(assetIds);

        return assets.stream()
                .map(asset -> AssetResponse.fromAsset(
                        asset,
                        assetTypesById.get(asset.getAssetTypeId()),
                        locationsById.get(asset.getLocationId()),
                        mediaByAssetId.getOrDefault(asset.getId(), List.of())
                ))
                .collect(Collectors.toList());
    }

    private Set<String> resolveLocationIdsByFilters(AssetSearchRequest request) {
        String building = IdValidationUtils.trimToNull(request.getBuilding());
        String floor = IdValidationUtils.trimToNull(request.getFloor());
        String roomCode = IdValidationUtils.trimToNull(request.getRoomCode());

        if (building == null && floor == null && roomCode == null) {
            return null;
        }

        Query locationQuery = new Query();
        List<Criteria> locationFilters = new ArrayList<>();
        if (building != null) {
            locationFilters.add(containsIgnoreCase("building", building));
        }
        if (floor != null) {
            locationFilters.add(containsIgnoreCase("floor", floor));
        }
        if (roomCode != null) {
            locationFilters.add(containsIgnoreCase("roomCode", roomCode));
        }

        applyFilters(locationQuery, locationFilters);
        return mongoTemplate.find(locationQuery, Location.class)
                .stream()
                .map(Location::getId)
                .collect(Collectors.toSet());
    }

    private Criteria buildAssetSearchCriteria(String searchQuery) {
        List<Criteria> searchCriteria = new ArrayList<>();
        searchCriteria.add(containsIgnoreCase("assetCode", searchQuery));
        searchCriteria.add(containsIgnoreCase("assetName", searchQuery));
        searchCriteria.add(containsIgnoreCase("description", searchQuery));

        Set<String> matchingAssetTypeIds = resolveAssetTypeIdsBySearch(searchQuery);
        if (!matchingAssetTypeIds.isEmpty()) {
            searchCriteria.add(Criteria.where("assetTypeId").in(matchingAssetTypeIds));
        }

        Set<String> matchingLocationIds = resolveLocationIdsBySearch(searchQuery);
        if (!matchingLocationIds.isEmpty()) {
            searchCriteria.add(Criteria.where("locationId").in(matchingLocationIds));
        }

        Integer capacity = tryParseCapacity(searchQuery);
        if (capacity != null) {
            searchCriteria.add(Criteria.where("capacity").is(capacity));
        }

        return new Criteria().orOperator(searchCriteria.toArray(new Criteria[0]));
    }

    private Set<String> resolveAssetTypeIdsBySearch(String searchQuery) {
        Query assetTypeQuery = new Query(new Criteria().orOperator(
                containsIgnoreCase("code", searchQuery),
                containsIgnoreCase("name", searchQuery)
        ));

        return mongoTemplate.find(assetTypeQuery, AssetType.class)
                .stream()
                .map(AssetType::getId)
                .collect(Collectors.toSet());
    }

    private Set<String> resolveLocationIdsBySearch(String searchQuery) {
        Query locationQuery = new Query(new Criteria().orOperator(
                containsIgnoreCase("building", searchQuery),
                containsIgnoreCase("floor", searchQuery),
                containsIgnoreCase("roomCode", searchQuery),
                containsIgnoreCase("locationName", searchQuery),
                containsIgnoreCase("address", searchQuery)
        ));

        return mongoTemplate.find(locationQuery, Location.class)
                .stream()
                .map(Location::getId)
                .collect(Collectors.toSet());
    }

    private Integer tryParseCapacity(String searchQuery) {
        if (!searchQuery.matches("\\d+")) {
            return null;
        }

        try {
            return Integer.parseInt(searchQuery);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private AssetStatus resolveStatus(String statusValue) {
        String normalized = statusValue.trim().toUpperCase().replace('-', '_').replace(' ', '_');
        try {
            return AssetStatus.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid asset status. Allowed values: ACTIVE, OUT_OF_SERVICE, MAINTENANCE, INACTIVE");
        }
    }

    private String normalizeAssetCode(String value) {
        String trimmed = normalizeRequired(value, "Asset code");
        String normalized = trimmed.toUpperCase()
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
        if (!normalized.matches("^[A-Z0-9_-]+$")) {
            throw new BadRequestException("Asset code may contain only letters, numbers, spaces, hyphens, and underscores");
        }
        return normalized;
    }

    private String normalizeTypeCodeForFilter(String value) {
        String trimmed = normalizeRequired(value, "Asset type code");
        return trimmed.toUpperCase()
                .replaceAll("[\\s-]+", "_")
                .replaceAll("_+", "_");
    }

    private String normalizeRequired(String value, String fieldName) {
        String trimmed = IdValidationUtils.trimToNull(value);
        if (trimmed == null) {
            throw new BadRequestException(fieldName + " is required");
        }
        return trimmed;
    }

    private String validateSortField(String sortBy) {
        String normalized = IdValidationUtils.trimToNull(sortBy);
        if (normalized == null || !ALLOWED_SORT_FIELDS.contains(normalized)) {
            throw new BadRequestException("Invalid sortBy for asset. Allowed values: " + ALLOWED_SORT_FIELDS);
        }
        return normalized;
    }

    private Sort.Direction resolveSortDirection(String sortDir) {
        return "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
    }

    private Criteria containsIgnoreCase(String field, String value) {
        return Criteria.where(field).regex(".*" + Pattern.quote(value) + ".*", "i");
    }

    private void applyFilters(Query query, List<Criteria> filters) {
        if (filters.isEmpty()) {
            return;
        }
        if (filters.size() == 1) {
            query.addCriteria(filters.get(0));
            return;
        }
        query.addCriteria(new Criteria().andOperator(filters.toArray(new Criteria[0])));
    }

    private <T> PageResponse<T> buildPageResponse(List<T> content, int page, int size,
                                                  long totalElements, String sortBy, Sort.Direction direction) {
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        boolean hasNext = totalElements > (long) (page + 1) * size;
        boolean hasPrevious = page > 0;
        return new PageResponse<>(
                content,
                page,
                size,
                totalElements,
                totalPages,
                hasNext,
                hasPrevious,
                sortBy,
                direction.name()
        );
    }
}
