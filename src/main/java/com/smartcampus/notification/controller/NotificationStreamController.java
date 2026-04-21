package com.smartcampus.notification.controller;

import com.smartcampus.notification.service.NotificationStreamService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/notifications")
public class NotificationStreamController {

    private final NotificationStreamService notificationStreamService;

    public NotificationStreamController(NotificationStreamService notificationStreamService) {
        this.notificationStreamService = notificationStreamService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> stream(@RequestParam("token") String token) {
        return ResponseEntity.ok(notificationStreamService.connect(token));
    }
}
