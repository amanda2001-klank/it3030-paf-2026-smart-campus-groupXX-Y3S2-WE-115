package com.smartcampus.catalog.service;

import com.smartcampus.booking.exception.BadRequestException;
import com.smartcampus.booking.exception.ConflictException;
import com.smartcampus.booking.exception.ResourceNotFoundException;
import com.smartcampus.catalog.dto.AssetTypeRequest;
import com.smartcampus.catalog.dto.AssetTypeResponse;
import com.smartcampus.catalog.dto.AssetTypeSearchRequest;
import com.smartcampus.catalog.dto.PageResponse;
import com.smartcampus.catalog.model.AssetType;
import com.smartcampus.catalog.repository.AssetRepository;
import com.smartcampus.catalog.repository.AssetTypeRepository;
import com.smartcampus.catalog.util.IdValidationUtils;
import com.smartcampus.notification.service.NotificationService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class AssetTypeService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of("code", "name");

    private final AssetTypeRepository assetTypeRepository;
    private final AssetRepository assetRepository;
    private final MongoTemplate mongoTemplate;
    private final NotificationService notificationService;

    public AssetTypeService(AssetTypeRepository assetTypeRepository,
                            AssetRepository assetRepository,
                            MongoTemplate mongoTemplate,
                            NotificationService notificationService) {
        this.assetTypeRepository = assetTypeRepository;
        this.assetRepository = assetRepository;
        this.mongoTemplate = mongoTemplate;
        this.notificationService = notificationService;
    }

    public AssetTypeResponse createAssetType(AssetTypeRequest request) {
        String normalizedCode = normalizeTypeCode(request.getCode());
        if (assetTypeRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new ConflictException("Asset type code already exists: " + normalizedCode);
        }

        AssetType assetType = new AssetType();
        assetType.setCode(normalizedCode);
        assetType.setName(normalizeRequired(request.getName(), "Asset type name"));
        AssetType savedAssetType = assetTypeRepository.save(assetType);
        notificationService.notifyAssetTypeCreated(savedAssetType.getId(), savedAssetType.getName());
        return AssetTypeResponse.fromAssetType(savedAssetType);
    }

    @Transactional(readOnly = true)
    public PageResponse<AssetTypeResponse> searchAssetTypes(AssetTypeSearchRequest request) {
        String sortBy = validateSortField(request.getSortBy());
        Sort.Direction direction = resolveSortDirection(request.getSortDir());

        Query query = new Query();
        List<Criteria> filters = new ArrayList<>();

        String searchQuery = IdValidationUtils.trimToNull(request.getQuery());
        if (searchQuery != null) {
            filters.add(new Criteria().orOperator(
                    containsIgnoreCase("code", searchQuery),
                    containsIgnoreCase("name", searchQuery)
            ));
        }

        String code = IdValidationUtils.trimToNull(request.getCode());
        if (code != null) {
            filters.add(containsIgnoreCase("code", normalizeTypeCode(code)));
        }

        applyFilters(query, filters);
        long total = mongoTemplate.count(query, AssetType.class);

        query.with(PageRequest.of(request.getPage(), request.getSize(), Sort.by(direction, sortBy)));
        List<AssetTypeResponse> content = mongoTemplate.find(query, AssetType.class)
                .stream()
                .map(AssetTypeResponse::fromAssetType)
                .collect(Collectors.toList());

        return buildPageResponse(content, request.getPage(), request.getSize(), total, sortBy, direction);
    }

    @Transactional(readOnly = true)
    public AssetTypeResponse getAssetTypeById(String id) {
        return AssetTypeResponse.fromAssetType(getAssetTypeEntity(id));
    }

    public AssetTypeResponse updateAssetType(String id, AssetTypeRequest request) {
        AssetType assetType = getAssetTypeEntity(id);
        String normalizedCode = normalizeTypeCode(request.getCode());

        if (assetTypeRepository.existsByCodeIgnoreCaseAndIdNot(normalizedCode, assetType.getId())) {
            throw new ConflictException("Asset type code already exists: " + normalizedCode);
        }

        assetType.setCode(normalizedCode);
        assetType.setName(normalizeRequired(request.getName(), "Asset type name"));
        AssetType savedAssetType = assetTypeRepository.save(assetType);
        notificationService.notifyAssetTypeUpdated(savedAssetType.getId(), savedAssetType.getName());
        return AssetTypeResponse.fromAssetType(savedAssetType);
    }

    public void deleteAssetType(String id) {
        AssetType assetType = getAssetTypeEntity(id);
        String validatedId = assetType.getId();

        if (assetRepository.countByAssetTypeId(validatedId) > 0) {
            throw new ConflictException("Asset type cannot be deleted because it is referenced by existing assets");
        }

        assetTypeRepository.deleteById(validatedId);
        notificationService.notifyAssetTypeDeleted(validatedId, assetType.getCode());
    }

    public AssetType getAssetTypeEntity(String id) {
        String validatedId = IdValidationUtils.requireValidObjectId(id, "Asset type ID");
        return assetTypeRepository.findById(validatedId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset type not found with id: " + validatedId));
    }

    private String normalizeTypeCode(String value) {
        String trimmed = normalizeRequired(value, "Asset type code");
        String normalized = trimmed.toUpperCase()
                .replaceAll("[\\s-]+", "_")
                .replaceAll("_+", "_");
        if (!normalized.matches("^[A-Z0-9_]+$")) {
            throw new BadRequestException("Asset type code may contain only letters, numbers, spaces, hyphens, and underscores");
        }
        return normalized;
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
            throw new BadRequestException("Invalid sortBy for asset type. Allowed values: " + ALLOWED_SORT_FIELDS);
        }
        return normalized;
    }

    private Sort.Direction resolveSortDirection(String sortDir) {
        return "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
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
