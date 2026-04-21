package com.smartcampus.notification.repository;

import com.smartcampus.notification.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends MongoRepository<Notification, String> {

    Page<Notification> findByRecipientUserIdOrderByCreatedAtDesc(String recipientUserId, Pageable pageable);

    Page<Notification> findByRecipientUserIdAndIsReadFalseOrderByCreatedAtDesc(String recipientUserId, Pageable pageable);

    long countByRecipientUserIdAndIsReadFalse(String recipientUserId);

    Optional<Notification> findByIdAndRecipientUserId(String id, String recipientUserId);

    List<Notification> findByRecipientUserIdAndIsReadFalse(String recipientUserId);
}
