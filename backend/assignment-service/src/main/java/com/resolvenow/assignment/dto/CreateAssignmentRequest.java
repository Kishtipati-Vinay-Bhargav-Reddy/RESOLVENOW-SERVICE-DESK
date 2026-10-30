package com.resolvenow.assignment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateAssignmentRequest(
        @NotNull(message = "Complaint ID is required") Long complaintId,
        @NotBlank(message = "Department is required") String department,
        String assignedTo,
        Long complaintOwnerUserId,
        String complaintOwnerUsername,
        String status
) {
}
