package com.smartcampus.auth.security;

public class AuthenticatedUser {

    private final String userId;
    private final String userName;
    private final String email;
    private final String role;

    public AuthenticatedUser(String userId, String userName, String email, String role) {
        this.userId = userId;
        this.userName = userName;
        this.email = email;
        this.role = role;
    }

    public String getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public String getEmail() {
        return email;
    }

    public String getRole() {
        return role;
    }
}
