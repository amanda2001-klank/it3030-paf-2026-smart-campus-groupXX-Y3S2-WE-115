package com.smartcampus.booking.controller;

import com.smartcampus.auth.security.AuthenticatedUser;
import com.smartcampus.audit.service.AdminAuditLogService;
import com.smartcampus.booking.dto.AssetUsageAnalyticsResponse;
import com.smartcampus.booking.dto.BookingRequest;
import com.smartcampus.booking.dto.BookingResponse;
import com.smartcampus.booking.model.BookingStatus;
import com.smartcampus.booking.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final AdminAuditLogService adminAuditLogService;

    public BookingController(BookingService bookingService, AdminAuditLogService adminAuditLogService) {
        this.bookingService = bookingService;
        this.adminAuditLogService = adminAuditLogService;
    }

    /**
     * Create a new booking for the current authenticated user.
     * Admins cannot create bookings.
     */
    @PostMapping
    @PreAuthorize("isAuthenticated() and !hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest bookingRequest,
            Authentication authentication) {

        AuthenticatedUser currentUser = currentUser(authentication);
        String requestedByName = currentUser.getUserName() == null || currentUser.getUserName().isBlank()
                ? "Unknown User"
                : currentUser.getUserName();

        BookingResponse response = bookingService.createBooking(
                bookingRequest,
                currentUser.getUserId(),
                requestedByName
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Get all bookings (admin and asset manager)
     * Can filter by status using ?status=PENDING|APPROVED|REJECTED|CANCELLED
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<List<BookingResponse>> getAllBookings(
            @RequestParam(value = "status", required = false) BookingStatus status) {

        List<BookingResponse> bookings = bookingService.getAllBookings(status);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get current user's bookings.
     * Admins cannot view their own bookings.
     */
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated() and !hasRole('ADMIN')")
    public ResponseEntity<List<BookingResponse>> getMyBookings(
            Authentication authentication) {

        AuthenticatedUser currentUser = currentUser(authentication);
        List<BookingResponse> bookings = bookingService.getMyBookings(currentUser.getUserId());
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get booking by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable String id) {
        BookingResponse booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(booking);
    }

    /**
     * Get booking usage analytics grouped by asset.
     * Supports period=WEEKLY|MONTHLY.
     */
    @GetMapping("/analytics/asset-usage")
    @PreAuthorize("hasAnyRole('ADMIN', 'ASSET_MANAGER')")
    public ResponseEntity<AssetUsageAnalyticsResponse> getAssetUsageAnalytics(
            @RequestParam(value = "period", defaultValue = "WEEKLY") String period) {

        AssetUsageAnalyticsResponse response = bookingService.getAssetUsageAnalytics(period);
        return ResponseEntity.ok(response);
    }

    /**
     * Approve a pending booking (asset manager only).
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('ASSET_MANAGER')")
    public ResponseEntity<BookingResponse> approveBooking(@PathVariable String id, Authentication authentication) {
        BookingResponse response = bookingService.approveBooking(id);
        adminAuditLogService.logAction(
                currentUser(authentication),
                "BOOKING_APPROVED",
                "BOOKING",
                response.getId(),
                "Approved booking for " + response.getResourceName()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Reject a pending booking (asset manager only).
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('ASSET_MANAGER')")
    public ResponseEntity<BookingResponse> rejectBooking(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {

        String reason = payload.getOrDefault("reason", "No reason provided");
        BookingResponse response = bookingService.rejectBooking(id, reason);
        adminAuditLogService.logAction(
                currentUser(authentication),
                "BOOKING_REJECTED",
                "BOOKING",
                response.getId(),
                "Rejected booking for " + response.getResourceName() + ". Reason: " + reason
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Cancel a booking (user can cancel their own APPROVED bookings).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable String id,
            Authentication authentication) {

        AuthenticatedUser currentUser = currentUser(authentication);
        BookingResponse response = bookingService.cancelBooking(id, currentUser.getUserId());
        return ResponseEntity.ok(response);
    }

    /**
     * Health check endpoint
     * 
     * @return success response
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Booking Management Service");
        return ResponseEntity.ok(response);
    }

    private AuthenticatedUser currentUser(Authentication authentication) {
        return (AuthenticatedUser) authentication.getPrincipal();
    }
}
