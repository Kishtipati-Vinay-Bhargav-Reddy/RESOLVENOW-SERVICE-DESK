package com.resolvenow.complaint.dto;

import com.resolvenow.complaint.ComplaintStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateComplaintStatusRequest(
        @NotNull(message = "Status is required")
        ComplaintStatus status,
        String note
) {
    public UpdateComplaintStatusRequest(ComplaintStatus status) {
        this(status, null);
    }
}
