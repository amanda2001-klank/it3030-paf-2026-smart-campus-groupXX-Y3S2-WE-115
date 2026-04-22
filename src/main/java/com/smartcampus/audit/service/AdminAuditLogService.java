package com.smartcampus.audit.service;

import com.smartcampus.audit.dto.AdminAuditLogResponse;
import com.smartcampus.audit.model.AdminAuditLog;
import com.smartcampus.audit.repository.AdminAuditLogRepository;
import com.smartcampus.auth.security.AuthenticatedUser;
import com.smartcampus.booking.exception.BadRequestException;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class AdminAuditLogService {

    private static final int MIN_LIMIT = 1;
    private static final int MAX_LIMIT = 200;

    private final AdminAuditLogRepository adminAuditLogRepository;
    private final MongoTemplate mongoTemplate;

    public AdminAuditLogService(AdminAuditLogRepository adminAuditLogRepository, MongoTemplate mongoTemplate) {
        this.adminAuditLogRepository = adminAuditLogRepository;
        this.mongoTemplate = mongoTemplate;
    }

    public void logAction(AuthenticatedUser actor,
                          String action,
                          String entityType,
                          String entityId,
                          String details) {
        if (actor == null) {
            return;
        }

        AdminAuditLog log = new AdminAuditLog();
        log.setActorUserId(actor.getUserId());
        log.setActorName(actor.getUserName() == null || actor.getUserName().isBlank() ? "Unknown Admin" : actor.getUserName());
        log.setActorRole(actor.getRole());
        log.setAction(normalize(action));
        log.setEntityType(normalize(entityType));
        log.setEntityId(entityId);
        log.setDetails(details);

        adminAuditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AdminAuditLogResponse> getLogs(String actorUserId, String action, String entityType, int limit) {
        Query query = new Query();
        List<Criteria> criteria = new ArrayList<>();

        if (actorUserId != null && !actorUserId.isBlank()) {
            criteria.add(Criteria.where("actorUserId").is(actorUserId.trim()));
        }

        if (action != null && !action.isBlank()) {
            criteria.add(Criteria.where("action").is(action.trim().toUpperCase()));
        }

        if (entityType != null && !entityType.isBlank()) {
            criteria.add(Criteria.where("entityType").is(entityType.trim().toUpperCase()));
        }

        if (!criteria.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteria.toArray(new Criteria[0])));
        }

        query.with(Sort.by(Sort.Direction.DESC, "createdAt"));
        query.limit(normalizeLimit(limit));

        return mongoTemplate.find(query, AdminAuditLog.class)
                .stream()
                .map(AdminAuditLogResponse::fromModel)
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getSummary() {
        LocalDateTime dayAgo = LocalDateTime.now().minusHours(24);
        return Map.of(
                "total", adminAuditLogRepository.count(),
                "last24Hours", adminAuditLogRepository.countByCreatedAtAfter(dayAgo)
        );
    }

    private int normalizeLimit(int limit) {
        if (limit < MIN_LIMIT || limit > MAX_LIMIT) {
            throw new BadRequestException("limit must be between " + MIN_LIMIT + " and " + MAX_LIMIT);
        }
        return limit;
    }

    private String normalize(String value) {
        return value == null ? "UNKNOWN" : value.trim().toUpperCase();
    }
}
