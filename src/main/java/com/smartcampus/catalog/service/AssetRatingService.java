package com.smartcampus.catalog.service;

import com.smartcampus.auth.model.UserRole;
import com.smartcampus.auth.security.AuthenticatedUser;
import com.smartcampus.booking.exception.BadRequestException;
import com.smartcampus.booking.exception.ConflictException;
import com.smartcampus.booking.exception.ResourceNotFoundException;
import com.smartcampus.booking.exception.UnauthorizedException;
import com.smartcampus.booking.model.BookingStatus;
import com.smartcampus.booking.repository.BookingRepository;
import com.smartcampus.catalog.dto.AssetRatingRequest;
import com.smartcampus.catalog.dto.AssetRatingResponse;
import com.smartcampus.catalog.dto.AssetRatingsOverviewResponse;
import com.smartcampus.catalog.model.Asset;
import com.smartcampus.catalog.model.AssetRating;
import com.smartcampus.catalog.repository.AssetRatingRepository;
import com.smartcampus.catalog.repository.AssetRepository;
import com.smartcampus.catalog.util.IdValidationUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AssetRatingService {

    private final AssetRepository assetRepository;
    private final AssetRatingRepository assetRatingRepository;
    private final BookingRepository bookingRepository;

    public AssetRatingService(AssetRepository assetRepository,
                              AssetRatingRepository assetRatingRepository,
                              BookingRepository bookingRepository) {
        this.assetRepository = assetRepository;
        this.assetRatingRepository = assetRatingRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public AssetRatingsOverviewResponse getRatingsOverview(String assetId, AuthenticatedUser currentUser) {
        String validatedAssetId = validateAssetExists(assetId).getId();
        List<AssetRating> ratings = assetRatingRepository.findByAssetIdOrderByUpdatedAtDesc(validatedAssetId);
        ReviewEligibility eligibility = determineEligibility(validatedAssetId, currentUser);

        AssetRating currentUserRating = null;
        if (currentUser != null && IdValidationUtils.trimToNull(currentUser.getUserId()) != null) {
            currentUserRating = ratings.stream()
                    .filter(rating -> currentUser.getUserId().equals(rating.getUserId()))
                    .findFirst()
                    .orElse(null);
        }

        return buildOverview(ratings, currentUserRating, eligibility);
    }

    public AssetRatingResponse createRating(String assetId, AssetRatingRequest request, AuthenticatedUser currentUser) {
        String validatedAssetId = validateEligibleUserAndAsset(assetId, currentUser).getId();
        if (assetRatingRepository.existsByAssetIdAndUserId(validatedAssetId, currentUser.getUserId())) {
            throw new ConflictException("You have already reviewed this asset. Update your existing review instead.");
        }

        AssetRating assetRating = new AssetRating();
        assetRating.setAssetId(validatedAssetId);
        assetRating.setUserId(currentUser.getUserId());
        assetRating.setUserName(resolveDisplayName(currentUser));
        assetRating.setRating(request.getRating());
        assetRating.setReviewText(normalizeReviewText(request.getReviewText()));

        return AssetRatingResponse.fromAssetRating(assetRatingRepository.save(assetRating));
    }

    public AssetRatingResponse updateMyRating(String assetId, AssetRatingRequest request, AuthenticatedUser currentUser) {
        String validatedAssetId = validateEligibleUserAndAsset(assetId, currentUser).getId();
        AssetRating assetRating = assetRatingRepository.findByAssetIdAndUserId(validatedAssetId, currentUser.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Rating not found for the current user and asset."));

        assetRating.setRating(request.getRating());
        assetRating.setReviewText(normalizeReviewText(request.getReviewText()));
        assetRating.setUserName(resolveDisplayName(currentUser));

        return AssetRatingResponse.fromAssetRating(assetRatingRepository.save(assetRating));
    }

    private Asset validateEligibleUserAndAsset(String assetId, AuthenticatedUser currentUser) {
        Asset asset = validateAssetExists(assetId);
        if (currentUser == null || IdValidationUtils.trimToNull(currentUser.getUserId()) == null) {
            throw new UnauthorizedException("Authentication is required to rate assets.");
        }
        if (!UserRole.USER.name().equalsIgnoreCase(currentUser.getRole())) {
            throw new UnauthorizedException("Only student users can rate assets.");
        }
        if (!bookingRepository.existsByRequestedByIdAndResourceIdAndStatus(
                currentUser.getUserId(),
                asset.getId(),
                BookingStatus.APPROVED
        )) {
            throw new BadRequestException("You can rate an asset only after you have an approved booking for it.");
        }
        return asset;
    }

    private Asset validateAssetExists(String assetId) {
        String validatedAssetId = IdValidationUtils.requireValidObjectId(assetId, "Asset ID");
        return assetRepository.findById(validatedAssetId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + validatedAssetId));
    }

    private ReviewEligibility determineEligibility(String assetId, AuthenticatedUser currentUser) {
        if (currentUser == null || IdValidationUtils.trimToNull(currentUser.getUserId()) == null) {
            return new ReviewEligibility(false, "Authentication is required to view review eligibility.");
        }

        if (!UserRole.USER.name().equalsIgnoreCase(currentUser.getRole())) {
            return new ReviewEligibility(false, "Only student users can rate and review assets.");
        }

        boolean hasApprovedBooking = bookingRepository.existsByRequestedByIdAndResourceIdAndStatus(
                currentUser.getUserId(),
                assetId,
                BookingStatus.APPROVED
        );
        if (!hasApprovedBooking) {
            return new ReviewEligibility(false, "You can review this asset only after you have an approved booking for it.");
        }

        boolean hasExistingReview = assetRatingRepository.existsByAssetIdAndUserId(assetId, currentUser.getUserId());
        return new ReviewEligibility(
                true,
                hasExistingReview ? "You already reviewed this asset. You can update your rating below." : null
        );
    }

    private AssetRatingsOverviewResponse buildOverview(List<AssetRating> ratings,
                                                       AssetRating currentUserRating,
                                                       ReviewEligibility eligibility) {
        AssetRatingsOverviewResponse response = new AssetRatingsOverviewResponse();
        response.setAverageRating(ratings.stream()
                .mapToInt(AssetRating::getRating)
                .average()
                .orElse(0.0));
        response.setRatingCount((long) ratings.size());
        response.setCanReview(eligibility.canReview());
        response.setReviewEligibilityMessage(eligibility.message());
        response.setCurrentUserRating(currentUserRating != null
                ? AssetRatingResponse.fromAssetRating(currentUserRating)
                : null);
        response.setReviews(ratings.stream()
                .map(AssetRatingResponse::fromAssetRating)
                .collect(Collectors.toList()));
        return response;
    }

    private String resolveDisplayName(AuthenticatedUser currentUser) {
        String userName = IdValidationUtils.trimToNull(currentUser.getUserName());
        if (userName != null) {
            return userName;
        }

        String email = IdValidationUtils.trimToNull(currentUser.getEmail());
        return email != null ? email : "Student";
    }

    private String normalizeReviewText(String reviewText) {
        return IdValidationUtils.trimToNull(reviewText);
    }

    private record ReviewEligibility(boolean canReview, String message) {
    }
}
