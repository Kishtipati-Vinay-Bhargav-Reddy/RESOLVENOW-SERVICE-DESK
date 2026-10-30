package com.resolvenow.notification.service;

import java.util.List;
import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.resolvenow.notification.Notification;
import com.resolvenow.notification.dto.CreateNotificationRequest;
import com.resolvenow.notification.dto.NotificationResponse;
import com.resolvenow.notification.repository.NotificationRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public NotificationResponse createNotification(CreateNotificationRequest request) {
        if (request.eventId() != null && !request.eventId().isBlank()) {
            var existing = notificationRepository.findByEventId(request.eventId().trim());
            if (existing.isPresent()) {
                return NotificationResponse.fromEntity(existing.get());
            }
        }

        Notification notification = new Notification();
        if (request.eventId() != null && !request.eventId().isBlank()) {
            notification.setEventId(request.eventId().trim());
        }
        notification.setUserId(request.recipientUserId());
        notification.setComplaintId(request.complaintId());
        notification.setMessage(request.message().trim());
        notification.setType(request.type());
        notification.setReadStatus(false);
        return NotificationResponse.fromEntity(notificationRepository.save(notification));
    }

    public List<NotificationResponse> getNotificationsForUser(Long userId) {
        return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::fromEntity)
                .toList();
    }

    public NotificationResponse getNotificationById(Long id, Long userId) {
        return NotificationResponse.fromEntity(getOwnedNotification(id, userId));
    }

    @Transactional
    public NotificationResponse markAsRead(Long id, Long userId) {
        Notification notification = getOwnedNotification(id, userId);
        if (!notification.isReadStatus()) {
            notification.setReadStatus(true);
            notification.setReadAt(Instant.now());
            notification = notificationRepository.save(notification);
        }
        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public int markAllAsRead(Long userId) {
        return notificationRepository.markAllReadByUserId(userId, Instant.now());
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadStatusFalse(userId);
    }

    private Notification getOwnedNotification(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!userId.equals(notification.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to access this notification");
        }
        return notification;
    }
}