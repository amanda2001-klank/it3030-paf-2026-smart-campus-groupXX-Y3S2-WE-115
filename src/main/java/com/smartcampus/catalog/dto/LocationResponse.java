package com.smartcampus.catalog.dto;

import com.smartcampus.catalog.model.Location;

import java.time.LocalDateTime;

public class LocationResponse {

    private String id;
    private String building;
    private String floor;
    private String roomCode;
    private String locationName;
    private String address;
    private LocalDateTime createdAt;

    public static LocationResponse fromLocation(Location location) {
        LocationResponse response = new LocationResponse();
        response.setId(location.getId());
        response.setBuilding(location.getBuilding());
        response.setFloor(location.getFloor());
        response.setRoomCode(location.getRoomCode());
        response.setLocationName(location.getLocationName());
        response.setAddress(location.getAddress());
        response.setCreatedAt(location.getCreatedAt());
        return response;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getLocationName() {
        return locationName;
    }

    public void setLocationName(String locationName) {
        this.locationName = locationName;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
