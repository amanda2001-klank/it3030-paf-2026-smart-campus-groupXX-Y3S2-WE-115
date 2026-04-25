package com.smartcampus.booking.service;

<<<<<<< HEAD
=======
import com.smartcampus.auth.model.AppUser;
import com.smartcampus.auth.repository.AppUserRepository;
import com.smartcampus.booking.dto.AssetUsageAnalyticsResponse;
import com.smartcampus.booking.dto.AssetUsageMetricResponse;
>>>>>>> main
import com.smartcampus.booking.dto.BookingRequest;
import com.smartcampus.booking.dto.BookingResponse;
import com.smartcampus.booking.exception.BadRequestException;
import com.smartcampus.booking.exception.ConflictException;
import com.smartcampus.booking.exception.ResourceNotFoundException;
import com.smartcampus.booking.exception.UnauthorizedException;
import com.smartcampus.booking.model.Booking;
import com.smartcampus.booking.model.BookingStatus;
import com.smartcampus.booking.repository.BookingRepository;
import com.smartcampus.catalog.model.Asset;
import com.smartcampus.catalog.repository.AssetRepository;
import com.smartcampus.catalog.util.IdValidationUtils;
import com.smartcampus.notification.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final AssetRepository assetRepository;
    private final NotificationService notificationService;

    public BookingService(
            BookingRepository bookingRepository,
            AssetRepository assetRepository,
            NotificationService notificationService
    ) {
        this.bookingRepository = bookingRepository;
        this.assetRepository = assetRepository;
        this.notificationService = notificationService;
    }

    /**
     * Create a new booking
     * Checks for conflicts with existing APPROVED bookings
     * 
     * @param bookingRequest the booking request DTO
     * @param userId the ID of the user requesting the booking
     * @param userName the name of the user requesting the booking
     * @return BookingResponse with PENDING status
     * @throws ConflictException if resource is already booked for the requested time
     */
    public BookingResponse createBooking(BookingRequest bookingRequest, String userId, String userName) {
        String validatedResourceId = IdValidationUtils.requireValidObjectId(
                bookingRequest.getResourceId(),
                "Resource ID"
        );
        Asset asset = assetRepository.findById(validatedResourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + validatedResourceId));

        // Check for conflicts with existing APPROVED bookings
        List<Booking> conflicts = bookingRepository.findConflicts(
                validatedResourceId,
                bookingRequest.getStartTime(),
                bookingRequest.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            throw new ConflictException("Resource is already booked for the requested time period. " +
                    "Please choose a different time slot.");
        }

        // Create new booking
        Booking booking = new Booking();
        booking.setResourceId(validatedResourceId);
        booking.setResourceName(asset.getAssetName());
        booking.setRequestedById(userId);
        booking.setRequestedByName(userName);
        booking.setStartTime(bookingRequest.getStartTime());
        booking.setEndTime(bookingRequest.getEndTime());
        booking.setPurpose(bookingRequest.getPurpose());
        booking.setExpectedAttendees(bookingRequest.getExpectedAttendees());
        booking.setStatus(BookingStatus.PENDING);

        Booking savedBooking = bookingRepository.save(booking);
        notificationService.notifyAdminsNewBooking(savedBooking);
        return BookingResponse.fromBooking(savedBooking);
    }

    /**
     * Approve a pending booking
     * 
     * @param id the booking ID
     * @return BookingResponse with APPROVED status
     * @throws ResourceNotFoundException if booking not found
     * @throws IllegalStateException if booking is not in PENDING status
     */
    public BookingResponse approveBooking(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be approved. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.APPROVED);
        Booking updatedBooking = bookingRepository.save(booking);
        notificationService.notifyUserBookingApproved(updatedBooking);
        return BookingResponse.fromBooking(updatedBooking);
    }

    /**
     * Reject a pending booking
     * 
     * @param id the booking ID
     * @param reason the rejection reason
     * @return BookingResponse with REJECTED status
     * @throws ResourceNotFoundException if booking not found
     */
    public BookingResponse rejectBooking(String id, String reason) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be rejected. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        Booking updatedBooking = bookingRepository.save(booking);
        notificationService.notifyUserBookingRejected(updatedBooking);
        return BookingResponse.fromBooking(updatedBooking);
    }

    /**
     * Cancel an approved booking
     * Only the user who requested the booking can cancel it
     * 
     * @param id the booking ID
     * @param requestingUserId the ID of the user attempting to cancel
     * @return BookingResponse with CANCELLED status
     * @throws ResourceNotFoundException if booking not found
     * @throws UnauthorizedException if user is not the owner of the booking
     * @throws IllegalStateException if booking is not APPROVED
     */
    public BookingResponse cancelBooking(String id, String requestingUserId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));

        // Check if the requesting user is the owner of the booking
        if (!booking.getRequestedById().equals(requestingUserId)) {
            throw new UnauthorizedException("You can only cancel your own bookings");
        }

        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED bookings can be cancelled. Current status: " + booking.getStatus());
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking updatedBooking = bookingRepository.save(booking);
        notificationService.notifyAdminsBookingCancelled(updatedBooking);
        return BookingResponse.fromBooking(updatedBooking);
    }

    /**
     * Get all bookings for a specific user
     * 
     * @param userId the ID of the user
     * @return List of BookingResponse objects
     */
    public List<BookingResponse> getMyBookings(String userId) {
        return bookingRepository.findByRequestedById(userId)
                .stream()
                .map(BookingResponse::fromBooking)
                .collect(Collectors.toList());
    }

    /**
     * Get all bookings, optionally filtered by status
     * 
     * @param status the booking status filter (optional)
     * @return List of BookingResponse objects
     */
    public List<BookingResponse> getAllBookings(BookingStatus status) {
        List<Booking> bookings;
        if (status != null) {
            bookings = bookingRepository.findByStatus(status);
        } else {
            bookings = bookingRepository.findAll();
        }
        return bookings.stream()
                .map(BookingResponse::fromBooking)
                .collect(Collectors.toList());
    }

    /**
     * Get a booking by ID
     * 
     * @param id the booking ID
     * @return BookingResponse
     * @throws ResourceNotFoundException if booking not found
     */
    public BookingResponse getBookingById(String id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        return BookingResponse.fromBooking(booking);
    }
