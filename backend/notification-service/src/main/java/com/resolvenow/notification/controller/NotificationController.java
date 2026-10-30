package com.resolvenow.notification.controller;

import com.resolvenow.notification.dto.CreateNotificationRequest;
import com.resolvenow.notification.dto.NotificationResponse;
import com.resolvenow.notification.dto.ReadAllNotificationsResponse;
import com.resolvenow.notification.dto.UnreadCountResponse;
import com.resolvenow.notification.security.AuthenticatedUser;
import com.resolvenow.notification.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public ResponseEntity<NotificationResponse> createNotification(
            @Valid @RequestBody CreateNotificationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.createNotification(request));
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAllNotifications(Authentication authentication) {
        return ResponseEntity.ok(notificationService.getNotificationsForUser(requireUserId(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationResponse> getNotificationById(
            @PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(notificationService.getNotificationById(id, requireUserId(authentication)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(notificationService.markAsRead(id, requireUserId(authentication)));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ReadAllNotificationsResponse> markAllAsRead(Authentication authentication) {
        int count = notificationService.markAllAsRead(requireUserId(authentication));
        return ResponseEntity.ok(new ReadAllNotificationsResponse(count));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(Authentication authentication) {
        long count = notificationService.getUnreadCount(requireUserId(authentication));
        return ResponseEntity.ok(new UnreadCountResponse(count));
    }

    private Long requireUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof AuthenticatedUser user) {
            return user.userId();
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
}