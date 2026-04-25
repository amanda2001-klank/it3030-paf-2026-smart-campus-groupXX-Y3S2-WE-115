package com.smartcampus.ticketing.service;

import com.smartcampus.booking.exception.ResourceNotFoundException;
import com.smartcampus.ticketing.dto.CommentRequest;
import com.smartcampus.ticketing.dto.IncidentRequest;
import com.smartcampus.ticketing.dto.IncidentResponse;
import com.smartcampus.ticketing.model.DiscussionEntry;
import com.smartcampus.ticketing.model.Incident;
import com.smartcampus.ticketing.model.IncidentStatus;
import com.smartcampus.ticketing.repository.IncidentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class IncidentServiceImpl implements IncidentService {

    private final IncidentRepository incidentRepository;
    private final com.smartcampus.auth.service.AdminUserService adminUserService;

    public IncidentServiceImpl(IncidentRepository incidentRepository, com.smartcampus.auth.service.AdminUserService adminUserService) {
        this.incidentRepository = incidentRepository;
        this.adminUserService = adminUserService;
    }

    @Override
    public IncidentResponse createIncident(IncidentRequest request, String reporterId, String reporterName) {
        Incident incident = new Incident();
        incident.setTicketNumber("INC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        incident.setTitle(request.getTitle());
        incident.setDescription(request.getDescription());
        incident.setPriority(request.getPriority());
        incident.setStatus(request.getStatus() != null ? request.getStatus() : IncidentStatus.OPEN);
        incident.setReportedById(reporterId);
        incident.setReportedByName(reporterName);
        
        Incident saved = incidentRepository.save(incident);
        return IncidentResponse.fromIncident(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentResponse> getAllIncidents() {
        return incidentRepository.findAll().stream()
                .map(IncidentResponse::fromIncident)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentResponse> getIncidentsByTechnician(String technicianId) {
        return incidentRepository.findByAssignedTechnicianId(technicianId).stream()
                .map(IncidentResponse::fromIncident)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<IncidentResponse> getIncidentsByReporter(String reporterId) {
        return incidentRepository.findByReportedById(reporterId).stream()
                .map(IncidentResponse::fromIncident)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public IncidentResponse getIncidentById(String id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + id));
        return IncidentResponse.fromIncident(incident);
    }

    @Override
    public IncidentResponse updateIncident(String id, IncidentRequest request, String actorId, String actorName) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + id));
        
        if (request.getTitle() != null) incident.setTitle(request.getTitle());
        if (request.getDescription() != null) incident.setDescription(request.getDescription());
        if (request.getPriority() != null) incident.setPriority(request.getPriority());
        if (request.getStatus() != null) incident.setStatus(request.getStatus());
        if (request.getAssignedTechnicianId() != null) {
            String techId = request.getAssignedTechnicianId();
            if ("UNASSIGNED".equalsIgnoreCase(techId) || techId.isBlank()) {
                incident.setAssignedTechnicianId(null);
                incident.setAssignedTechnicianName(null);
            } else {
                com.smartcampus.auth.dto.AdminUserResponse technician = adminUserService.getUserById(techId);
                incident.setAssignedTechnicianId(technician.getUserId());
                incident.setAssignedTechnicianName(technician.getUserName());
            }
        }

        Incident saved = incidentRepository.save(incident);
        return IncidentResponse.fromIncident(saved);
    }

    @Override
    public IncidentResponse addComment(String id, CommentRequest request, String actorId, String actorName, boolean isStaff) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with id: " + id));
        
        DiscussionEntry entry = new DiscussionEntry(actorId, actorName, request.getMessage(), isStaff);
        incident.getDiscussion().add(entry);
        
        Incident saved = incidentRepository.save(incident);
        return IncidentResponse.fromIncident(saved);
    }

    @Override
    public void deleteIncident(String id) {
        if (!incidentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Incident not found with id: " + id);
        }
        incidentRepository.deleteById(id);
    }
}
