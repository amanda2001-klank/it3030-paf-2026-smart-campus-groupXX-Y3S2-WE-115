package com.smartcampus.audit.dto;

import com.smartcampus.audit.model.AdminAuditLog;

import java.time.LocalDateTime;

public class AdminAuditLogResponse {

    private String id;
    private String actorUserId;
    private String actorName;
    private String actorRole;
    private String action;
    private String entityType;
    private String entityId;
    private String details;
    private LocalDateTime createdAt;

    public static AdminAuditLogResponse fromModel(AdminAuditLog model) {
        AdminAuditLogResponse response = new AdminAuditLogResponse();
        response.setId(model.getId());
        response.setActorUserId(model.getActorUserId());
        response.setActorName(model.getActorName());
        response.setActorRole(model.getActorRole());
        response.setAction(model.getAction());
        response.setEntityType(model.getEntityType());
        response.setEntityId(model.getEntityId());
        response.setDetails(model.getDetails());
        response.setCreatedAt(model.getCreatedAt());
        return response;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getActorUserId() {
        return actorUserId;
    }

    public void setActorUserId(String actorUserId) {
        this.actorUserId = actorUserId;
    }

    public String getActorName() {
        return actorName;
    }

    public void setActorName(String actorName) {
        this.actorName = actorName;
    }

    public String getActorRole() {
        return actorRole;
    }

    public void setActorRole(String actorRole) {
        this.actorRole = actorRole;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
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

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
