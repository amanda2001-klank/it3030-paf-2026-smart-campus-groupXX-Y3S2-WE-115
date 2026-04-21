package com.smartcampus.auth.service;

import com.smartcampus.auth.dto.AuthResponse;
import com.smartcampus.auth.dto.AuthUserResponse;
import com.smartcampus.auth.dto.GoogleLoginRequest;
import com.smartcampus.auth.dto.LoginRequest;
import com.smartcampus.auth.dto.RegisterRequest;
import com.smartcampus.auth.model.AppUser;
import com.smartcampus.auth.model.AuthProvider;
import com.smartcampus.auth.model.UserRole;
import com.smartcampus.auth.repository.AppUserRepository;
import com.smartcampus.booking.exception.BadRequestException;
import com.smartcampus.booking.exception.ConflictException;
import com.smartcampus.notification.service.NotificationService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Locale;

@Service
public class AuthService {

    private static final String INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleTokenService googleTokenService;
    private final NotificationService notificationService;

    public AuthService(
            AppUserRepository appUserRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            GoogleTokenService googleTokenService,
            NotificationService notificationService
    ) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleTokenService = googleTokenService;
        this.notificationService = notificationService;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        String userName = normalizeUserName(request.getUserName());
        UserRole role = resolveRegistrationRole(request.getRole());

        if (appUserRepository.existsByEmail(email)) {
            throw new ConflictException("An account already exists for this email.");
        }

        AppUser user = new AppUser();
        user.setEmail(email);
        user.setUserName(userName);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setRole(role);
        user.setProvider(AuthProvider.LOCAL);

        AppUser savedUser = appUserRepository.save(user);
        notificationService.notifyAdminsNewUser(savedUser);
        return buildAuthResponse(savedUser);
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());

        AppUser user = appUserRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException(INVALID_CREDENTIALS_MESSAGE));

        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new BadRequestException("This account uses Google Sign-In. Please continue with Google login.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException(INVALID_CREDENTIALS_MESSAGE);
        }

        if (user.getRole() == null) {
            user.setRole(UserRole.USER);
            user = appUserRepository.save(user);
        }

        return buildAuthResponse(user);
    }

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleTokenService.GoogleProfile googleProfile = googleTokenService.verifyIdToken(request.getIdToken());

        AppUser user = appUserRepository.findByEmail(googleProfile.email()).orElse(null);
        boolean isNewUser = user == null;

        if (isNewUser) {
            user = new AppUser();
            user.setEmail(googleProfile.email());
            user.setUserName(googleProfile.name());
            user.setRole(UserRole.USER);
            user.setProvider(AuthProvider.GOOGLE);
            user.setGoogleSubject(googleProfile.subject());
            user.setAvatarUrl(googleProfile.pictureUrl());
        }

        if (user.getUserName() == null || user.getUserName().isBlank()) {
            user.setUserName(googleProfile.name());
        }

        if (user.getRole() == null) {
            user.setRole(UserRole.USER);
        }

        if (user.getProvider() == null) {
            user.setProvider(AuthProvider.GOOGLE);
        }

        user.setGoogleSubject(googleProfile.subject());

        if (googleProfile.pictureUrl() != null && !googleProfile.pictureUrl().isBlank()) {
            user.setAvatarUrl(googleProfile.pictureUrl());
        }

        AppUser savedUser = appUserRepository.save(user);
        if (isNewUser) {
            notificationService.notifyAdminsNewUser(savedUser);
        }
        return buildAuthResponse(savedUser);
    }

    private AuthResponse buildAuthResponse(AppUser user) {
        String token = jwtService.generateToken(user);
        long expiresAt = Instant.now().toEpochMilli() + jwtService.getExpirationInMillis();

        AuthUserResponse userResponse = new AuthUserResponse(
                user.getId(),
                user.getUserName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole().name() : UserRole.USER.name(),
                user.getAvatarUrl()
        );

        return new AuthResponse(token, expiresAt, userResponse);
    }

    private UserRole resolveRegistrationRole(String roleValue) {
        if (roleValue == null || roleValue.isBlank()) {
            return UserRole.USER;
        }

        try {
            UserRole requestedRole = UserRole.fromValue(roleValue);
            if (requestedRole != UserRole.USER) {
                throw new BadRequestException("Public registration can only create USER accounts.");
            }
            return requestedRole;
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Role must be one of: ADMIN, USER, ASSET_MANAGER, TECHNICIAN");
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
