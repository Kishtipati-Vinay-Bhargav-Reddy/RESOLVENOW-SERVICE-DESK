package com.resolvenow.notification;

import com.resolvenow.notification.dto.CreateNotificationRequest;
import com.resolvenow.notification.repository.NotificationRepository;
import com.resolvenow.notification.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessResourceFailureException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTests {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void notificationCreationFailurePropagatesToApiErrorHandling() {
        when(notificationRepository.save(any(Notification.class)))
                .thenThrow(new DataAccessResourceFailureException("database unavailable"));

        assertThatThrownBy(() -> notificationService.createNotification(
                new CreateNotificationRequest(42L, 701L, NotificationType.COMPLAINT_ASSIGNED, "Assigned")))
                .isInstanceOf(DataAccessResourceFailureException.class)
                .hasMessage("database unavailable");
    }
}