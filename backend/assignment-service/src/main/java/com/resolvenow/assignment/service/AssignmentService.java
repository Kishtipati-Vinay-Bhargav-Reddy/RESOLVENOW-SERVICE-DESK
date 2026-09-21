package com.resolvenow.assignment.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.resolvenow.assignment.Assignment;
import com.resolvenow.assignment.repository.AssignmentRepository;

@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final RestTemplate restTemplate;

    public AssignmentService(
            AssignmentRepository assignmentRepository,
            RestTemplate restTemplate) {

        this.assignmentRepository = assignmentRepository;
        this.restTemplate = restTemplate;
    }

    public Assignment createAssignment(Assignment assignment) {

        if (assignment.getStatus() == null || assignment.getStatus().isBlank()) {
            assignment.setStatus("ASSIGNED");
        }

        // Save assignment
        Assignment savedAssignment = assignmentRepository.save(assignment);

        // Automatically create notification
        restTemplate.postForEntity(
                "http://NOTIFICATION-SERVICE/api/notifications",
                Map.of(
                        "complaintId", savedAssignment.getComplaintId(),
                        "message", "Your complaint has been assigned to the "
                                + savedAssignment.getDepartment()
                                + " department.",
                        "type", "SYSTEM",
                        "readStatus", false
                ),
                Void.class
        );

        return savedAssignment;
    }

    public List<Assignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }

    public Assignment getAssignmentById(Long id) {
        return assignmentRepository.findById(id).orElse(null);
    }
}