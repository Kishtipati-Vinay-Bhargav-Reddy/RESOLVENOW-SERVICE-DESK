package com.resolvenow.complaint.dto;

import com.resolvenow.complaint.ComplaintHistory;

import java.time.Instant;

public record ComplaintHistoryResponse(
        Long id,
        Long complaintId,
        String fromStatus,
        String toStatus,
        Long changedByUserId,
        String changedByUsername,
        Instant changedAt,
        String actionNote
) {
    public static ComplaintHistoryResponse fromEntity(ComplaintHistory history) {
        return new ComplaintHistoryResponse(
                history.getId(),
                history.getComplaint() != null ? history.getComplaint().getId() : null,
                history.getFromStatus() == null ? null : history.getFromStatus().name(),
                history.getToStatus() == null ? null : history.getToStatus().name(),
                history.getChangedByUserId(),
                history.getChangedByUsername(),
                history.getChangedAt(),
                history.getActionNote()
        );
    }
}
