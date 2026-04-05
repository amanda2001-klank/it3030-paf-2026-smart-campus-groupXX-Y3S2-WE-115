package com.smartcampus.booking.model;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    @NotBlank(message = "Resource ID is required")
    @Indexed
    @Field(targetType = FieldType.OBJECT_ID)
    private String resourceId;

    private String resourceName;

    // user id
    @NotBlank(message = "Requested by ID is required")
    private String requestedById; 

    private String requestedByName;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    private LocalDateTime endTime;

    @NotBlank(message = "Purpose is required")
    private String purpose;

    private Integer expectedAttendees;

    private BookingStatus status = BookingStatus.PENDING;

    private String rejectionReason;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Constructors
    public Booking() {
    }

    public Booking(String resourceId, String resourceName, String requestedById, String requestedByName,
                   LocalDateTime startTime, LocalDateTime endTime, String purpose, Integer expectedAttendees) {
        this.resourceId = resourceId;
        this.resourceName = resourceName;
        this.requestedById = requestedById;
        this.requestedByName = requestedByName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.purpose = purpose;
        this.expectedAttendees = expectedAttendees;
        this.status = BookingStatus.PENDING;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

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

    public String getRequestedById() {
        return requestedById;
    }

    public void setRequestedById(String requestedById) {
        this.requestedById = requestedById;
    }

    public String getRequestedByName() {
        return requestedByName;
    }

    public void setRequestedByName(String requestedByName) {
        this.requestedByName = requestedByName;
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

    public BookingStatus getStatus() {
        return status;
    }

    public void setStatus(BookingStatus status) {
        this.status = status;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
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

    @Override
    public String toString() {
        return "Booking{" +
                "id='" + id + '\'' +
                ", resourceId='" + resourceId + '\'' +
                ", resourceName='" + resourceName + '\'' +
                ", requestedById='" + requestedById + '\'' +
                ", requestedByName='" + requestedByName + '\'' +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", purpose='" + purpose + '\'' +
                ", expectedAttendees=" + expectedAttendees +
                ", status=" + status +
                ", rejectionReason='" + rejectionReason + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }
}
