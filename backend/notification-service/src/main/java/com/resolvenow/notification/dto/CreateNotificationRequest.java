package com.resolvenow.notification.dto;

import com.resolvenow.notification.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateNotificationRequest(
        @NotNull @Positive Long recipientUserId,
        @Positive Long complaintId,
        @NotNull NotificationType type,
        @NotBlank @Size(max = 2000) String message,
        @Size(max = 64) String eventId) {

    public CreateNotificationRequest(Long recipientUserId, Long complaintId, NotificationType type, String message) {
        this(recipientUserId, complaintId, type, message, null);
    }
}