package com.smartcampus.catalog.controller;

import com.smartcampus.auth.security.AuthenticatedUser;
import com.smartcampus.catalog.dto.AssetRequest;
import com.smartcampus.catalog.dto.AssetResponse;
import com.smartcampus.catalog.dto.AssetSearchRequest;
import com.smartcampus.catalog.dto.AssetListRequest;
import com.smartcampus.catalog.dto.AssetMediaContent;
import com.smartcampus.catalog.dto.PageResponse;
import com.smartcampus.catalog.service.AssetService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<AssetResponse> createAsset(
            @Valid @ModelAttribute AssetRequest request,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assetService.createAsset(request, currentUser(authentication).getUserId(), files));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PageResponse<AssetResponse>> searchAssets(
            @Valid @ModelAttribute AssetSearchRequest request) {
        return ResponseEntity.ok(assetService.searchAssets(request));
    }

    @GetMapping("/all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<PageResponse<AssetResponse>> getAllAssets(
            @Valid @ModelAttribute AssetListRequest request) {
        return ResponseEntity.ok(assetService.getAllAssets(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AssetResponse> getAssetById(
            @PathVariable String id) {
        return ResponseEntity.ok(assetService.getAssetById(id));
    }

    @GetMapping("/{assetId}/media/{mediaId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> previewAssetMedia(
            @PathVariable String assetId,
            @PathVariable String mediaId) {
        return buildMediaResponse(assetService.getAssetMediaContent(assetId, mediaId), false);
    }

    @GetMapping("/{assetId}/media/{mediaId}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadAssetMedia(
            @PathVariable String assetId,
            @PathVariable String mediaId) {
        return buildMediaResponse(assetService.getAssetMediaContent(assetId, mediaId), true);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<AssetResponse> updateAsset(
            @PathVariable String id,
            @Valid @ModelAttribute AssetRequest request,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            @RequestParam(value = "removeMediaIds", required = false) String removeMediaIds,
            Authentication authentication) {
        return ResponseEntity.ok(assetService.updateAsset(
                id,
                request,
                removeMediaIds,
                currentUser(authentication).getUserId(),
                files
        ));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<Void> deleteAsset(
            @PathVariable String id) {
        assetService.deleteAsset(id);
        return ResponseEntity.noContent().build();
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

    private AuthenticatedUser currentUser(Authentication authentication) {
        return (AuthenticatedUser) authentication.getPrincipal();
    }
}
