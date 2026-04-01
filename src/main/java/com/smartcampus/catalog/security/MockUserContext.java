package com.smartcampus.catalog.security;

public class MockUserContext {

    private final String userId;
    private final String userName;
    private final MockUserRole role;

    public MockUserContext(String userId, String userName, MockUserRole role) {
        this.userId = userId;
        this.userName = userName;
        this.role = role;
    }

    public String getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public MockUserRole getRole() {
        return role;
    }
}
