package com.resolvenow.notification.dto;

import com.resolvenow.notification.Notification;
import com.resolvenow.notification.NotificationType;

import java.time.Instant;

public record NotificationResponse(
        Long notificationId,
        Long complaintId,
        String message,
        NotificationType type,
        boolean read,
        Instant createdAt,
        Instant readAt) {

    public static NotificationResponse fromEntity(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getComplaintId(),
                notification.getMessage(),
                notification.getType(),
                notification.isReadStatus(),
                notification.getCreatedAt(),
                notification.getReadAt());
    }
}