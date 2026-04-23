package com.smartcampus.catalog.dto;

import java.util.List;

public class AssetRatingsOverviewResponse {

    private Double averageRating;
    private Long ratingCount;
    private boolean canReview;
    private String reviewEligibilityMessage;
    private AssetRatingResponse currentUserRating;
    private List<AssetRatingResponse> reviews;

    public Double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(Double averageRating) {
        this.averageRating = averageRating;
    }

    public Long getRatingCount() {
        return ratingCount;
    }

    public void setRatingCount(Long ratingCount) {
        this.ratingCount = ratingCount;
    }

    public boolean isCanReview() {
        return canReview;
    }

    public void setCanReview(boolean canReview) {
        this.canReview = canReview;
    }

    public String getReviewEligibilityMessage() {
        return reviewEligibilityMessage;
    }

    public void setReviewEligibilityMessage(String reviewEligibilityMessage) {
        this.reviewEligibilityMessage = reviewEligibilityMessage;
    }

    public AssetRatingResponse getCurrentUserRating() {
        return currentUserRating;
    }

    public void setCurrentUserRating(AssetRatingResponse currentUserRating) {
        this.currentUserRating = currentUserRating;
    }

    public List<AssetRatingResponse> getReviews() {
        return reviews;
    }

    public void setReviews(List<AssetRatingResponse> reviews) {
        this.reviews = reviews;
    }
}