<<<<<<< HEAD
=======

    /**
     * Get a booking entity by ID (internal use for PDF generation)
     * 
     * @param id the booking ID
     * @return Booking entity
     * @throws ResourceNotFoundException if booking not found
     */
    public Booking getBookingEntity(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    /**
     * Get asset usage analytics for the selected period.
     * Supported periods: WEEKLY, MONTHLY.
     *
     * @param period analytics period
     * @return analytics summary grouped by resource
     */
    public AssetUsageAnalyticsResponse getAssetUsageAnalytics(String period) {
        String normalizedPeriod = normalizePeriod(period);

        LocalDateTime rangeEnd = LocalDateTime.now();
        LocalDateTime rangeStart;
        if ("MONTHLY".equals(normalizedPeriod)) {
            rangeStart = LocalDate.now().minusDays(29).atStartOfDay();
        } else {
            rangeStart = LocalDate.now().minusDays(6).atStartOfDay();
        }

        List<Booking> bookings = bookingRepository.findByStartTimeBetween(rangeStart, rangeEnd);
        Map<String, UsageAggregate> groupedUsage = new HashMap<>();

        for (Booking booking : bookings) {
            String resourceId = booking.getResourceId() == null || booking.getResourceId().isBlank()
                    ? "UNKNOWN"
                    : booking.getResourceId();
            UsageAggregate aggregate = groupedUsage.computeIfAbsent(
                    resourceId,
                    key -> new UsageAggregate(resourceId, booking.getResourceName())
            );
            aggregate.resourceName = booking.getResourceName();
            aggregate.totalBookings++;
            aggregate.bookedHours += bookingDurationHours(booking);

            if (booking.getStatus() == BookingStatus.APPROVED) {
                aggregate.approvedBookings++;
            } else if (booking.getStatus() == BookingStatus.PENDING) {
                aggregate.pendingBookings++;
            } else if (booking.getStatus() == BookingStatus.REJECTED) {
                aggregate.rejectedBookings++;
            } else if (booking.getStatus() == BookingStatus.CANCELLED) {
                aggregate.cancelledBookings++;
            }
        }

        long totalBookings = bookings.size();
        double totalBookedHours = roundToTwoDecimal(
                groupedUsage.values().stream().mapToDouble(usage -> usage.bookedHours).sum()
        );

        List<AssetUsageMetricResponse> metrics = new ArrayList<>();
        for (UsageAggregate usage : groupedUsage.values()) {
            double sharePercent = totalBookings == 0
                    ? 0.0
                    : (usage.totalBookings * 100.0) / totalBookings;

            metrics.add(new AssetUsageMetricResponse(
                    usage.resourceId,
                    usage.resourceName == null || usage.resourceName.isBlank() ? "Unknown Asset" : usage.resourceName,
                    usage.totalBookings,
                    usage.approvedBookings,
                    usage.pendingBookings,
                    usage.rejectedBookings,
                    usage.cancelledBookings,
                    roundToTwoDecimal(usage.bookedHours),
                    roundToTwoDecimal(sharePercent)
            ));
        }

        metrics.sort(
                Comparator.comparingLong(AssetUsageMetricResponse::getTotalBookings)
                        .thenComparingDouble(AssetUsageMetricResponse::getBookedHours)
                        .reversed()
        );

        return new AssetUsageAnalyticsResponse(
                normalizedPeriod,
                rangeStart,
                rangeEnd,
                LocalDateTime.now(),
                totalBookings,
                totalBookedHours,
                metrics
        );
    }

    private String normalizePeriod(String period) {
        if (period == null || period.isBlank()) {
            return "WEEKLY";
        }

        String normalized = period.trim().toUpperCase();
        if (!"WEEKLY".equals(normalized) && !"MONTHLY".equals(normalized)) {
            throw new BadRequestException("Invalid period. Use WEEKLY or MONTHLY.");
        }
        return normalized;
    }

    private double bookingDurationHours(Booking booking) {
        if (booking.getStartTime() == null || booking.getEndTime() == null) {
            return 0.0;
        }

        Duration duration = Duration.between(booking.getStartTime(), booking.getEndTime());
        if (duration.isNegative() || duration.isZero()) {
            return 0.0;
        }

        return duration.toMinutes() / 60.0;
    }

    private double roundToTwoDecimal(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private static class UsageAggregate {
        private final String resourceId;
        private String resourceName;
        private long totalBookings;
        private long approvedBookings;
        private long pendingBookings;
        private long rejectedBookings;
        private long cancelledBookings;
        private double bookedHours;

        private UsageAggregate(String resourceId, String resourceName) {
            this.resourceId = resourceId;
            this.resourceName = resourceName;
        }
    }
>>>>>>> main
}
