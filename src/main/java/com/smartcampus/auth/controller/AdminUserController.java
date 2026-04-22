package com.smartcampus.auth.controller;

import com.smartcampus.auth.dto.AdminCreateUserRequest;
import com.smartcampus.auth.dto.AdminUpdateUserRequest;
import com.smartcampus.auth.dto.AdminUpdateUserRoleRequest;
import com.smartcampus.auth.dto.AdminUserResponse;
import com.smartcampus.auth.security.AuthenticatedUser;
import com.smartcampus.auth.service.AdminUserService;
import com.smartcampus.audit.service.AdminAuditLogService;
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
    private final AdminAuditLogService adminAuditLogService;

    public AdminUserController(AdminUserService adminUserService, AdminAuditLogService adminAuditLogService) {
        this.adminUserService = adminUserService;
        this.adminAuditLogService = adminAuditLogService;
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
    public ResponseEntity<AdminUserResponse> createUser(
            @Valid @RequestBody AdminCreateUserRequest request,
            Authentication authentication) {
        AdminUserResponse createdUser = adminUserService.createUser(request);
        adminAuditLogService.logAction(
                currentUser(authentication),
                "USER_CREATED",
                "USER",
                createdUser.getUserId(),
                "Created user " + createdUser.getEmail() + " with role " + createdUser.getUserRole()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<AdminUserResponse> updateUser(
            @PathVariable String userId,
            @Valid @RequestBody AdminUpdateUserRequest request,
            Authentication authentication) {
        AdminUserResponse updatedUser = adminUserService.updateUser(userId, request);
        adminAuditLogService.logAction(
                currentUser(authentication),
                "USER_UPDATED",
                "USER",
                updatedUser.getUserId(),
                "Updated user profile for " + updatedUser.getEmail()
        );
        return ResponseEntity.ok(updatedUser);
    }

    @PutMapping("/{userId}/role")
    public ResponseEntity<AdminUserResponse> updateUserRole(
            @PathVariable String userId,
            @Valid @RequestBody AdminUpdateUserRoleRequest request,
            Authentication authentication) {
        AuthenticatedUser currentUser = currentUser(authentication);
        AdminUserResponse updatedUser = adminUserService.updateUserRole(userId, request, currentUser.getUserId());
        adminAuditLogService.logAction(
            currentUser,
            "USER_ROLE_UPDATED",
            "USER",
            updatedUser.getUserId(),
            "Changed role for " + updatedUser.getEmail() + " to " + updatedUser.getUserRole()
        );
        return ResponseEntity.ok(updatedUser);
    }

    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> deleteUser(@PathVariable String userId, Authentication authentication) {
        AuthenticatedUser currentUser = currentUser(authentication);
        AdminUserResponse user = adminUserService.getUserById(userId);
        adminUserService.deleteUser(userId, currentUser.getUserId());
        adminAuditLogService.logAction(
                currentUser,
                "USER_DELETED",
                "USER",
                userId,
                "Deleted user " + user.getEmail()
        );
        return ResponseEntity.noContent().build();
    }

    private AuthenticatedUser currentUser(Authentication authentication) {
        return (AuthenticatedUser) authentication.getPrincipal();
    }
}
