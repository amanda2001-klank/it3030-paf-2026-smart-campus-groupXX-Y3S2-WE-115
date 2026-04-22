package com.smartcampus.catalog.controller;

import com.smartcampus.auth.security.AuthenticatedUser;
import com.smartcampus.audit.service.AdminAuditLogService;
import com.smartcampus.catalog.dto.LocationRequest;
import com.smartcampus.catalog.dto.LocationResponse;
import com.smartcampus.catalog.dto.LocationSearchRequest;
import com.smartcampus.catalog.dto.PageResponse;
import com.smartcampus.catalog.service.LocationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@Validated
@RequestMapping("/api/catalog/locations")
public class LocationController {

    private final LocationService locationService;
    private final AdminAuditLogService adminAuditLogService;

    public LocationController(LocationService locationService, AdminAuditLogService adminAuditLogService) {
        this.locationService = locationService;
        this.adminAuditLogService = adminAuditLogService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<LocationResponse> createLocation(
            @Valid @RequestBody LocationRequest request,
            Authentication authentication) {
        LocationResponse createdLocation = locationService.createLocation(request);
        adminAuditLogService.logAction(
                currentUser(authentication),
                "LOCATION_CREATED",
                "LOCATION",
                createdLocation.getId(),
                "Created location " + createdLocation.getLocationName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(createdLocation);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PageResponse<LocationResponse>> searchLocations(
            @Valid @ModelAttribute LocationSearchRequest request) {
        return ResponseEntity.ok(locationService.searchLocations(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LocationResponse> getLocationById(
            @PathVariable String id) {
        return ResponseEntity.ok(locationService.getLocationById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<LocationResponse> updateLocation(
            @PathVariable String id,
            @Valid @RequestBody LocationRequest request,
            Authentication authentication) {
        LocationResponse updatedLocation = locationService.updateLocation(id, request);
        adminAuditLogService.logAction(
                currentUser(authentication),
                "LOCATION_UPDATED",
                "LOCATION",
                updatedLocation.getId(),
                "Updated location " + updatedLocation.getLocationName()
        );
        return ResponseEntity.ok(updatedLocation);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<Void> deleteLocation(
            @PathVariable String id,
            Authentication authentication) {
        LocationResponse location = locationService.getLocationById(id);
        locationService.deleteLocation(id);
        adminAuditLogService.logAction(
                currentUser(authentication),
                "LOCATION_DELETED",
                "LOCATION",
                id,
                "Deleted location " + location.getLocationName()
        );
        return ResponseEntity.noContent().build();
    }

    private AuthenticatedUser currentUser(Authentication authentication) {
        return (AuthenticatedUser) authentication.getPrincipal();
    }
}
