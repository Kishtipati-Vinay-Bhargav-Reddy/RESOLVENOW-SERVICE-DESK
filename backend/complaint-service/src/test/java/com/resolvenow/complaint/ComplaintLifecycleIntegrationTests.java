package com.resolvenow.complaint;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolvenow.complaint.outbox.ComplaintNotificationDispatcher;
import com.resolvenow.complaint.outbox.ComplaintOutboxEvent;
import com.resolvenow.complaint.outbox.ComplaintOutboxRepository;
import com.resolvenow.complaint.repository.ComplaintHistoryRepository;
import com.resolvenow.complaint.repository.ComplaintRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "internal.service-token=complaint-integration-secret")
class ComplaintLifecycleIntegrationTests {

    @LocalServerPort
    private int port;

    private final RestTemplate client = new RestTemplate(new HttpComponentsClientHttpRequestFactory());

    @MockitoBean
    private RestTemplate restTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private ComplaintHistoryRepository complaintHistoryRepository;

    @Autowired
    private ComplaintOutboxRepository outboxRepository;

    @Autowired
    private ComplaintNotificationDispatcher notificationDispatcher;

    @BeforeEach
    void setup() {
        outboxRepository.deleteAll();
        complaintHistoryRepository.deleteAll();
        complaintRepository.deleteAll();
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.OK));
    }

    @Test
    void createComplaint_assignsAuthenticatedOwner_andOpensLifecycle() throws Exception {
        String token = generateToken("alice", 7L, "USER");

        ResponseEntity<String> response = exchange("/api/complaints", HttpMethod.POST, token,
                "{\"title\":\"VPN is down\",\"description\":\"Cannot access internal tools\",\"department\":\"IT\"}");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.path("userId").asLong()).isEqualTo(7L);
        assertThat(body.path("username").asText()).isEqualTo("alice");
        assertThat(body.path("status").asText()).isEqualTo("OPEN");
        assertThat(complaintRepository.count()).isEqualTo(1L);
        assertThat(complaintHistoryRepository.count()).isEqualTo(1L);
    }

    @Test
    void complaintForwardsJwtOwnerToAssignmentWithInternalCredential() throws Exception {
        String token = generateToken("alice", 7L, "USER");

        ResponseEntity<String> response = exchange("/api/complaints", HttpMethod.POST, token,
                "{\"title\":\"VPN issue\",\"description\":\"Cannot connect\",\"department\":\"IT\"}");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("http://ASSIGNMENT-SERVICE/api/assignments"),
                requestCaptor.capture(), eq(Void.class));
        HttpEntity<?> assignmentRequest = requestCaptor.getValue();
        assertThat(assignmentRequest.getHeaders().getFirst("X-Internal-Service-Token")).isEqualTo("complaint-integration-secret");
        java.util.Map<?, ?> assignmentBody = (java.util.Map<?, ?>) assignmentRequest.getBody();
        assertThat(assignmentBody.get("complaintOwnerUserId")).isEqualTo(7L);
    }

    @Test
    void blankTitleRejected() {
        String token = generateToken("alice", 7L, "USER");
        ResponseEntity<String> response = exchange("/api/complaints", HttpMethod.POST, token,
                "{\"title\":\"   \",\"description\":\"Cannot access internal tools\",\"department\":\"IT\"}");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void blankDescriptionRejected() {
        String token = generateToken("alice", 7L, "USER");
        ResponseEntity<String> response = exchange("/api/complaints", HttpMethod.POST, token,
                "{\"title\":\"VPN is down\",\"description\":\"   \",\"department\":\"IT\"}");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void invalidDepartmentRejected() {
        String token = generateToken("alice", 7L, "USER");
        ResponseEntity<String> response = exchange("/api/complaints", HttpMethod.POST, token,
                "{\"title\":\"VPN is down\",\"description\":\"Cannot access internal tools\",\"department\":\"LEGAL\"}");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void unauthenticatedAccessRejected() {
        ResponseEntity<String> response = exchange("/api/complaints", HttpMethod.GET, null, null);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void userCannotAccessAnotherUsersComplaint() throws Exception {
        String aliceToken = generateToken("alice", 7L, "USER");
        String bobToken = generateToken("bob", 8L, "USER");
        Long complaintId = createComplaintWithToken(aliceToken, "Payroll issue");

        ResponseEntity<String> response = exchange("/api/complaints/" + complaintId, HttpMethod.GET, bobToken, null);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void authorizedUserCanAccessOwnComplaint() throws Exception {
        String token = generateToken("alice", 7L, "USER");
        Long complaintId = createComplaintWithToken(token, "Payroll issue");

        ResponseEntity<String> response = exchange("/api/complaints/" + complaintId, HttpMethod.GET, token, null);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.path("username").asText()).isEqualTo("alice");
    }

    @Test
    void validStatusTransitionSucceeds() throws Exception {
        String aliceToken = generateToken("alice", 7L, "USER");
        String adminToken = generateToken("admin", 99L, "ADMIN");
        Long complaintId = createComplaintWithToken(aliceToken, "Payroll issue");

        ResponseEntity<String> response = exchange("/api/complaints/" + complaintId + "/status", HttpMethod.PATCH, adminToken,
                "{\"status\":\"ASSIGNED\",\"note\":\"Assigned to support tier 2\"}");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.path("status").asText()).isEqualTo("ASSIGNED");
    }

    @Test
    void invalidStatusTransitionRejected() throws Exception {
        String adminToken = generateToken("admin", 99L, "ADMIN");
        Long complaintId = createComplaintWithToken(adminToken, "Payroll issue");

        ResponseEntity<String> response = exchange("/api/complaints/" + complaintId + "/status", HttpMethod.PATCH, adminToken,
                "{\"status\":\"CLOSED\"}");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void historyCreatedAfterStatusChange() throws Exception {
        String aliceToken = generateToken("alice", 7L, "USER");
        String adminToken = generateToken("admin", 99L, "ADMIN");
        Long complaintId = createComplaintWithToken(aliceToken, "Payroll issue");

        ResponseEntity<String> first = exchange("/api/complaints/" + complaintId + "/status", HttpMethod.PATCH, adminToken,
                "{\"status\":\"ASSIGNED\",\"note\":\"Triaged by admin\"}");
        assertThat(first.getStatusCode()).isEqualTo(HttpStatus.OK);

        ResponseEntity<String> historyResponse = exchange("/api/complaints/" + complaintId + "/history", HttpMethod.GET, aliceToken, null);
        assertThat(historyResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode history = objectMapper.readTree(historyResponse.getBody());
        assertThat(history).hasSize(2);
        assertThat(history.get(0).path("toStatus").asText()).isEqualTo("OPEN");
        assertThat(history.get(1).path("toStatus").asText()).isEqualTo("ASSIGNED");
        assertThat(history.get(1).path("actionNote").asText()).isEqualTo("Triaged by admin");
    }

    @Test
    void customerCannotTransitionWorkStatus() throws Exception {
        String aliceToken = generateToken("alice", 7L, "USER");
        Long complaintId = createComplaintWithToken(aliceToken, "Payroll issue");

        ResponseEntity<String> assignResponse = exchange("/api/complaints/" + complaintId + "/status", HttpMethod.PATCH, aliceToken,
                "{\"status\":\"ASSIGNED\"}");
        assertThat(assignResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);

        String adminToken = generateToken("admin", 99L, "ADMIN");
        exchange("/api/complaints/" + complaintId + "/status", HttpMethod.PATCH, adminToken, "{\"status\":\"ASSIGNED\"}");

        ResponseEntity<String> progressResponse = exchange("/api/complaints/" + complaintId + "/status", HttpMethod.PATCH, aliceToken,
                "{\"status\":\"IN_PROGRESS\"}");
        assertThat(progressResponse.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void customerCanCloseOwnResolvedComplaint() throws Exception {
        String aliceToken = generateToken("alice", 7L, "USER");
        String adminToken = generateToken("admin", 99L, "ADMIN");
        Long complaintId = createComplaintWithToken(aliceToken, "Printer broken");

        exchange("/api/complaints/" + complaintId + "/status", HttpMethod.PATCH, adminToken, "{\"status\":\"ASSIGNED\"}");
        exchange("/api/complaints/" + complaintId + "/status", HttpMethod.PATCH, adminToken, "{\"status\":\"IN_PROGRESS\"}");
        exchange("/api/complaints/" + complaintId + "/status", HttpMethod.PATCH, adminToken, "{\"status\":\"RESOLVED\",\"note\":\"Fixed paper jam\"}");

        ResponseEntity<String> closeResponse = exchange("/api/complaints/" + complaintId + "/status", HttpMethod.PATCH, aliceToken,
                "{\"status\":\"CLOSED\",\"note\":\"Issue verified resolved. Closing.\"}");
        assertThat(closeResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(closeResponse.getBody());
        assertThat(body.path("status").asText()).isEqualTo("CLOSED");
    }

    @Test
    void unauthorizedStatusUpdateRejected() throws Exception {
        String aliceToken = generateToken("alice", 7L, "USER");
        String bobToken = generateToken("bob", 8L, "USER");
        Long complaintId = createComplaintWithToken(aliceToken, "Payroll issue");

        ResponseEntity<String> response = exchange("/api/complaints/" + complaintId + "/status", HttpMethod.PATCH, bobToken,
                "{\"status\":\"ASSIGNED\"}");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void complaintNotFoundReturns404() {
        String token = generateToken("alice", 7L, "USER");
        ResponseEntity<String> response = exchange("/api/complaints/999999", HttpMethod.GET, token, null);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void downstreamAssignmentFailureIsHandledCorrectly() {
        String token = generateToken("alice", 7L, "USER");
        when(restTemplate.postForEntity(anyString(), any(), eq(Void.class)))
                .thenThrow(new ResourceAccessException("assignment unavailable"));

        ResponseEntity<String> response = exchange("/api/complaints", HttpMethod.POST, token,
                "{\"title\":\"VPN issue\",\"description\":\"Cannot access\",\"department\":\"IT\"}");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
    }

    @Test
    void createComplaint_withPriority_calculatesSlaDeadline() throws Exception {
        String token = generateToken("alice", 7L, "USER");
        ResponseEntity<String> response = exchange("/api/complaints", HttpMethod.POST, token,
                "{\"title\":\"Critical server outage\",\"description\":\"Production is down\",\"department\":\"IT\",\"priority\":\"CRITICAL\"}");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.path("priority").asText()).isEqualTo("CRITICAL");
        assertThat(body.hasNonNull("slaDeadline")).isTrue();
    }

    @Test
    void escalateComplaint_updatesEscalationLevelAndRecordsAudit() throws Exception {
        String token = generateToken("alice", 7L, "USER");
        Long complaintId = createComplaintWithToken(token, "Network disconnects");

        ResponseEntity<String> response = exchange("/api/complaints/" + complaintId + "/escalate", HttpMethod.POST, token,
                "{\"reason\":\"Issue has affected executive presentation\",\"level\":1}");
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.path("escalated").asBoolean()).isTrue();
        assertThat(body.path("escalationLevel").asInt()).isEqualTo(1);
        assertThat(body.path("escalationReason").asText()).isEqualTo("Issue has affected executive presentation");

        ResponseEntity<String> historyResponse = exchange("/api/complaints/" + complaintId + "/history", HttpMethod.GET, token, null);
        assertThat(historyResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode history = objectMapper.readTree(historyResponse.getBody());
        assertThat(history.size()).isEqualTo(2);
    }

    @Test
    void getComplaintStats_returnsAccurateCounts() throws Exception {
        String token = generateToken("admin", 1L, "ADMIN");
        createComplaintWithToken(token, "First issue");
        createComplaintWithToken(token, "Second issue");

        ResponseEntity<String> response = exchange("/api/complaints/stats", HttpMethod.GET, token, null);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.path("totalComplaints").asLong()).isEqualTo(2L);
        assertThat(body.path("statusCounts").path("OPEN").asLong()).isEqualTo(2L);
    }

    @Test
    void statusUpdateSucceedsWhenNotificationServiceIsUnavailable() throws Exception {
        when(restTemplate.postForEntity(eq("http://NOTIFICATION-SERVICE/api/notifications"), any(), eq(Void.class)))
                .thenThrow(new ResourceAccessException("Notification service connection timed out"));

        String adminToken = generateToken("admin", 99L, "ADMIN");
        Long complaintId = createComplaintWithToken(adminToken, "Database index missing");

        ResponseEntity<String> response = exchange("/api/complaints/" + complaintId + "/status", HttpMethod.PATCH, adminToken,
                "{\"status\":\"ASSIGNED\"}");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.path("status").asText()).isEqualTo("ASSIGNED");
    }

    @Test
    void escalationSucceedsWhenNotificationServiceIsUnavailable() throws Exception {
        when(restTemplate.postForEntity(eq("http://NOTIFICATION-SERVICE/api/notifications"), any(), eq(Void.class)))
                .thenThrow(new ResourceAccessException("Notification service unreachable"));

        String userToken = generateToken("alice", 7L, "USER");
        Long complaintId = createComplaintWithToken(userToken, "Billing error");

        ResponseEntity<String> response = exchange("/api/complaints/" + complaintId + "/escalate", HttpMethod.POST, userToken,
                "{\"reason\":\"Immediate attention required\"}");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.path("escalated").asBoolean()).isTrue();

        List<ComplaintOutboxEvent> outboxEvents = outboxRepository.findByComplaintId(complaintId);
        assertThat(outboxEvents).hasSize(1);
        ComplaintOutboxEvent queuedEvent = outboxEvents.get(0);
        assertThat(queuedEvent.getStatus()).isEqualTo(ComplaintOutboxEvent.STATUS_PENDING);
        assertThat(queuedEvent.getRetryCount()).isEqualTo(1);
        assertThat(queuedEvent.getLastError()).contains("Notification service unreachable");
    }

    @Test
    void outboxEventPersistedAndRetriedOnNotificationRecovery() throws Exception {
        when(restTemplate.postForEntity(eq("http://NOTIFICATION-SERVICE/api/notifications"), any(), eq(Void.class)))
                .thenThrow(new ResourceAccessException("Notification service offline"));

        String adminToken = generateToken("admin", 1L, "ADMIN");
        Long complaintId = createComplaintWithToken(adminToken, "Database index missing");

        ResponseEntity<String> response = exchange("/api/complaints/" + complaintId + "/status", HttpMethod.PATCH, adminToken,
                "{\"status\":\"ASSIGNED\"}");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

        List<ComplaintOutboxEvent> outboxEvents = outboxRepository.findByComplaintId(complaintId);
        assertThat(outboxEvents).hasSize(1);
        ComplaintOutboxEvent pendingEvent = outboxEvents.get(0);
        assertThat(pendingEvent.getStatus()).isEqualTo(ComplaintOutboxEvent.STATUS_PENDING);
        assertThat(pendingEvent.getRetryCount()).isEqualTo(1);
        assertThat(pendingEvent.getLastError()).contains("Notification service offline");

        // Notification service recovers
        when(restTemplate.postForEntity(eq("http://NOTIFICATION-SERVICE/api/notifications"), any(), eq(Void.class)))
                .thenReturn(new ResponseEntity<>(HttpStatus.OK));

        // Advance nextAttemptAt so the retry picks it up
        pendingEvent.setNextAttemptAt(Instant.now().minusSeconds(1));
        outboxRepository.save(pendingEvent);

        notificationDispatcher.retryPendingNotifications();

        ComplaintOutboxEvent deliveredEvent = outboxRepository.findById(pendingEvent.getId()).orElseThrow();
        assertThat(deliveredEvent.getStatus()).isEqualTo(ComplaintOutboxEvent.STATUS_DELIVERED);
        assertThat(deliveredEvent.getDeliveredAt()).isNotNull();
    }

    @Test
    void outboxTransitionsToDeadLetterWhenRetriesExhausted() {
        ComplaintOutboxEvent event = new ComplaintOutboxEvent(
                "exhaustion-event-id",
                7L,
                999L,
                "IT",
                "Complaint #999 escalation",
                "COMPLAINT_ESCALATED"
        );
        event.setRetryCount(4);
        event.setMaxRetries(5);
        event.setNextAttemptAt(Instant.now().minusSeconds(5));
        outboxRepository.save(event);

        when(restTemplate.postForEntity(eq("http://NOTIFICATION-SERVICE/api/notifications"), any(), eq(Void.class)))
                .thenThrow(new ResourceAccessException("Notification service permanently down"));

        notificationDispatcher.retryPendingNotifications();

        ComplaintOutboxEvent updated = outboxRepository.findByEventId("exhaustion-event-id").orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(ComplaintOutboxEvent.STATUS_DEAD_LETTER);
        assertThat(updated.getRetryCount()).isEqualTo(5);
        assertThat(updated.getLastError()).contains("Notification service permanently down");
    }

    private ResponseEntity<String> exchange(String path, HttpMethod method, String token, String body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null) {
            headers.setBearerAuth(token);
        }
        HttpEntity<String> request = body == null ? new HttpEntity<>(headers) : new HttpEntity<>(body, headers);
        try {
            return client.exchange("http://localhost:" + port + path, method, request, String.class);
        } catch (HttpStatusCodeException exception) {
            return ResponseEntity.status(exception.getStatusCode())
                    .body(exception.getResponseBodyAsString());
        }
    }

    private Long createComplaintWithToken(String token, String title) throws Exception {
        String body = "{\"title\":\"" + title + "\",\"description\":\"detail\",\"department\":\"IT\"}";
        ResponseEntity<String> response = exchange("/api/complaints", HttpMethod.POST, token, body);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode root = objectMapper.readTree(response.getBody());
        return root.path("id").asLong();
    }

    private String generateToken(String username, Long userId, String role) {
        String secret = "dGVzdC1yZXNvbHZlbm93LWtleS1mb3ItaW50ZWdyYXRpb24tdGVzdHM=";
        SecretKey key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(secret));
        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("role", role)
                .signWith(key)
                .compact();
    }
}
