package com.resolvenow.notification.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.resolvenow.notification.Notification;
import com.resolvenow.notification.repository.NotificationRepository;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    public Notification createNotification(Notification notification) {

        if (notification.getType() == null || notification.getType().isBlank()) {
            notification.setType("SYSTEM");
        }

        return notificationRepository.save(notification);
    }

    public List<Notification> getAllNotifications() {
        return notificationRepository.findAll();
    }

    public Notification getNotificationById(Long id) {
        return notificationRepository.findById(id).orElse(null);
    }
}