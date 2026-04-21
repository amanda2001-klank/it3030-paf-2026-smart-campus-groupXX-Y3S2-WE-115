package com.smartcampus.auth.dto;

public class AuthUserResponse {

    private String userId;
    private String userName;
    private String email;
    private String userRole;
    private String avatarUrl;

    public AuthUserResponse() {
    }

    public AuthUserResponse(String userId, String userName, String email, String userRole, String avatarUrl) {
        this.userId = userId;
        this.userName = userName;
        this.email = email;
        this.userRole = userRole;
        this.avatarUrl = avatarUrl;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUserRole() {
        return userRole;
    }

    public void setUserRole(String userRole) {
        this.userRole = userRole;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
