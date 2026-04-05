package com.smartcampus.booking.service;

import com.smartcampus.booking.dto.BookingRequest;
import com.smartcampus.booking.dto.BookingResponse;
import com.smartcampus.booking.exception.ConflictException;
import com.smartcampus.booking.exception.ResourceNotFoundException;
import com.smartcampus.booking.exception.UnauthorizedException;
import com.smartcampus.booking.model.Booking;
import com.smartcampus.booking.model.BookingStatus;
import com.smartcampus.booking.repository.BookingRepository;
import com.smartcampus.catalog.model.Asset;
import com.smartcampus.catalog.repository.AssetRepository;
import com.smartcampus.catalog.util.IdValidationUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final AssetRepository assetRepository;

    public BookingService(BookingRepository bookingRepository, AssetRepository assetRepository) {
        this.bookingRepository = bookingRepository;
        this.assetRepository = assetRepository;
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
}
