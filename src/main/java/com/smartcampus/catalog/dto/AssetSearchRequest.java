package com.smartcampus.catalog.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AssetSearchRequest {

    @Size(max = 150, message = "Search query cannot exceed 150 characters")
    private String query;

    private String assetTypeId;

    @Size(max = 50, message = "Asset type code filter cannot exceed 50 characters")
    private String assetTypeCode;

    private String locationId;

    @Size(max = 100, message = "Building filter cannot exceed 100 characters")
    private String building;

    @Size(max = 50, message = "Floor filter cannot exceed 50 characters")
    private String floor;

    @Size(max = 50, message = "Room code filter cannot exceed 50 characters")
    private String roomCode;

    @Size(max = 50, message = "Status filter cannot exceed 50 characters")
    private String status;

    private Boolean isBookable;

    @Min(value = 0, message = "Minimum capacity cannot be negative")
    private Integer minCapacity;

    @Min(value = 0, message = "Maximum capacity cannot be negative")
    private Integer maxCapacity;

    @Min(value = 0, message = "Page must be 0 or greater")
    private int page = 0;

    @Min(value = 1, message = "Size must be at least 1")
    @Max(value = 100, message = "Size cannot exceed 100")
    private int size = 10;

    @Pattern(regexp = "(?i)asc|desc", message = "sortDir must be ASC or DESC")
    private String sortDir = "desc";

    private String sortBy = "createdAt";

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getAssetTypeId() {
        return assetTypeId;
    }

    public void setAssetTypeId(String assetTypeId) {
        this.assetTypeId = assetTypeId;
    }

    public String getAssetTypeCode() {
        return assetTypeCode;
    }

    public void setAssetTypeCode(String assetTypeCode) {
        this.assetTypeCode = assetTypeCode;
    }

    public String getLocationId() {
        return locationId;
    }

    public void setLocationId(String locationId) {
        this.locationId = locationId;
    }

    public String getBuilding() {
        return building;
    }

    public void setBuilding(String building) {
        this.building = building;
    }

    public String getFloor() {
        return floor;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Boolean getIsBookable() {
        return isBookable;
    }

    public void setIsBookable(Boolean bookable) {
        isBookable = bookable;
    }

    public Integer getMinCapacity() {
        return minCapacity;
    }

    public void setMinCapacity(Integer minCapacity) {
        this.minCapacity = minCapacity;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public void setMaxCapacity(Integer maxCapacity) {
        this.maxCapacity = maxCapacity;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public String getSortDir() {
        return sortDir;
    }

    public void setSortDir(String sortDir) {
        this.sortDir = sortDir;
    }

    public String getSortBy() {
        return sortBy;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }
}
