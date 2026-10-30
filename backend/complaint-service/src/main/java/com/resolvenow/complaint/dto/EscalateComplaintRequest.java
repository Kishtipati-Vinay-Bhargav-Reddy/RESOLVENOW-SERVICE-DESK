package com.resolvenow.complaint.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EscalateComplaintRequest(
        @NotBlank(message = "Escalation reason is required")
        @Size(max = 500, message = "Escalation reason must be at most 500 characters")
        String reason,

        Integer level
) {
}
