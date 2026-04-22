package com.smartcampus.catalog.controller;

import com.smartcampus.auth.security.AuthenticatedUser;
import com.smartcampus.audit.service.AdminAuditLogService;
import com.smartcampus.catalog.dto.AssetTypeRequest;
import com.smartcampus.catalog.dto.AssetTypeResponse;
import com.smartcampus.catalog.dto.AssetTypeSearchRequest;
import com.smartcampus.catalog.dto.PageResponse;
import com.smartcampus.catalog.service.AssetTypeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@Validated
@RequestMapping("/api/catalog/asset-types")
public class AssetTypeController {

    private final AssetTypeService assetTypeService;
    private final AdminAuditLogService adminAuditLogService;

    public AssetTypeController(AssetTypeService assetTypeService, AdminAuditLogService adminAuditLogService) {
        this.assetTypeService = assetTypeService;
        this.adminAuditLogService = adminAuditLogService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<AssetTypeResponse> createAssetType(
            @Valid @RequestBody AssetTypeRequest request,
            Authentication authentication) {
        AssetTypeResponse createdAssetType = assetTypeService.createAssetType(request);
        adminAuditLogService.logAction(
                currentUser(authentication),
                "ASSET_TYPE_CREATED",
                "ASSET_TYPE",
                createdAssetType.getId(),
                "Created asset type " + createdAssetType.getCode()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(createdAssetType);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PageResponse<AssetTypeResponse>> searchAssetTypes(
            @Valid @ModelAttribute AssetTypeSearchRequest request) {
        return ResponseEntity.ok(assetTypeService.searchAssetTypes(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AssetTypeResponse> getAssetTypeById(
            @PathVariable String id) {
        return ResponseEntity.ok(assetTypeService.getAssetTypeById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<AssetTypeResponse> updateAssetType(
            @PathVariable String id,
            @Valid @RequestBody AssetTypeRequest request,
            Authentication authentication) {
        AssetTypeResponse updatedAssetType = assetTypeService.updateAssetType(id, request);
        adminAuditLogService.logAction(
                currentUser(authentication),
                "ASSET_TYPE_UPDATED",
                "ASSET_TYPE",
                updatedAssetType.getId(),
                "Updated asset type " + updatedAssetType.getCode()
        );
        return ResponseEntity.ok(updatedAssetType);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<Void> deleteAssetType(
            @PathVariable String id,
            Authentication authentication) {
        AssetTypeResponse assetType = assetTypeService.getAssetTypeById(id);
        assetTypeService.deleteAssetType(id);
        adminAuditLogService.logAction(
                currentUser(authentication),
                "ASSET_TYPE_DELETED",
                "ASSET_TYPE",
                id,
                "Deleted asset type " + assetType.getCode()
        );
        return ResponseEntity.noContent().build();
    }

    private AuthenticatedUser currentUser(Authentication authentication) {
        return (AuthenticatedUser) authentication.getPrincipal();
    }
}
