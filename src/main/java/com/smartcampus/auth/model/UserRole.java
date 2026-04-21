package com.smartcampus.auth.model;

public enum UserRole {
    ADMIN,
    USER,
    ASSET_MANAGER,
    TECHNICIAN;

    public static UserRole fromValue(String value) {
        if (value == null || value.isBlank()) {
            return USER;
        }

        try {
            return UserRole.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid role: " + value);
        }
    }
}
