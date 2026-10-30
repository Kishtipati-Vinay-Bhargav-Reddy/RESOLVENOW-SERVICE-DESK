package com.resolvenow.complaint.dto;

import com.resolvenow.complaint.Complaint;
import com.resolvenow.complaint.ComplaintPriority;

import java.time.Instant;

public record ComplaintResponse(
        Long id,
        String title,
        String description,
        String department,
        String status,
        Long userId,
        String username,
        Instant createdAt,
        Instant updatedAt,
        String priority,
        int escalationLevel,
        boolean escalated,
        String escalationReason,
        Instant escalatedAt,
        Instant slaDeadline,
        boolean overdue
) {
    public static ComplaintResponse fromEntity(Complaint complaint) {
        var department = complaint.getDepartment() == null ? null : complaint.getDepartment().name();
        var status = complaint.getStatus() == null ? null : complaint.getStatus().name();
        var priority = complaint.getPriority() == null ? ComplaintPriority.MEDIUM.name() : complaint.getPriority().name();
        return new ComplaintResponse(
                complaint.getId(),
                complaint.getTitle(),
                complaint.getDescription(),
                department,
                status,
                complaint.getUserId(),
                complaint.getUsername(),
                complaint.getCreatedAt(),
                complaint.getUpdatedAt(),
                priority,
                complaint.getEscalationLevel(),
                complaint.isEscalated(),
                complaint.getEscalationReason(),
                complaint.getEscalatedAt(),
                complaint.getSlaDeadline(),
                complaint.isOverdue()
        );
    }
}
