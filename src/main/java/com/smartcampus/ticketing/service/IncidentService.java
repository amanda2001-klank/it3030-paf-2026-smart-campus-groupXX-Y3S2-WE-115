package com.smartcampus.ticketing.service;

import com.smartcampus.ticketing.dto.IncidentRequest;
import com.smartcampus.ticketing.dto.IncidentResponse;
import com.smartcampus.ticketing.dto.CommentRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface IncidentService {
    IncidentResponse createIncident(IncidentRequest request, String reporterId, String reporterName, List<MultipartFile> files);
    List<IncidentResponse> getAllIncidents();
    List<IncidentResponse> getIncidentsByTechnician(String technicianId);
    List<IncidentResponse> getIncidentsByReporter(String reporterId);
    IncidentResponse getIncidentById(String id);
    IncidentResponse updateIncident(String id, IncidentRequest request, String actorId, String actorName);
    IncidentResponse addComment(String id, CommentRequest request, String actorId, String actorName, boolean isStaff);
    void deleteIncident(String id);
}
