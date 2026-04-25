package com.smartcampus.ticketing.controller;

import com.smartcampus.auth.security.AuthenticatedUser;
import com.smartcampus.ticketing.dto.CommentRequest;
import com.smartcampus.ticketing.dto.IncidentRequest;
import com.smartcampus.ticketing.dto.IncidentResponse;
import com.smartcampus.ticketing.service.IncidentService;
import com.smartcampus.ticketing.service.IncidentMediaStorageService;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/ticketing/incidents")
public class IncidentController {

    private final IncidentService incidentService;
    private final IncidentMediaStorageService incidentMediaStorageService;

    public IncidentController(IncidentService incidentService, IncidentMediaStorageService incidentMediaStorageService) {
        this.incidentService = incidentService;
        this.incidentMediaStorageService = incidentMediaStorageService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<IncidentResponse> createIncident(
            @Valid @ModelAttribute IncidentRequest request,
            @RequestParam(value = "files", required = false) List<MultipartFile> files,
            Authentication authentication) {
        AuthenticatedUser actor = currentUser(authentication);
        IncidentResponse created = incidentService.createIncident(request, actor.getUserId(), actor.getUserName(), files);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/media/**")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> previewMedia(jakarta.servlet.http.HttpServletRequest request) {
        String pathStr = request.getRequestURI().split("/media/")[1];
        Resource resource = incidentMediaStorageService.loadMediaAsResource(pathStr);
        
        String contentType;
        try {
            contentType = java.nio.file.Files.probeContentType(java.nio.file.Paths.get(pathStr));
        } catch (java.io.IOException e) {
            contentType = MediaType.IMAGE_JPEG_VALUE;
        }
        
        if (contentType == null) {
            contentType = MediaType.IMAGE_JPEG_VALUE;
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .body(resource);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER', 'TECHNICIAN')")
    public ResponseEntity<List<IncidentResponse>> getAllIncidents() {
        return ResponseEntity.ok(incidentService.getAllIncidents());
    }

    @GetMapping("/my-reported")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<IncidentResponse>> getMyReportedIncidents(Authentication authentication) {
        AuthenticatedUser actor = currentUser(authentication);
        return ResponseEntity.ok(incidentService.getIncidentsByReporter(actor.getUserId()));
    }

    @GetMapping("/my-assigned")
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIAN')")
    public ResponseEntity<List<IncidentResponse>> getMyAssignedIncidents(Authentication authentication) {
        AuthenticatedUser actor = currentUser(authentication);
        return ResponseEntity.ok(incidentService.getIncidentsByTechnician(actor.getUserId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<IncidentResponse> getIncidentById(@PathVariable String id) {
        return ResponseEntity.ok(incidentService.getIncidentById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<IncidentResponse> updateIncident(
            @PathVariable String id,
            @Valid @RequestBody IncidentRequest request,
            Authentication authentication) {
        AuthenticatedUser actor = currentUser(authentication);
        IncidentResponse existing = incidentService.getIncidentById(id);
        
        // Admins and Technicians can always update.
        // Reporters can only update if it's still OPEN and they are the owner.
        boolean isStaff = "ADMIN".equalsIgnoreCase(actor.getRole()) || "TECHNICIAN".equalsIgnoreCase(actor.getRole());
        if (!isStaff) {
            if (!existing.getReportedById().equals(actor.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (!"OPEN".equalsIgnoreCase(existing.getStatus().name())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
            }
        }

        return ResponseEntity.ok(incidentService.updateIncident(id, request, actor.getUserId(), actor.getUserName()));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<IncidentResponse> addComment(
            @PathVariable String id,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication) {
        AuthenticatedUser actor = currentUser(authentication);
        // In a real app, you'd check roles for isStaff
        boolean isStaff = "ADMIN".equalsIgnoreCase(actor.getRole()) || "TECHNICIAN".equalsIgnoreCase(actor.getRole());
        return ResponseEntity.ok(incidentService.addComment(id, request, actor.getUserId(), actor.getUserName(), isStaff));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteIncident(@PathVariable String id, Authentication authentication) {
        AuthenticatedUser actor = currentUser(authentication);
        IncidentResponse existing = incidentService.getIncidentById(id);

        boolean isAdmin = "ADMIN".equalsIgnoreCase(actor.getRole());
        if (!isAdmin) {
            if (!existing.getReportedById().equals(actor.getUserId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            if (!"OPEN".equalsIgnoreCase(existing.getStatus().name())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            }
        }

        incidentService.deleteIncident(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/technicians")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<com.smartcampus.auth.dto.AdminUserResponse>> getTechnicians() {
        return ResponseEntity.ok(incidentService.getTechnicians());
    }

    private AuthenticatedUser currentUser(Authentication authentication) {
        return (AuthenticatedUser) authentication.getPrincipal();
    }
}
