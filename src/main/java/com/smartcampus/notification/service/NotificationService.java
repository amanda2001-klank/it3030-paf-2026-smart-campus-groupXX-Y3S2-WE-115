package com.smartcampus.notification.service;

import com.smartcampus.auth.model.AppUser;
import com.smartcampus.auth.model.UserRole;
import com.smartcampus.auth.repository.AppUserRepository;
import com.smartcampus.booking.exception.BadRequestException;
import com.smartcampus.booking.exception.ResourceNotFoundException;
import com.smartcampus.booking.model.Booking;
import com.smartcampus.catalog.model.Asset;
import com.smartcampus.notification.dto.NotificationResponse;
import com.smartcampus.notification.model.Notification;
import com.smartcampus.notification.model.NotificationType;
import com.smartcampus.notification.repository.NotificationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class NotificationService {

    private static final int MAX_FETCH_LIMIT = 100;
    private static final int MIN_FETCH_LIMIT = 1;

    private final NotificationRepository notificationRepository;
    private final AppUserRepository appUserRepository;
    private final NotificationStreamService notificationStreamService;

    public NotificationService(
            NotificationRepository notificationRepository,
            AppUserRepository appUserRepository,
            NotificationStreamService notificationStreamService
    ) {
        this.notificationRepository = notificationRepository;
        this.appUserRepository = appUserRepository;
        this.notificationStreamService = notificationStreamService;
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(String userId, boolean unreadOnly, int limit) {
        int normalizedLimit = normalizeLimit(limit);
        PageRequest pageRequest = PageRequest.of(0, normalizedLimit);

        if (unreadOnly) {
            return notificationRepository
                    .findByRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageRequest)
                    .stream()
                    .map(NotificationResponse::fromNotification)
                    .toList();
        }

        return notificationRepository
                .findByRecipientUserIdOrderByCreatedAtDesc(userId, pageRequest)
                .stream()
                .map(NotificationResponse::fromNotification)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userId) {
        return notificationRepository.countByRecipientUserIdAndIsReadFalse(userId);
    }

    public NotificationResponse markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findByIdAndRecipientUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }

        notificationStreamService.emitUnreadCount(userId, getUnreadCount(userId));
        return NotificationResponse.fromNotification(notification);
    }

    public long markAllAsRead(String userId) {
        List<Notification> unreadNotifications = notificationRepository.findByRecipientUserIdAndIsReadFalse(userId);
        if (unreadNotifications.isEmpty()) {
            return 0;
        }

        LocalDateTime now = LocalDateTime.now();
        unreadNotifications.forEach(notification -> {
            notification.setRead(true);
            notification.setReadAt(now);
        });

        notificationRepository.saveAll(unreadNotifications);
        notificationStreamService.emitUnreadCount(userId, 0);
        return unreadNotifications.size();
    }

    public void notifyAdminsNewUser(AppUser user) {
        String safeUserName = safeName(user.getUserName());
        notifyRoles(
                List.of(UserRole.ADMIN),
                NotificationType.USER_REGISTERED,
                "New User Registration",
                safeUserName + " joined the platform as " + (user.getRole() != null ? user.getRole().name() : UserRole.USER.name()) + ".",
                "USER",
                user.getId()
        );
    }

    public void notifyUserAccountCreated(AppUser user) {
        createForUser(
                user.getId(),
                NotificationType.USER_ACCOUNT_CREATED,
                "Welcome to Smart Campus",
                "Your account was created with role " + (user.getRole() != null ? user.getRole().name() : UserRole.USER.name()) + ".",
                "USER",
                user.getId()
        );
    }

    public void notifyUserAccountUpdated(AppUser user) {
        createForUser(
                user.getId(),
                NotificationType.USER_ACCOUNT_UPDATED,
                "Account Details Updated",
                "Your account details were updated by an administrator.",
                "USER",
                user.getId()
        );
    }

    public void notifyUserRoleChanged(AppUser user, UserRole previousRole, UserRole newRole) {
        createForUser(
                user.getId(),
                NotificationType.USER_ROLE_CHANGED,
                "Role Assignment Updated",
                "Your role changed from " + previousRole.name() + " to " + newRole.name() + ".",
                "USER",
                user.getId()
        );
    }

    public void notifyAdminsNewBooking(Booking booking) {
        notifyRoles(
                List.of(UserRole.ADMIN),
                NotificationType.BOOKING_CREATED,
                "New Booking Request",
                safeName(booking.getRequestedByName()) + " requested " + safeName(booking.getResourceName()) + ".",
                "BOOKING",
                booking.getId()
        );
    }

    public void notifyUserBookingApproved(Booking booking) {
        createForUser(
                booking.getRequestedById(),
                NotificationType.BOOKING_APPROVED,
                "Booking Approved",
                "Your booking for " + safeName(booking.getResourceName()) + " has been approved.",
                "BOOKING",
                booking.getId()
        );
    }

    public void notifyUserBookingRejected(Booking booking) {
        String suffix = booking.getRejectionReason() != null && !booking.getRejectionReason().isBlank()
                ? " Reason: " + booking.getRejectionReason()
                : "";
        createForUser(
                booking.getRequestedById(),
                NotificationType.BOOKING_REJECTED,
                "Booking Rejected",
                "Your booking for " + safeName(booking.getResourceName()) + " was rejected." + suffix,
                "BOOKING",
                booking.getId()
        );
    }

    public void notifyAdminsBookingCancelled(Booking booking) {
        notifyRoles(
                List.of(UserRole.ADMIN),
                NotificationType.BOOKING_CANCELLED,
                "Booking Cancelled",
                safeName(booking.getRequestedByName()) + " cancelled booking for " + safeName(booking.getResourceName()) + ".",
                "BOOKING",
                booking.getId()
        );
    }

    public void notifyAssetCreated(Asset asset) {
        notifyRoles(
                List.of(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.TECHNICIAN),
                NotificationType.ASSET_CREATED,
                "New Asset Added",
                safeName(asset.getAssetName()) + " was added to the catalogue.",
                "ASSET",
                asset.getId()
        );
    }

    public void notifyAssetUpdated(Asset asset) {
        notifyRoles(
                List.of(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.TECHNICIAN),
                NotificationType.ASSET_UPDATED,
                "Asset Updated",
                safeName(asset.getAssetName()) + " was updated in the catalogue.",
                "ASSET",
                asset.getId()
        );
    }

    public void notifyAssetDeleted(String assetId, String assetName) {
        notifyRoles(
                List.of(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.TECHNICIAN),
                NotificationType.ASSET_DELETED,
                "Asset Removed",
                safeName(assetName) + " was removed from the catalogue.",
                "ASSET",
                assetId
        );
    }

    public void notifyAssetTypeCreated(String assetTypeId, String assetTypeName) {
        notifyRoles(
                List.of(UserRole.ADMIN, UserRole.ASSET_MANAGER),
                NotificationType.ASSET_TYPE_CREATED,
                "Asset Type Added",
                "Asset type " + safeName(assetTypeName) + " was created.",
                "ASSET_TYPE",
                assetTypeId
        );
    }

    public void notifyAssetTypeUpdated(String assetTypeId, String assetTypeName) {
        notifyRoles(
                List.of(UserRole.ADMIN, UserRole.ASSET_MANAGER),
                NotificationType.ASSET_TYPE_UPDATED,
                "Asset Type Updated",
                "Asset type " + safeName(assetTypeName) + " was updated.",
                "ASSET_TYPE",
                assetTypeId
        );
    }

    public void notifyAssetTypeDeleted(String assetTypeId, String assetTypeCode) {
        notifyRoles(
                List.of(UserRole.ADMIN, UserRole.ASSET_MANAGER),
                NotificationType.ASSET_TYPE_DELETED,
                "Asset Type Removed",
                "Asset type " + safeName(assetTypeCode) + " was deleted.",
                "ASSET_TYPE",
                assetTypeId
        );
    }

    public void notifyLocationCreated(String locationId, String locationName) {
        notifyRoles(
                List.of(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.TECHNICIAN),
                NotificationType.LOCATION_CREATED,
                "Location Added",
                "Location " + safeName(locationName) + " was created.",
                "LOCATION",
                locationId
        );
    }

    public void notifyLocationUpdated(String locationId, String locationName) {
        notifyRoles(
                List.of(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.TECHNICIAN),
                NotificationType.LOCATION_UPDATED,
                "Location Updated",
                "Location " + safeName(locationName) + " was updated.",
                "LOCATION",
                locationId
        );
    }

    public void notifyLocationDeleted(String locationId, String locationName) {
        notifyRoles(
                List.of(UserRole.ADMIN, UserRole.ASSET_MANAGER, UserRole.TECHNICIAN),
                NotificationType.LOCATION_DELETED,
                "Location Removed",
                "Location " + safeName(locationName) + " was deleted.",
                "LOCATION",
                locationId
        );
    }

    private void notifyRoles(Collection<UserRole> roles,
                             NotificationType type,
                             String title,
                             String message,
                             String entityType,
                             String entityId) {
        Set<String> recipientIds = appUserRepository.findByRoleIn(roles)
                .stream()
                .map(AppUser::getId)
                .filter(id -> id != null && !id.isBlank())
                .collect(Collectors.toCollection(LinkedHashSet::new));

        createForUsers(recipientIds, type, title, message, entityType, entityId);
    }

    private void createForUsers(Collection<String> userIds,
                                NotificationType type,
                                String title,
                                String message,
                                String entityType,
                                String entityId) {
        if (userIds == null || userIds.isEmpty()) {
            return;
        }

        List<Notification> notifications = userIds.stream()
                .filter(userId -> userId != null && !userId.isBlank())
                .map(userId -> buildNotification(userId, type, title, message, entityType, entityId))
                .toList();

        if (!notifications.isEmpty()) {
            List<Notification> savedNotifications = notificationRepository.saveAll(notifications);
            savedNotifications.forEach(notification -> {
                notificationStreamService.emitNotification(notification.getRecipientUserId(), NotificationResponse.fromNotification(notification));
                notificationStreamService.emitUnreadCount(notification.getRecipientUserId(), getUnreadCount(notification.getRecipientUserId()));
            });
        }
    }

    private void createForUser(String userId,
                               NotificationType type,
                               String title,
                               String message,
                               String entityType,
                               String entityId) {
        if (userId == null || userId.isBlank()) {
            return;
        }
        Notification savedNotification = notificationRepository.save(buildNotification(userId, type, title, message, entityType, entityId));
        notificationStreamService.emitNotification(userId, NotificationResponse.fromNotification(savedNotification));
        notificationStreamService.emitUnreadCount(userId, getUnreadCount(userId));
    }

    private Notification buildNotification(String recipientUserId,
                                           NotificationType type,
                                           String title,
                                           String message,
                                           String entityType,
                                           String entityId) {
        Notification notification = new Notification();
        notification.setRecipientUserId(recipientUserId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setEntityType(entityType);
        notification.setEntityId(entityId);
        notification.setRead(false);
        notification.setReadAt(null);
        return notification;
    }

    private int normalizeLimit(int limit) {
        if (limit < MIN_FETCH_LIMIT || limit > MAX_FETCH_LIMIT) {
            throw new BadRequestException("limit must be between " + MIN_FETCH_LIMIT + " and " + MAX_FETCH_LIMIT);
        }
        return limit;
    }

    private String safeName(String value) {
        if (value == null || value.isBlank()) {
            return "Unknown";
        }
        return value.trim();
    }
}
