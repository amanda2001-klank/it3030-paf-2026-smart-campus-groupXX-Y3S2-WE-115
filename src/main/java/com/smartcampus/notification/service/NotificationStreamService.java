package com.smartcampus.notification.service;

import com.smartcampus.auth.model.AppUser;
import com.smartcampus.auth.repository.AppUserRepository;
import com.smartcampus.auth.service.JwtService;
import com.smartcampus.notification.dto.NotificationResponse;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

import static org.springframework.http.HttpStatus.UNAUTHORIZED;

@Service
public class NotificationStreamService {

    private static final long EMITTER_TIMEOUT_MILLIS = Duration.ofHours(12).toMillis();

    private final JwtService jwtService;
    private final AppUserRepository appUserRepository;
    private final Map<String, Set<SseEmitter>> emittersByUserId = new ConcurrentHashMap<>();

    public NotificationStreamService(JwtService jwtService, AppUserRepository appUserRepository) {
        this.jwtService = jwtService;
        this.appUserRepository = appUserRepository;
    }

    public SseEmitter connect(String token) {
        String userId = resolveUserId(token);
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MILLIS);
        emittersByUserId.computeIfAbsent(user.getId(), key -> new CopyOnWriteArraySet<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(user.getId(), emitter));
        emitter.onTimeout(() -> removeEmitter(user.getId(), emitter));
        emitter.onError(error -> removeEmitter(user.getId(), emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data(Map.of(
                            "message", "connected",
                            "userId", user.getId()
                    ), MediaType.APPLICATION_JSON));
        } catch (IOException ex) {
            removeEmitter(user.getId(), emitter);
            throw new IllegalStateException("Unable to initialize notification stream.", ex);
        }

        return emitter;
    }

    public void emitNotification(String userId, NotificationResponse notification) {
        emitToUser(userId, "notification", notification);
    }

    public void emitUnreadCount(String userId, long unreadCount) {
        emitToUser(userId, "unread-count", Map.of(
                "unreadCount", unreadCount
        ));
    }

    public void emitBulkNotifications(List<String> userIds, NotificationResponse notification) {
        if (userIds == null || userIds.isEmpty()) {
            return;
        }

        userIds.forEach(userId -> emitNotification(userId, notification));
    }

    public void emitUserRefresh(String userId, long unreadCount) {
        emitToUser(userId, "refresh", Map.of(
                "unreadCount", unreadCount
        ));
    }

    private void emitToUser(String userId, String eventName, Object payload) {
        Set<SseEmitter> emitters = emittersByUserId.get(userId);
        if (emitters == null || emitters.isEmpty()) {
            return;
        }

        for (SseEmitter emitter : emitters.toArray(new SseEmitter[0])) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(payload, MediaType.APPLICATION_JSON));
            } catch (IOException | IllegalStateException ex) {
                removeEmitter(userId, emitter);
            }
        }
    }

    private void removeEmitter(String userId, SseEmitter emitter) {
        Set<SseEmitter> emitters = emittersByUserId.get(userId);
        if (emitters == null) {
            return;
        }

        emitters.remove(emitter);
        if (emitters.isEmpty()) {
            emittersByUserId.remove(userId);
        }
    }

    private String resolveUserId(String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Missing notification token.");
        }

        Claims claims;
        try {
            claims = jwtService.parseClaims(token);
        } catch (JwtException | IllegalArgumentException ex) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid notification token.");
        }

        String userId = claims.getSubject();
        if (userId == null || userId.isBlank()) {
            throw new ResponseStatusException(UNAUTHORIZED, "Invalid notification token.");
        }

        return userId;
    }
}
