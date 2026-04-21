package com.smartcampus.catalog.controller;

import com.smartcampus.catalog.dto.AssetTypeRequest;
import com.smartcampus.catalog.dto.AssetTypeResponse;
import com.smartcampus.catalog.dto.AssetTypeSearchRequest;
import com.smartcampus.catalog.dto.PageResponse;
import com.smartcampus.catalog.service.AssetTypeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@Validated
@RequestMapping("/api/catalog/asset-types")
public class AssetTypeController {

    private final AssetTypeService assetTypeService;

    public AssetTypeController(AssetTypeService assetTypeService) {
        this.assetTypeService = assetTypeService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<AssetTypeResponse> createAssetType(
            @Valid @RequestBody AssetTypeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(assetTypeService.createAssetType(request));
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
            @Valid @RequestBody AssetTypeRequest request) {
        return ResponseEntity.ok(assetTypeService.updateAssetType(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<Void> deleteAssetType(
            @PathVariable String id) {
        assetTypeService.deleteAssetType(id);
        return ResponseEntity.noContent().build();
    }
}
