package com.resolvenow.assignment.dto;

import com.resolvenow.assignment.Assignment;
import com.resolvenow.assignment.AssignmentStatus;

import java.time.Instant;

public record AssignmentResponse(
        Long id,
        Long complaintId,
        Long complaintOwnerUserId,
        String complaintOwnerUsername,
        String department,
        String assignedTo,
        AssignmentStatus status,
        Instant createdAt,
        Instant updatedAt
) {
    public static AssignmentResponse fromEntity(Assignment assignment) {
        return new AssignmentResponse(
                assignment.getId(),
                assignment.getComplaintId(),
                assignment.getComplaintOwnerUserId(),
                assignment.getComplaintOwnerUsername(),
                assignment.getDepartment(),
                assignment.getAssignedTo(),
                assignment.getStatus(),
                assignment.getCreatedAt(),
                assignment.getUpdatedAt()
        );
    }
}
