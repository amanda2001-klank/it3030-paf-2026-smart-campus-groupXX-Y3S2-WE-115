package com.smartcampus.audit.controller;

import com.smartcampus.audit.dto.AdminAuditLogResponse;
import com.smartcampus.audit.service.AdminAuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditLogController {

    private final AdminAuditLogService adminAuditLogService;

    public AdminAuditLogController(AdminAuditLogService adminAuditLogService) {
        this.adminAuditLogService = adminAuditLogService;
    }

    @GetMapping
    public ResponseEntity<List<AdminAuditLogResponse>> getLogs(
            @RequestParam(value = "actorUserId", required = false) String actorUserId,
            @RequestParam(value = "action", required = false) String action,
            @RequestParam(value = "entityType", required = false) String entityType,
            @RequestParam(value = "limit", defaultValue = "50") int limit) {
        return ResponseEntity.ok(adminAuditLogService.getLogs(actorUserId, action, entityType, limit));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Long>> getSummary() {
        return ResponseEntity.ok(adminAuditLogService.getSummary());
    }
}
