package com.resolvenow.complaint.service;

import com.resolvenow.complaint.Complaint;
import com.resolvenow.complaint.ComplaintDepartment;
import com.resolvenow.complaint.ComplaintPriority;
import com.resolvenow.complaint.ComplaintStatus;
import com.resolvenow.complaint.ComplaintHistory;
import com.resolvenow.complaint.dto.ComplaintHistoryResponse;
import com.resolvenow.complaint.dto.ComplaintResponse;
import com.resolvenow.complaint.dto.ComplaintStatsResponse;
import com.resolvenow.complaint.dto.CreateComplaintRequest;
import com.resolvenow.complaint.dto.EscalateComplaintRequest;
import com.resolvenow.complaint.dto.UpdateComplaintStatusRequest;
import com.resolvenow.complaint.exception.AccessDeniedException;
import com.resolvenow.complaint.exception.AssignmentServiceException;
import com.resolvenow.complaint.exception.ResourceNotFoundException;
import com.resolvenow.complaint.outbox.ComplaintNotificationDispatcher;
import com.resolvenow.complaint.repository.ComplaintHistoryRepository;
import com.resolvenow.complaint.repository.ComplaintRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ComplaintService {

    private static final Logger logger = LoggerFactory.getLogger(ComplaintService.class);

    private final ComplaintRepository complaintRepository;
    private final ComplaintHistoryRepository complaintHistoryRepository;
    private final RestTemplate restTemplate;
    private final ComplaintNotificationDispatcher notificationDispatcher;

    @Value("${internal.service-token:}")
    private String internalServiceToken;

    @Value("${sla.threshold.hours.low:72}")
    private long slaHoursLow;

    @Value("${sla.threshold.hours.medium:48}")
    private long slaHoursMedium;

    @Value("${sla.threshold.hours.high:24}")
    private long slaHoursHigh;

    @Value("${sla.threshold.hours.critical:4}")
    private long slaHoursCritical;

    @Autowired
    public ComplaintService(
            ComplaintRepository complaintRepository,
            ComplaintHistoryRepository complaintHistoryRepository,
            RestTemplate restTemplate,
            ComplaintNotificationDispatcher notificationDispatcher) {
        this.complaintRepository = complaintRepository;
        this.complaintHistoryRepository = complaintHistoryRepository;
        this.restTemplate = restTemplate;
        this.notificationDispatcher = notificationDispatcher;
    }

    public ComplaintService(
            ComplaintRepository complaintRepository,
            ComplaintHistoryRepository complaintHistoryRepository,
            RestTemplate restTemplate) {
        this(complaintRepository, complaintHistoryRepository, restTemplate, null);
    }

    public ComplaintResponse createComplaint(CreateComplaintRequest request, Long currentUserId, String currentUsername) {
        ComplaintDepartment department = ComplaintDepartment.fromValue(request.department());
        if (department == null) {
            throw new IllegalArgumentException("Department is invalid");
        }

        ComplaintPriority priority = ComplaintPriority.fromValue(request.priority());

        Complaint complaint = new Complaint();
        complaint.setTitle(request.title().trim());
        complaint.setDescription(request.description().trim());
        complaint.setDepartment(department);
        complaint.setStatus(ComplaintStatus.OPEN);
        complaint.setPriority(priority);
        complaint.setUserId(currentUserId);
        complaint.setUsername(currentUsername);

        Instant now = Instant.now();
        complaint.setSlaDeadline(calculateSlaDeadline(priority, now));

        Complaint saved = complaintRepository.save(complaint);
        complaintHistoryRepository.save(savedHistory(saved, null, ComplaintStatus.OPEN, currentUserId, currentUsername, "Complaint submitted"));

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Service-Token", internalServiceToken);
            HttpEntity<Map<String, Object>> assignmentRequest = new HttpEntity<>(
                    Map.of(
                            "complaintId", saved.getId(),
                            "department", saved.getDepartment().name(),
                            "assignedTo", currentUsername,
                            "complaintOwnerUserId", currentUserId,
                            "complaintOwnerUsername", currentUsername,
                            "status", "ASSIGNED"
                    ), headers);
            restTemplate.postForEntity(
                    "http://ASSIGNMENT-SERVICE/api/assignments",
                    assignmentRequest,
                    Void.class
            );
        } catch (Exception exception) {
            logger.warn("Assignment service downstream failure for complaint {}: {}", saved.getId(), exception.getMessage());
            throw new AssignmentServiceException("Complaint was created but assignment creation failed. Please retry assignment later.");
        }

        return ComplaintResponse.fromEntity(saved);
    }

    public List<ComplaintResponse> getAllComplaints(Long currentUserId, String currentRole) {
        if (isUserRole(currentRole)) {
            return complaintRepository.findByUserIdOrderByUpdatedAtDesc(currentUserId)
                    .stream()
                    .map(ComplaintResponse::fromEntity)
                    .toList();
        }

        return complaintRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(ComplaintResponse::fromEntity)
                .toList();
    }

    public ComplaintResponse getComplaintById(Long complaintId, Long currentUserId, String currentRole) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (isUserRole(currentRole) && !Objects.equals(complaint.getUserId(), currentUserId)) {
            throw new AccessDeniedException("You are not allowed to view this complaint");
        }

        return ComplaintResponse.fromEntity(complaint);
    }

    @Transactional
    public ComplaintResponse updateComplaintStatus(Long id, UpdateComplaintStatusRequest request, Long currentUserId, String currentRole, String currentUsername) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (isUserRole(currentRole)) {
            if (!Objects.equals(complaint.getUserId(), currentUserId)) {
                throw new AccessDeniedException("You are not allowed to update this complaint");
            }
            if (request.status() != ComplaintStatus.CLOSED) {
                throw new AccessDeniedException("Customers can only close resolved complaints");
            }
            if (complaint.getStatus() != ComplaintStatus.RESOLVED) {
                throw new IllegalStateException("Only resolved complaints can be closed by the customer");
            }
        }

        ComplaintStatus requestedStatus = request.status();
        if (requestedStatus == null) {
            throw new IllegalArgumentException("Status is required");
        }

        ComplaintStatus currentStatus = complaint.getStatus();
        if (currentStatus == null || !currentStatus.canTransitionTo(requestedStatus)) {
            throw new IllegalStateException("Invalid status transition from " + currentStatus + " to " + requestedStatus);
        }

        complaint.setStatus(requestedStatus);
        Complaint saved = complaintRepository.save(complaint);
        String note = (request.note() != null && !request.note().isBlank())
                ? request.note().trim()
                : "Status transitioned from " + currentStatus + " to " + requestedStatus;
        complaintHistoryRepository.save(savedHistory(saved, currentStatus, requestedStatus, currentUserId, currentUsername, note));

        dispatchNotification(saved.getUserId(), saved.getId(),
                "Complaint #" + saved.getId() + " status updated to " + requestedStatus.name().replace("_", " "),
                "COMPLAINT_STATUS_CHANGED");

        return ComplaintResponse.fromEntity(saved);
    }

    @Transactional
    public ComplaintResponse escalateComplaint(Long id, EscalateComplaintRequest request, Long currentUserId, String currentRole, String currentUsername) {
        Complaint complaint = complaintRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (isUserRole(currentRole) && !Objects.equals(complaint.getUserId(), currentUserId)) {
            throw new AccessDeniedException("You are not allowed to escalate this complaint");
        }

        if (request == null || request.reason() == null || request.reason().isBlank()) {
            throw new IllegalArgumentException("Escalation reason is required");
        }

        int newLevel = request.level() != null && request.level() > 0 ? request.level() : complaint.getEscalationLevel() + 1;
        complaint.setEscalated(true);
        complaint.setEscalationLevel(newLevel);
        complaint.setEscalationReason(request.reason().trim());
        complaint.setEscalatedAt(Instant.now());

        Complaint saved = complaintRepository.save(complaint);
        complaintHistoryRepository.save(savedHistory(saved, saved.getStatus(), saved.getStatus(), currentUserId, currentUsername,
                "Escalated to Level " + newLevel + ": " + request.reason().trim()));

        dispatchNotification(saved.getUserId(), saved.getId(),
                "Complaint #" + saved.getId() + " escalated to Level " + newLevel + ": " + request.reason().trim(),
                "COMPLAINT_ESCALATED");

        return ComplaintResponse.fromEntity(saved);
    }

    public List<ComplaintHistoryResponse> getComplaintHistory(Long complaintId, Long currentUserId, String currentRole) {
        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found"));

        if (isUserRole(currentRole) && !Objects.equals(complaint.getUserId(), currentUserId)) {
            throw new AccessDeniedException("You are not allowed to view this complaint history");
        }

        return complaintHistoryRepository.findByComplaintIdOrderByChangedAtAsc(complaintId)
                .stream()
                .map(ComplaintHistoryResponse::fromEntity)
                .toList();
    }

    public ComplaintStatsResponse getComplaintStats(Long currentUserId, String currentRole) {
        List<Complaint> complaints = isUserRole(currentRole)
                ? complaintRepository.findByUserIdOrderByUpdatedAtDesc(currentUserId)
                : complaintRepository.findAllByOrderByUpdatedAtDesc();

        Map<String, Long> statusCounts = new LinkedHashMap<>();
        for (ComplaintStatus status : ComplaintStatus.values()) {
            statusCounts.put(status.name(), 0L);
        }
        for (Complaint c : complaints) {
            if (c.getStatus() != null) {
                statusCounts.merge(c.getStatus().name(), 1L, Long::sum);
            }
        }

        Map<String, Long> departmentCounts = new LinkedHashMap<>();
        for (ComplaintDepartment dept : ComplaintDepartment.values()) {
            departmentCounts.put(dept.name(), 0L);
        }
        for (Complaint c : complaints) {
            if (c.getDepartment() != null) {
                departmentCounts.merge(c.getDepartment().name(), 1L, Long::sum);
            }
        }

        Map<String, Long> priorityCounts = new LinkedHashMap<>();
        for (ComplaintPriority prio : ComplaintPriority.values()) {
            priorityCounts.put(prio.name(), 0L);
        }
        for (Complaint c : complaints) {
            ComplaintPriority p = c.getPriority() != null ? c.getPriority() : ComplaintPriority.MEDIUM;
            priorityCounts.merge(p.name(), 1L, Long::sum);
        }

        long overdueCount = complaints.stream().filter(Complaint::isOverdue).count();
        long escalatedCount = complaints.stream().filter(Complaint::isEscalated).count();

        return new ComplaintStatsResponse(
                complaints.size(),
                statusCounts,
                departmentCounts,
                priorityCounts,
                overdueCount,
                escalatedCount
        );
    }

    private Instant calculateSlaDeadline(ComplaintPriority priority, Instant baseTime) {
        long hours = switch (priority != null ? priority : ComplaintPriority.MEDIUM) {
            case LOW -> slaHoursLow;
            case MEDIUM -> slaHoursMedium;
            case HIGH -> slaHoursHigh;
            case CRITICAL -> slaHoursCritical;
        };
        return baseTime.plus(Duration.ofHours(hours));
    }

    private void dispatchNotification(Long recipientUserId, Long complaintId, String message, String type) {
        if (notificationDispatcher != null) {
            notificationDispatcher.dispatchOrEnqueue(recipientUserId, complaintId, null, message, type);
            return;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Internal-Service-Token", internalServiceToken);
            HttpEntity<Map<String, Object>> notifRequest = new HttpEntity<>(
                    Map.of(
                            "recipientUserId", recipientUserId,
                            "complaintId", complaintId,
                            "message", message,
                            "type", type
                    ), headers);
            restTemplate.postForEntity("http://NOTIFICATION-SERVICE/api/notifications", notifRequest, Void.class);
        } catch (Exception ex) {
            logger.warn("Notification dispatch failed for complaint {}: {}", complaintId, ex.getMessage());
        }
    }

    private boolean isUserRole(String currentRole) {
        if (currentRole == null) {
            return true;
        }
        String normalized = currentRole.trim().toUpperCase();
        return normalized.equals("USER") || normalized.equals("ROLE_USER");
    }

    private ComplaintHistory savedHistory(Complaint complaint, ComplaintStatus oldStatus, ComplaintStatus newStatus, Long userId, String username, String note) {
        var history = new ComplaintHistory();
        history.setComplaint(complaint);
        history.setFromStatus(oldStatus);
        history.setToStatus(newStatus);
        history.setChangedByUserId(userId);
        history.setChangedByUsername(username);
        history.setActionNote(note);
        return history;
    }
}
