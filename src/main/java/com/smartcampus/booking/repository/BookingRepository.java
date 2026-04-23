package com.smartcampus.booking.repository;

import com.smartcampus.booking.model.Booking;
import com.smartcampus.booking.model.BookingStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    /**
     * Find all bookings requested by a specific user
     * @param userId the ID of the user who requested the booking
     * @return List of bookings for the specified user
     */
    List<Booking> findByRequestedById(String userId);

    boolean existsByRequestedByIdAndResourceIdAndStatus(String userId, String resourceId, BookingStatus status);

    /**
     * Find all bookings with a specific status
     * @param status the booking status to filter by
     * @return List of bookings with the specified status
     */
    List<Booking> findByStatus(BookingStatus status);

    /**
     * Find conflicting bookings for a resource
     * Detects APPROVED bookings for the same resourceId where
     * the booking time overlaps with the specified time window
     * @param resourceId the ID of the resource
     * @param startTime the requested start time
     * @param endTime the requested end time
     * @return List of conflicting APPROVED bookings
     */
    @Query("{ 'resourceId': ?0, 'status': 'APPROVED', 'startTime': { $lt: ?2 }, 'endTime': { $gt: ?1 } }")
    List<Booking> findConflicts(String resourceId, LocalDateTime startTime, LocalDateTime endTime);

}
