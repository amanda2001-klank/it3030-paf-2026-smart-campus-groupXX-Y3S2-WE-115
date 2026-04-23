package com.smartcampus.catalog.dto;

import com.smartcampus.catalog.model.AssetRating;

import java.time.LocalDateTime;

public class AssetRatingResponse {

    private String id;
    private String assetId;
    private String userId;
    private String userName;
    private Integer rating;
    private String reviewText;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AssetRatingResponse fromAssetRating(AssetRating assetRating) {
        AssetRatingResponse response = new AssetRatingResponse();
        response.setId(assetRating.getId());
        response.setAssetId(assetRating.getAssetId());
        response.setUserId(assetRating.getUserId());
        response.setUserName(assetRating.getUserName());
        response.setRating(assetRating.getRating());
        response.setReviewText(assetRating.getReviewText());
        response.setCreatedAt(assetRating.getCreatedAt());
        response.setUpdatedAt(assetRating.getUpdatedAt());
        return response;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAssetId() {
        return assetId;
    }

    public void setAssetId(String assetId) {
        this.assetId = assetId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getReviewText() {
        return reviewText;
    }

    public void setReviewText(String reviewText) {
        this.reviewText = reviewText;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
