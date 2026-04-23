package com.smartcampus.catalog.controller;

import com.smartcampus.auth.security.AuthenticatedUser;
import com.smartcampus.catalog.dto.AssetRatingRequest;
import com.smartcampus.catalog.dto.AssetRatingResponse;
import com.smartcampus.catalog.dto.AssetRatingsOverviewResponse;
import com.smartcampus.catalog.service.AssetRatingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/catalog/assets/{assetId}/ratings")
public class AssetRatingController {

    private final AssetRatingService assetRatingService;

    public AssetRatingController(AssetRatingService assetRatingService) {
        this.assetRatingService = assetRatingService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AssetRatingsOverviewResponse> getAssetRatings(
            @PathVariable String assetId,
            Authentication authentication) {
        return ResponseEntity.ok(assetRatingService.getRatingsOverview(assetId, currentUser(authentication)));
    }

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AssetRatingResponse> createAssetRating(
            @PathVariable String assetId,
            @Valid @RequestBody AssetRatingRequest request,
            Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assetRatingService.createRating(assetId, request, currentUser(authentication)));
    }

    @PutMapping("/my-rating")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<AssetRatingResponse> updateMyRating(
            @PathVariable String assetId,
            @Valid @RequestBody AssetRatingRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(assetRatingService.updateMyRating(assetId, request, currentUser(authentication)));
    }

    private AuthenticatedUser currentUser(Authentication authentication) {
        return (AuthenticatedUser) authentication.getPrincipal();
    }
}
