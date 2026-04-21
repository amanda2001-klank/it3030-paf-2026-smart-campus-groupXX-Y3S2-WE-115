package com.smartcampus.auth.dto;

public class AuthResponse {

    private String token;
    private Long expiresAt;
    private AuthUserResponse user;

    public AuthResponse() {
    }

    public AuthResponse(String token, Long expiresAt, AuthUserResponse user) {
        this.token = token;
        this.expiresAt = expiresAt;
        this.user = user;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Long expiresAt) {
        this.expiresAt = expiresAt;
    }

    public AuthUserResponse getUser() {
        return user;
    }

    public void setUser(AuthUserResponse user) {
        this.user = user;
    }
}
