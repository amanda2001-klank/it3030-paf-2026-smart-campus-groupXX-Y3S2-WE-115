package com.smartcampus.catalog.controller;

import com.smartcampus.catalog.dto.AssetTypeRequest;
import com.smartcampus.catalog.dto.AssetTypeResponse;
import com.smartcampus.catalog.dto.AssetTypeSearchRequest;
import com.smartcampus.catalog.dto.PageResponse;
import com.smartcampus.catalog.security.MockUserContext;
import com.smartcampus.catalog.security.MockUserRole;
import com.smartcampus.catalog.service.AssetTypeService;
import com.smartcampus.catalog.service.MockAccessService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@Validated
@RequestMapping("/api/catalog/asset-types")
public class AssetTypeController {

    private final AssetTypeService assetTypeService;
    private final MockAccessService mockAccessService;

    public AssetTypeController(AssetTypeService assetTypeService, MockAccessService mockAccessService) {
        this.assetTypeService = assetTypeService;
        this.mockAccessService = mockAccessService;
    }

    @PostMapping
    public ResponseEntity<AssetTypeResponse> createAssetType(
            @Valid @RequestBody AssetTypeRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        requireManagerAccess(userId, userName, userRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(assetTypeService.createAssetType(request));
    }

    @GetMapping
    public ResponseEntity<PageResponse<AssetTypeResponse>> searchAssetTypes(@Valid @ModelAttribute AssetTypeSearchRequest request) {
        return ResponseEntity.ok(assetTypeService.searchAssetTypes(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetTypeResponse> getAssetTypeById(@PathVariable String id) {
        return ResponseEntity.ok(assetTypeService.getAssetTypeById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AssetTypeResponse> updateAssetType(
            @PathVariable String id,
            @Valid @RequestBody AssetTypeRequest request,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        requireManagerAccess(userId, userName, userRole);
        return ResponseEntity.ok(assetTypeService.updateAssetType(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAssetType(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        requireManagerAccess(userId, userName, userRole);
        assetTypeService.deleteAssetType(id);
        return ResponseEntity.noContent().build();
    }

    private void requireManagerAccess(String userId, String userName, String userRole) {
        MockUserContext currentUser = mockAccessService.resolveUser(userId, userName, userRole);
        mockAccessService.requireAnyRole(currentUser, MockUserRole.ADMIN, MockUserRole.ASSET_MANAGER);
    }
}
