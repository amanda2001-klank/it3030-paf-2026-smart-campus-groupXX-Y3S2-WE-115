package com.smartcampus.catalog.service;

import com.smartcampus.booking.exception.BadRequestException;
import com.smartcampus.booking.exception.ConflictException;
import com.smartcampus.booking.exception.ResourceNotFoundException;
import com.smartcampus.catalog.dto.LocationRequest;
import com.smartcampus.catalog.dto.LocationResponse;
import com.smartcampus.catalog.dto.LocationSearchRequest;
import com.smartcampus.catalog.dto.PageResponse;
import com.smartcampus.catalog.model.Location;
import com.smartcampus.catalog.repository.AssetRepository;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@Transactional
public class LocationService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "building", "floor", "roomCode", "locationName", "address", "createdAt"
    );

    private final LocationRepository locationRepository;
    private final AssetRepository assetRepository;
    private final MongoTemplate mongoTemplate;
    private final NotificationService notificationService;

    public LocationService(LocationRepository locationRepository,
                           AssetRepository assetRepository,
                           MongoTemplate mongoTemplate,
                           NotificationService notificationService) {
        this.locationRepository = locationRepository;
        this.assetRepository = assetRepository;
        this.mongoTemplate = mongoTemplate;
        this.notificationService = notificationService;
    }

    public LocationResponse createLocation(LocationRequest request) {
        Location location = new Location();
        applyRequest(location, request);
        Location savedLocation = locationRepository.save(location);
        notificationService.notifyLocationCreated(savedLocation.getId(), savedLocation.getLocationName());
        return LocationResponse.fromLocation(savedLocation);
    }

    @Transactional(readOnly = true)
    public PageResponse<LocationResponse> searchLocations(LocationSearchRequest request) {
        String sortBy = validateSortField(request.getSortBy(), ALLOWED_SORT_FIELDS, "location");
        Sort.Direction direction = resolveSortDirection(request.getSortDir());

        Query query = new Query();
        List<Criteria> filters = new ArrayList<>();

        String queryValue = IdValidationUtils.trimToNull(request.getQuery());
        if (queryValue != null) {
            filters.add(new Criteria().orOperator(
                    containsIgnoreCase("building", queryValue),
                    containsIgnoreCase("floor", queryValue),
                    containsIgnoreCase("roomCode", queryValue),
                    containsIgnoreCase("locationName", queryValue),
                    containsIgnoreCase("address", queryValue)
            ));
        }

        String building = IdValidationUtils.trimToNull(request.getBuilding());
        if (building != null) {
            filters.add(containsIgnoreCase("building", building));
        }

        String floor = IdValidationUtils.trimToNull(request.getFloor());
        if (floor != null) {
            filters.add(containsIgnoreCase("floor", floor));
        }

        String roomCode = IdValidationUtils.trimToNull(request.getRoomCode());
        if (roomCode != null) {
            filters.add(containsIgnoreCase("roomCode", roomCode));
        }

        applyFilters(query, filters);
        long total = mongoTemplate.count(query, Location.class);

        query.with(PageRequest.of(request.getPage(), request.getSize(), Sort.by(direction, sortBy)));
        List<LocationResponse> content = mongoTemplate.find(query, Location.class)
                .stream()
                .map(LocationResponse::fromLocation)
                .collect(Collectors.toList());

        return buildPageResponse(content, request.getPage(), request.getSize(), total, sortBy, direction);
    }

    @Transactional(readOnly = true)
    public LocationResponse getLocationById(String id) {
        return LocationResponse.fromLocation(getLocationEntity(id));
    }

    public LocationResponse updateLocation(String id, LocationRequest request) {
        Location location = getLocationEntity(id);
        applyRequest(location, request);
        Location savedLocation = locationRepository.save(location);
        notificationService.notifyLocationUpdated(savedLocation.getId(), savedLocation.getLocationName());
        return LocationResponse.fromLocation(savedLocation);
    }

    public void deleteLocation(String id) {
        Location location = getLocationEntity(id);
        String validatedId = location.getId();

        if (assetRepository.countByLocationId(validatedId) > 0) {
            throw new ConflictException("Location cannot be deleted because it is referenced by existing assets");
        }

        locationRepository.deleteById(validatedId);
        notificationService.notifyLocationDeleted(validatedId, location.getLocationName());
    }

    private Location getLocationEntity(String id) {
        String validatedId = IdValidationUtils.requireValidObjectId(id, "Location ID");
        return locationRepository.findById(validatedId)
                .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + validatedId));
    }

    private void applyRequest(Location location, LocationRequest request) {
        location.setBuilding(normalizeRequired(request.getBuilding(), "Building"));
        location.setFloor(normalizeRequired(request.getFloor(), "Floor"));
        location.setRoomCode(normalizeRequired(request.getRoomCode(), "Room code"));
        location.setLocationName(normalizeRequired(request.getLocationName(), "Location name"));
        location.setAddress(IdValidationUtils.trimToNull(request.getAddress()));
    }

    private String normalizeRequired(String value, String fieldName) {
        String trimmed = IdValidationUtils.trimToNull(value);
        if (trimmed == null) {
            throw new BadRequestException(fieldName + " is required");
        }
        return trimmed;
    }

    private Sort.Direction resolveSortDirection(String sortDir) {
        return "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
    }

    private String validateSortField(String sortBy, Set<String> allowedFields, String entityName) {
        String normalized = IdValidationUtils.trimToNull(sortBy);
        if (normalized == null) {
            throw new BadRequestException("sortBy is required");
        }
        if (!allowedFields.contains(normalized)) {
            throw new BadRequestException("Invalid sortBy for " + entityName + ". Allowed values: " + allowedFields);
        }
        return normalized;
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
