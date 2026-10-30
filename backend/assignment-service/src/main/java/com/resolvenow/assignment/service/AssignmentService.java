package com.resolvenow.assignment.service;

import com.resolvenow.assignment.Assignment;
import com.resolvenow.assignment.AssignmentStatus;
import com.resolvenow.assignment.dto.AssignmentResponse;
import com.resolvenow.assignment.dto.CreateAssignmentRequest;
import com.resolvenow.assignment.dto.UpdateAssignmentRequest;
import com.resolvenow.assignment.repository.AssignmentRepository;
import com.resolvenow.assignment.security.AuthenticatedUser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AssignmentService {

    private static final Logger logger = LoggerFactory.getLogger(AssignmentService.class);

    private final AssignmentRepository assignmentRepository;
    private final RestTemplate restTemplate;
    private final com.resolvenow.assignment.outbox.AssignmentNotificationDispatcher notificationDispatcher;

    @Value("${assignment.default-assignee:admin}")
    private String defaultAssignee;

    @Value("${assignment.supported-assignees:admin,support,staff}")
    private String supportedAssigneesRaw;

    @Value("${internal.service-token:}")
    private String internalServiceToken;

    @Autowired
    public AssignmentService(
            AssignmentRepository assignmentRepository,
            RestTemplate restTemplate,
            com.resolvenow.assignment.outbox.AssignmentNotificationDispatcher notificationDispatcher) {
        this.assignmentRepository = assignmentRepository;
        this.restTemplate = restTemplate;
        this.notificationDispatcher = notificationDispatcher;
    }

    public AssignmentService(AssignmentRepository assignmentRepository, RestTemplate restTemplate) {
        this(assignmentRepository, restTemplate, null);
    }

    public AssignmentResponse createAssignment(CreateAssignmentRequest request, AuthenticatedUser currentUser) {
        if (request == null || request.complaintId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Complaint ID is required");
        }

        if (assignmentRepository.existsByComplaintId(request.complaintId())) {
            Assignment existing = assignmentRepository.findByComplaintId(request.complaintId()).orElseThrow();
            return AssignmentResponse.fromEntity(existing);
        }

        String normalizedDepartment = request.department() == null ? "IT" : request.department().trim();
        String assignedTo = resolveAssignee(request.assignedTo(), currentUser);
        Long ownerUserId = currentUser != null ? currentUser.userId() : request.complaintOwnerUserId();
        String ownerUsername = currentUser != null ? currentUser.username()
                : request.complaintOwnerUsername() == null || request.complaintOwnerUsername().isBlank()
                        ? "system"
                        : request.complaintOwnerUsername().trim();

        if (ownerUserId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Complaint owner is required");
        }

        Assignment assignment = new Assignment();
        assignment.setComplaintId(request.complaintId());
        assignment.setComplaintOwnerUserId(ownerUserId);
        assignment.setComplaintOwnerUsername(ownerUsername);
        assignment.setDepartment(normalizedDepartment);
        assignment.setAssignedTo(assignedTo);
        assignment.setStatus(parseStatus(request.status(), AssignmentStatus.ASSIGNED));

        Assignment savedAssignment = assignmentRepository.save(assignment);

        if (notificationDispatcher != null) {
            notificationDispatcher.dispatchOrEnqueue(
                    savedAssignment.getComplaintOwnerUserId(),
                    savedAssignment.getComplaintId(),
                    savedAssignment.getDepartment(),
                    "Assignment created for complaint " + savedAssignment.getComplaintId() + ". Assigned to " + savedAssignment.getAssignedTo() + ".",
                    "COMPLAINT_ASSIGNED"
            );
        } else {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("X-Internal-Service-Token", internalServiceToken);
                HttpEntity<Map<String, Object>> notificationRequest = new HttpEntity<>(
                        Map.of(
                            "recipientUserId", savedAssignment.getComplaintOwnerUserId(),
                            "complaintId", savedAssignment.getComplaintId(),
                            "message", "Assignment created for complaint " + savedAssignment.getComplaintId() + ". Assigned to " + savedAssignment.getAssignedTo() + ".",
                            "type", "COMPLAINT_ASSIGNED"
                        ), headers);
                restTemplate.postForEntity(
                        "http://NOTIFICATION-SERVICE/api/notifications",
                        notificationRequest,
                        Object.class
                );
            } catch (Exception exception) {
                logger.warn("Notification dispatch failed for assignment {} (complaint {}): {}",
                        savedAssignment.getId(), savedAssignment.getComplaintId(), exception.getMessage());
            }
        }

        return AssignmentResponse.fromEntity(savedAssignment);
    }

    public List<AssignmentResponse> getAssignmentsForUser(AuthenticatedUser currentUser) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        if (isStaffOrAdmin(currentUser.role())) {
            return assignmentRepository.findAllByOrderByUpdatedAtDesc().stream()
                    .map(AssignmentResponse::fromEntity)
                    .toList();
        }

        return assignmentRepository.findByComplaintOwnerUserIdOrAssignedToOrderByUpdatedAtDesc(currentUser.userId(), currentUser.username())
                .stream()
                .map(AssignmentResponse::fromEntity)
                .toList();
    }

    public AssignmentResponse getAssignmentById(Long id, AuthenticatedUser currentUser) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));

        if (!canAccessAssignment(currentUser, assignment)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to view this assignment");
        }

        return AssignmentResponse.fromEntity(assignment);
    }

    public AssignmentResponse updateAssignment(Long id, UpdateAssignmentRequest request, AuthenticatedUser currentUser) {
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        if (!isStaffOrAdmin(currentUser.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only staff or admin users can reassign work");
        }

        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignment update is required");
        }

        if (request.assignedTo() != null && !request.assignedTo().isBlank()) {
            String resolvedAssignee = resolveAssignee(request.assignedTo(), currentUser);
            assignment.setAssignedTo(resolvedAssignee);
        }

        if (request.status() != null && !request.status().isBlank()) {
            AssignmentStatus requestedStatus = AssignmentStatus.fromValue(request.status());
            if (requestedStatus == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignment status is invalid");
            }
            if (!assignment.getStatus().canTransitionTo(requestedStatus)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Invalid assignment status transition from " + assignment.getStatus() + " to " + requestedStatus);
            }
            assignment.setStatus(requestedStatus);
        }

        return AssignmentResponse.fromEntity(assignmentRepository.save(assignment));
    }

    private boolean canAccessAssignment(AuthenticatedUser currentUser, Assignment assignment) {
        if (currentUser == null) {
            return false;
        }

        if (isStaffOrAdmin(currentUser.role())) {
            return true;
        }

        return assignment.getComplaintOwnerUserId() != null
                && assignment.getComplaintOwnerUserId().equals(currentUser.userId())
                || (assignment.getAssignedTo() != null && assignment.getAssignedTo().equalsIgnoreCase(currentUser.username()));
    }

    private String resolveAssignee(String requestedAssignee, AuthenticatedUser currentUser) {
        String target = requestedAssignee == null || requestedAssignee.isBlank()
                ? defaultAssignee
                : requestedAssignee.trim();

        Set<String> validAssignees = supportedAssignees();
        if (!validAssignees.contains(target.toLowerCase())) {
            if (currentUser != null && validAssignees.contains(currentUser.username().toLowerCase())) {
                return currentUser.username();
            }
            return defaultAssignee;
        }

        return target;
    }

    private Set<String> supportedAssignees() {
        return Arrays.stream(supportedAssigneesRaw.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .map(value -> value.toLowerCase())
                .collect(Collectors.toSet());
    }

    private AssignmentStatus parseStatus(String rawStatus, AssignmentStatus fallback) {
        AssignmentStatus parsed = rawStatus == null || rawStatus.isBlank()
                ? fallback
                : AssignmentStatus.fromValue(rawStatus);
        return parsed == null ? fallback : parsed;
    }

    private boolean isStaffOrAdmin(String role) {
        if (role == null) {
            return false;
        }
        String normalized = role.toUpperCase();
        return "ADMIN".equals(normalized) || "STAFF".equals(normalized) || "ROLE_ADMIN".equals(normalized) || "ROLE_STAFF".equals(normalized);
    }
}