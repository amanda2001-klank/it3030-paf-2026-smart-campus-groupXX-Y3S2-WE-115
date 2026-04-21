package com.smartcampus.auth.service;

import com.smartcampus.auth.dto.AdminCreateUserRequest;
import com.smartcampus.auth.dto.AdminUpdateUserRequest;
import com.smartcampus.auth.dto.AdminUpdateUserRoleRequest;
import com.smartcampus.auth.dto.AdminUserResponse;
import com.smartcampus.auth.model.AppUser;
import com.smartcampus.auth.model.AuthProvider;
import com.smartcampus.auth.model.UserRole;
import com.smartcampus.auth.repository.AppUserRepository;
import com.smartcampus.booking.exception.BadRequestException;
import com.smartcampus.booking.exception.ConflictException;
import com.smartcampus.booking.exception.ResourceNotFoundException;
import com.smartcampus.notification.service.NotificationService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class AdminUserService {

    private static final String ROLE_VALIDATION_MESSAGE = "Role must be one of: ADMIN, USER, ASSET_MANAGER, TECHNICIAN";

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;

    public AdminUserService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            NotificationService notificationService
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
    }

    public List<AdminUserResponse> listUsers() {
        return appUserRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(
                        (AppUser user) -> user.getCreatedAt() != null ? user.getCreatedAt() : LocalDateTime.MIN
                ).reversed())
                .map(this::toResponse)
                .toList();
    }

    public AdminUserResponse getUserById(String userId) {
        return toResponse(findUserById(userId));
    }

    public AdminUserResponse createUser(AdminCreateUserRequest request) {
        String email = normalizeEmail(request.getEmail());
        String userName = normalizeUserName(request.getUserName());
        UserRole role = resolveRole(request.getRole());

        if (appUserRepository.existsByEmail(email)) {
            throw new ConflictException("An account already exists for this email.");
        }

        AppUser user = new AppUser();
        user.setUserName(userName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setProvider(AuthProvider.LOCAL);

        AppUser saved = appUserRepository.save(user);
        notificationService.notifyUserAccountCreated(saved);
        return toResponse(saved);
    }

    public AdminUserResponse updateUser(String userId, AdminUpdateUserRequest request) {
        AppUser user = findUserById(userId);

        String email = normalizeEmail(request.getEmail());
        String userName = normalizeUserName(request.getUserName());

        if (appUserRepository.existsByEmailAndIdNot(email, userId)) {
            throw new ConflictException("An account already exists for this email.");
        }

        user.setUserName(userName);
        user.setEmail(email);

        AppUser saved = appUserRepository.save(user);
        notificationService.notifyUserAccountUpdated(saved);
        return toResponse(saved);
    }

    public AdminUserResponse updateUserRole(String userId, AdminUpdateUserRoleRequest request, String actingUserId) {
        AppUser user = findUserById(userId);
        UserRole currentRole = user.getRole() != null ? user.getRole() : UserRole.USER;
        UserRole newRole = resolveRole(request.getRole());

        if (userId.equals(actingUserId) && newRole != UserRole.ADMIN) {
            throw new BadRequestException("You cannot remove your own ADMIN role.");
        }

        if (currentRole == UserRole.ADMIN
                && newRole != UserRole.ADMIN
                && appUserRepository.countByRole(UserRole.ADMIN) <= 1) {
            throw new BadRequestException("At least one ADMIN account must remain in the system.");
        }

        user.setRole(newRole);
        AppUser saved = appUserRepository.save(user);
        notificationService.notifyUserRoleChanged(saved, currentRole, newRole);
        return toResponse(saved);
    }

    public void deleteUser(String userId, String actingUserId) {
        AppUser user = findUserById(userId);
        UserRole role = user.getRole() != null ? user.getRole() : UserRole.USER;

        if (userId.equals(actingUserId)) {
            throw new BadRequestException("You cannot delete your own account.");
        }

        if (role == UserRole.ADMIN && appUserRepository.countByRole(UserRole.ADMIN) <= 1) {
            throw new BadRequestException("At least one ADMIN account must remain in the system.");
        }

        appUserRepository.deleteById(userId);
    }

    private AppUser findUserById(String userId) {
        return appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    private AdminUserResponse toResponse(AppUser user) {
        UserRole role = user.getRole() != null ? user.getRole() : UserRole.USER;
        AuthProvider provider = user.getProvider() != null ? user.getProvider() : AuthProvider.LOCAL;

        return new AdminUserResponse(
                user.getId(),
                user.getUserName(),
                user.getEmail(),
                role.name(),
                provider.name(),
                user.getAvatarUrl(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    private UserRole resolveRole(String roleValue) {
        try {
            return UserRole.fromValue(roleValue);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException(ROLE_VALIDATION_MESSAGE);
        }
    }

    private String normalizeEmail(String email) {
        if (email == null) {
            throw new BadRequestException("Email is required.");
        }

        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank()) {
            throw new BadRequestException("Email is required.");
        }

        return normalized;
    }

    private String normalizeUserName(String userName) {
        if (userName == null) {
            throw new BadRequestException("Name is required.");
        }

        String normalized = userName.trim();
        if (normalized.isBlank()) {
            throw new BadRequestException("Name is required.");
        }

        return normalized;
    }
}
