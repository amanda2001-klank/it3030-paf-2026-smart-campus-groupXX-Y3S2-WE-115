package com.smartcampus.auth.controller;

import com.smartcampus.auth.dto.AdminCreateUserRequest;
import com.smartcampus.auth.dto.AdminUpdateUserRequest;
import com.smartcampus.auth.dto.AdminUpdateUserRoleRequest;
import com.smartcampus.auth.dto.AdminUserResponse;
import com.smartcampus.auth.security.AuthenticatedUser;
import com.smartcampus.auth.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<List<AdminUserResponse>> listUsers() {
        return ResponseEntity.ok(adminUserService.listUsers());
    }

    @GetMapping("/{userId}")
    public ResponseEntity<AdminUserResponse> getUserById(@PathVariable String userId) {
        return ResponseEntity.ok(adminUserService.getUserById(userId));
    }

    @PostMapping
    public ResponseEntity<AdminUserResponse> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminUserService.createUser(request));
    }

    @PutMapping("/{userId}")
    public ResponseEntity<AdminUserResponse> updateUser(
            @PathVariable String userId,
            @Valid @RequestBody AdminUpdateUserRequest request) {
        return ResponseEntity.ok(adminUserService.updateUser(userId, request));
    }

    @PutMapping("/{userId}/role")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable String userId,
            @Valid @RequestBody AdminUpdateUserRoleRequest request,
            Authentication authentication) {
        AuthenticatedUser currentUser = currentUser(authentication);
        return ResponseEntity.ok(adminUserService.updateUserRole(userId, request, currentUser.getUserId()));
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId, Authentication authentication) {
        AuthenticatedUser currentUser = currentUser(authentication);
        adminUserService.deleteUser(userId, currentUser.getUserId());
        return ResponseEntity.noContent().build();
    }

    private AuthenticatedUser currentUser(Authentication authentication) {
        return (AuthenticatedUser) authentication.getPrincipal();
    }
}
