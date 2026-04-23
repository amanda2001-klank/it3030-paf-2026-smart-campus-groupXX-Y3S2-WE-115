package com.smartcampus.catalog.dto;

import com.smartcampus.catalog.model.Asset;
import com.smartcampus.catalog.model.AssetStatus;
import com.smartcampus.catalog.model.AssetMedia;
import com.smartcampus.catalog.model.AssetType;
import com.smartcampus.catalog.model.Location;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

public class AssetResponse {

    private String id;
    private String assetCode;
    private String assetName;
    private String assetTypeId;
    private AssetTypeResponse assetType;
    private String locationId;
    private LocationResponse location;
    private Integer capacity;
    private String description;
    private AssetStatus status;
    private Boolean isBookable;
    private String createdById;
    private List<AssetMediaResponse> media;
    private Double averageRating;
    private Long ratingCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AssetResponse fromAsset(Asset asset,
                                          AssetType assetType,
                                          Location location,
                                          List<AssetMedia> media,
                                          Double averageRating,
                                          Long ratingCount) {
        AssetResponse response = new AssetResponse();
        response.setId(asset.getId());
        response.setAssetCode(asset.getAssetCode());
        response.setAssetName(asset.getAssetName());
        response.setAssetTypeId(asset.getAssetTypeId());
        response.setAssetType(assetType != null ? AssetTypeResponse.fromAssetType(assetType) : null);
        response.setLocationId(asset.getLocationId());
        response.setLocation(location != null ? LocationResponse.fromLocation(location) : null);
        response.setCapacity(asset.getCapacity());
        response.setDescription(asset.getDescription());
        response.setStatus(asset.getStatus());
        response.setIsBookable(asset.getIsBookable());
        response.setCreatedById(asset.getCreatedById());
        response.setMedia(media == null
                ? Collections.emptyList()
                : media.stream().map(AssetMediaResponse::fromAssetMedia).collect(Collectors.toList()));
        response.setAverageRating(averageRating != null ? averageRating : 0.0);
        response.setRatingCount(ratingCount != null ? ratingCount : 0L);
        response.setCreatedAt(asset.getCreatedAt());
        response.setUpdatedAt(asset.getUpdatedAt());
        return response;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAssetCode() {
        return assetCode;
    }

    public void setAssetCode(String assetCode) {
        this.assetCode = assetCode;
    }

    public String getAssetName() {
        return assetName;
    }

    public void setAssetName(String assetName) {
        this.assetName = assetName;
    }

    public String getAssetTypeId() {
        return assetTypeId;
    }

    public void setAssetTypeId(String assetTypeId) {
        this.assetTypeId = assetTypeId;
    }

    public AssetTypeResponse getAssetType() {
        return assetType;
    }

    public void setAssetType(AssetTypeResponse assetType) {
        this.assetType = assetType;
    }

    public String getLocationId() {
        return locationId;
    }

    public void setLocationId(String locationId) {
        this.locationId = locationId;
    }

    public LocationResponse getLocation() {
        return location;
    }

    public void setLocation(LocationResponse location) {
        this.location = location;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public AssetStatus getStatus() {
        return status;
    }

    public void setStatus(AssetStatus status) {
        this.status = status;
    }

    public Boolean getIsBookable() {
        return isBookable;
    }

    public void setIsBookable(Boolean bookable) {
        isBookable = bookable;
    }

    public String getCreatedById() {
        return createdById;
    }

    public void setCreatedById(String createdById) {
        this.createdById = createdById;
    }

    public List<AssetMediaResponse> getMedia() {
        return media;
    }

    public void setMedia(List<AssetMediaResponse> media) {
        this.media = media;
    }

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
