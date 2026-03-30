package com.smartcampus.booking.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public class BookingRequest {

    @NotBlank(message = "Resource ID is required")
    private String resourceId;

    private String resourceName;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @NotBlank(message = "Purpose is required")
    @Size(max = 500, message = "Purpose cannot exceed 500 characters")
    private String purpose;

    @Min(value = 1, message = "Expected attendees must be at least 1")
    private Integer expectedAttendees;

    // Constructors
    public BookingRequest() {
    }

    public BookingRequest(String resourceId, LocalDateTime startTime, LocalDateTime endTime,
                         String purpose, Integer expectedAttendees) {
        this.resourceId = resourceId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.purpose = purpose;
        this.expectedAttendees = expectedAttendees;
    }

    // Getters and Setters
    public String getResourceId() {
        return resourceId;
    }

    public void setResourceId(String resourceId) {
        this.resourceId = resourceId;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public Integer getExpectedAttendees() {
        return expectedAttendees;
    }

    public void setExpectedAttendees(Integer expectedAttendees) {
        this.expectedAttendees = expectedAttendees;
    }

    @Override
    public String toString() {
        return "BookingRequest{" +
                "resourceId='" + resourceId + '\'' +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", purpose='" + purpose + '\'' +
                ", expectedAttendees=" + expectedAttendees +
                '}';
    }
}
