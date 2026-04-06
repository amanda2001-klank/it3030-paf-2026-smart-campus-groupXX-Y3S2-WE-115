package com.smartcampus.catalog.controller;

import com.smartcampus.catalog.dto.AssetRequest;
import com.smartcampus.catalog.dto.AssetResponse;
import com.smartcampus.catalog.dto.AssetSearchRequest;
import com.smartcampus.catalog.dto.AssetListRequest;
import com.smartcampus.catalog.dto.AssetMediaContent;
import com.smartcampus.catalog.dto.PageResponse;
import com.smartcampus.catalog.security.MockUserContext;
import com.smartcampus.catalog.security.MockUserRole;
import com.smartcampus.catalog.service.AssetService;
import com.smartcampus.catalog.service.MockAccessService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@Validated
@RequestMapping("/api/catalog/assets")
public class AssetController {

    private final AssetService assetService;
    private final MockAccessService mockAccessService;

    public AssetController(AssetService assetService, MockAccessService mockAccessService) {
        this.assetService = assetService;
        this.mockAccessService = mockAccessService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AssetResponse> createAsset(
            @Valid @ModelAttribute AssetRequest request,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        MockUserContext currentUser = requireManagerAccess(userId, userName, userRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(assetService.createAsset(request, currentUser, files));
    }

    @GetMapping
    public ResponseEntity<PageResponse<AssetResponse>> searchAssets(
            @Valid @ModelAttribute AssetSearchRequest request) {
        return ResponseEntity.ok(assetService.searchAssets(request));
    }

    @GetMapping("/all")
    public ResponseEntity<PageResponse<AssetResponse>> getAllAssets(
            @Valid @ModelAttribute AssetListRequest request) {
        return ResponseEntity.ok(assetService.getAllAssets(request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetResponse> getAssetById(
            @PathVariable String id) {
        return ResponseEntity.ok(assetService.getAssetById(id));
    }

    @GetMapping("/{assetId}/media/{mediaId}")
    public ResponseEntity<Resource> previewAssetMedia(
            @PathVariable String assetId,
            @PathVariable String mediaId) {
        return buildMediaResponse(assetService.getAssetMediaContent(assetId, mediaId), false);
    }

    @GetMapping("/{assetId}/media/{mediaId}/download")
    public ResponseEntity<Resource> downloadAssetMedia(
            @PathVariable String assetId,
            @PathVariable String mediaId) {
        return buildMediaResponse(assetService.getAssetMediaContent(assetId, mediaId), true);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AssetResponse> updateAsset(
            @PathVariable String id,
            @Valid @ModelAttribute AssetRequest request,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "removeMediaIds", required = false) String removeMediaIds,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        MockUserContext currentUser = requireManagerAccess(userId, userName, userRole);
        return ResponseEntity.ok(assetService.updateAsset(id, request, removeMediaIds, currentUser, files));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAsset(
            @PathVariable String id,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        requireManagerAccess(userId, userName, userRole);
        assetService.deleteAsset(id);
        return ResponseEntity.noContent().build();
    }

    private MockUserContext requireManagerAccess(String userId, String userName, String userRole) {
        MockUserContext currentUser = mockAccessService.resolveUser(userId, userName, userRole);
        mockAccessService.requireAnyRole(currentUser, MockUserRole.ADMIN, MockUserRole.ASSET_MANAGER);
        return currentUser;
    }

    private ResponseEntity<Resource> buildMediaResponse(AssetMediaContent assetMediaContent, boolean attachment) {
        MediaType mediaType = resolveMediaType(assetMediaContent.media().getContentType(), assetMediaContent.resource());
        ContentDisposition disposition = attachment
                ? ContentDisposition.attachment()
                .filename(assetMediaContent.media().getOriginalFileName(), StandardCharsets.UTF_8)
                .build()
                : ContentDisposition.inline()
                .filename(assetMediaContent.media().getOriginalFileName(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(assetMediaContent.media().getFileSize())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .body(assetMediaContent.resource());
    }

    private MediaType resolveMediaType(String contentType, Resource resource) {
        if (contentType != null && !contentType.isBlank()) {
            return MediaType.parseMediaType(contentType);
        }

        return MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_OCTET_STREAM);
    }
}
