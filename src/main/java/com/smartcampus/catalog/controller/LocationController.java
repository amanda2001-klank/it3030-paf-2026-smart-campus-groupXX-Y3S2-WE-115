package com.smartcampus.catalog.controller;

import com.smartcampus.catalog.dto.LocationRequest;
import com.smartcampus.catalog.dto.LocationResponse;
import com.smartcampus.catalog.dto.LocationSearchRequest;
import com.smartcampus.catalog.dto.PageResponse;
import com.smartcampus.catalog.security.MockUserContext;
import com.smartcampus.catalog.security.MockUserRole;
import com.smartcampus.catalog.service.LocationService;
import com.smartcampus.catalog.service.MockAccessService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@Validated
@RequestMapping("/api/catalog/locations")
public class LocationController {

    private final LocationService locationService;
    private final MockAccessService mockAccessService;

    public LocationController(LocationService locationService, MockAccessService mockAccessService) {
        this.locationService = locationService;
        this.mockAccessService = mockAccessService;
    }

    @PostMapping
    public ResponseEntity<LocationResponse> createLocation(
            @Valid @RequestBody LocationRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        requireManagerAccess(userId, userName, userRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(locationService.createLocation(request));
    }

    @GetMapping
    public ResponseEntity<PageResponse<LocationResponse>> searchLocations(
            @Valid @ModelAttribute LocationSearchRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        requireManagerAccess(userId, userName, userRole);
        return ResponseEntity.ok(locationService.searchLocations(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LocationResponse> getLocationById(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        requireManagerAccess(userId, userName, userRole);
        return ResponseEntity.ok(locationService.getLocationById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<LocationResponse> updateLocation(
            @PathVariable String id,
            @Valid @RequestBody LocationRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        requireManagerAccess(userId, userName, userRole);
        return ResponseEntity.ok(locationService.updateLocation(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLocation(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        requireManagerAccess(userId, userName, userRole);
        locationService.deleteLocation(id);
        return ResponseEntity.noContent().build();
    }

    private void requireManagerAccess(String userId, String userName, String userRole) {
        MockUserContext currentUser = mockAccessService.resolveUser(userId, userName, userRole);
        mockAccessService.requireAnyRole(currentUser, MockUserRole.ADMIN, MockUserRole.ASSET_MANAGER);
    }
}
