package com.smartcampus.notification.controller;

import com.smartcampus.auth.security.AuthenticatedUser;
import com.smartcampus.notification.dto.NotificationResponse;
import com.smartcampus.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestParam(value = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            @RequestParam(value = "limit", defaultValue = "25") int limit,
            Authentication authentication) {
        AuthenticatedUser currentUser = currentUser(authentication);
        return ResponseEntity.ok(notificationService.getNotifications(currentUser.getUserId(), unreadOnly, limit));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        AuthenticatedUser currentUser = currentUser(authentication);
        Map<String, Long> response = new HashMap<>();
        response.put("unreadCount", notificationService.getUnreadCount(currentUser.getUserId()));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable String notificationId,
            Authentication authentication) {
        AuthenticatedUser currentUser = currentUser(authentication);
        return ResponseEntity.ok(notificationService.markAsRead(notificationId, currentUser.getUserId()));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Long>> markAllAsRead(Authentication authentication) {
        AuthenticatedUser currentUser = currentUser(authentication);
        long markedCount = notificationService.markAllAsRead(currentUser.getUserId());

        Map<String, Long> response = new HashMap<>();
        response.put("markedCount", markedCount);
        response.put("unreadCount", 0L);
        return ResponseEntity.ok(response);
    }

    private AuthenticatedUser currentUser(Authentication authentication) {
        return (AuthenticatedUser) authentication.getPrincipal();
    }
}
