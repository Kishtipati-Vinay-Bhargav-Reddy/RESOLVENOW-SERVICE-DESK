package com.resolvenow.complaint.outbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class ComplaintNotificationDispatcher {

    private static final Logger logger = LoggerFactory.getLogger(ComplaintNotificationDispatcher.class);

    private final ComplaintOutboxRepository outboxRepository;
    private final RestTemplate restTemplate;

    @Value("${internal.service-token:}")
    private String internalServiceToken;

    public ComplaintNotificationDispatcher(ComplaintOutboxRepository outboxRepository, RestTemplate restTemplate) {
        this.outboxRepository = outboxRepository;
        this.restTemplate = restTemplate;
    }

    @Transactional
    public ComplaintOutboxEvent dispatchOrEnqueue(Long recipientUserId, Long complaintId, String department, String message, String type) {
        String eventId = UUID.randomUUID().toString();
        ComplaintOutboxEvent event = new ComplaintOutboxEvent(eventId, recipientUserId, complaintId, department, message, type);
        event = outboxRepository.save(event);

        try {
            sendToNotificationService(event);
            event.setStatus(ComplaintOutboxEvent.STATUS_DELIVERED);
            event.setDeliveredAt(Instant.now());
            event.setLastAttemptAt(Instant.now());
            return outboxRepository.save(event);
        } catch (Exception ex) {
            String sanitizedError = sanitizeError(ex.getMessage());
            logger.warn("Initial complaint notification dispatch failed for event {} (complaint {}): {}. Queued for retry.",
                    event.getEventId(), event.getComplaintId(), sanitizedError);
            event.setRetryCount(1);
            event.setLastAttemptAt(Instant.now());
            event.setLastError(sanitizedError);
            event.setNextAttemptAt(Instant.now().plusSeconds(15));
            return outboxRepository.save(event);
        }
    }

    @Scheduled(fixedDelay = 15000)
    public void retryPendingNotifications() {
        List<ComplaintOutboxEvent> pendingEvents = outboxRepository
                .findTop20ByStatusInAndNextAttemptAtLessThanEqualOrderByCreatedAtAsc(
                        List.of(ComplaintOutboxEvent.STATUS_PENDING), Instant.now());

        if (pendingEvents.isEmpty()) {
            return;
        }

        logger.info("Complaint outbox retry dispatcher: processing {} pending notification(s)", pendingEvents.size());

        for (ComplaintOutboxEvent event : pendingEvents) {
            try {
                sendToNotificationService(event);
                event.setStatus(ComplaintOutboxEvent.STATUS_DELIVERED);
                event.setDeliveredAt(Instant.now());
                event.setLastAttemptAt(Instant.now());
                outboxRepository.save(event);
                logger.info("Complaint outbox: successfully delivered event {} for complaint {}", event.getEventId(), event.getComplaintId());
            } catch (Exception ex) {
                int retries = event.getRetryCount() + 1;
                event.setRetryCount(retries);
                event.setLastAttemptAt(Instant.now());
                String sanitized = sanitizeError(ex.getMessage());
                event.setLastError(sanitized);

                if (retries >= event.getMaxRetries()) {
                    event.setStatus(ComplaintOutboxEvent.STATUS_DEAD_LETTER);
                    logger.error("Complaint outbox: event {} exceeded max retries ({}), moved to DEAD_LETTER: {}",
                            event.getEventId(), event.getMaxRetries(), sanitized);
                } else {
                    long backoff = 15L * Math.min(retries, 8);
                    event.setNextAttemptAt(Instant.now().plusSeconds(backoff));
                    logger.warn("Complaint outbox: retry attempt {} failed for event {}: {}. Next attempt in {}s.",
                            retries, event.getEventId(), sanitized, backoff);
                }
                outboxRepository.save(event);
            }
        }
    }

    private void sendToNotificationService(ComplaintOutboxEvent event) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (internalServiceToken != null && !internalServiceToken.isBlank()) {
            headers.set("X-Internal-Service-Token", internalServiceToken);
        }

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(
                Map.of(
                        "recipientUserId", event.getRecipientUserId(),
                        "complaintId", event.getComplaintId(),
                        "message", event.getMessage(),
                        "type", event.getType(),
                        "eventId", event.getEventId()
                ), headers);

        restTemplate.postForEntity(
                "http://NOTIFICATION-SERVICE/api/notifications",
                request,
                Void.class
        );
    }

    private String sanitizeError(String raw) {
        if (raw == null || raw.isBlank()) {
            return "Unknown error";
        }
        String sanitized = raw.replaceAll("(?i)(password|token|secret|authorization|bearer)[^\\s,;]*", "[REDACTED]");
        return sanitized.length() > 950 ? sanitized.substring(0, 950) + "..." : sanitized;
    }
}
