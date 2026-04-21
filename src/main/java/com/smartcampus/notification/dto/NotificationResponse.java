package com.smartcampus.notification.dto;

import com.smartcampus.notification.model.Notification;

import java.time.LocalDateTime;

public class NotificationResponse {

    private String id;
    private String type;
    private String title;
    private String message;
    private String entityType;
    private String entityId;
    private boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;

    public NotificationResponse() {
    }

    public NotificationResponse(
            String id,
            String type,
            String title,
            String message,
            String entityType,
            String entityId,
            boolean isRead,
            LocalDateTime readAt,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.message = message;
        this.entityType = entityType;
        this.entityId = entityId;
        this.isRead = isRead;
        this.readAt = readAt;
        this.createdAt = createdAt;
    }

    public static NotificationResponse fromNotification(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType() != null ? notification.getType().name() : "SYSTEM_INFO",
                notification.getTitle(),
                notification.getMessage(),
                notification.getEntityType(),
                notification.getEntityId(),
                notification.isRead(),
                notification.getReadAt(),
                notification.getCreatedAt()
        );
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public LocalDateTime getReadAt() {
        return readAt;
    }

    public void setReadAt(LocalDateTime readAt) {
        this.readAt = readAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
