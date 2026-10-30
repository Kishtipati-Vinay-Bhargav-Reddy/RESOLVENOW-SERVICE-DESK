package com.resolvenow.assignment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolvenow.assignment.repository.AssignmentRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.mockito.ArgumentCaptor;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = "internal.service-token=assignment-integration-secret")
class AssignmentLifecycleIntegrationTests {

    @LocalServerPort
    private int port;

    private final RestTemplate client = new RestTemplate(new HttpComponentsClientHttpRequestFactory());

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private com.resolvenow.assignment.outbox.AssignmentOutboxRepository outboxRepository;

    @Autowired
    private com.resolvenow.assignment.outbox.AssignmentNotificationDispatcher notificationDispatcher;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${internal.service-token}")
    private String internalServiceToken;

    @MockitoBean
    private RestTemplate restTemplate;

    @BeforeEach
    void setUp() {
        outboxRepository.deleteAll();
        assignmentRepository.deleteAll();
        when(restTemplate.postForEntity(anyString(), any(), eq(Object.class)))
                .thenReturn(new org.springframework.http.ResponseEntity<>(org.springframework.http.HttpStatus.OK));
    }

    @Test
    void adminCanCreateAssignmentAndNotificationIsFired() throws Exception {
        String token = generateToken("admin", 99L, "ADMIN");

        ResponseEntity<String> response = exchange("/api/assignments", HttpMethod.POST, token,
                "{\"complaintId\":7,\"department\":\"IT\",\"assignedTo\":\"admin\",\"complaintOwnerUserId\":11,\"complaintOwnerUsername\":\"alice\",\"status\":\"ASSIGNED\"}");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.path("complaintId").asLong()).isEqualTo(7L);
        assertThat(body.path("assignedTo").asText()).isEqualTo("admin");
        assertThat(body.path("status").asText()).isEqualTo("ASSIGNED");
        assertThat(assignmentRepository.count()).isEqualTo(1L);
    }

        @Test
        void internalAssignmentTargetsTrustedComplaintOwner() throws Exception {
        ResponseEntity<String> response = exchange("/api/assignments", HttpMethod.POST, null,
            "{\"complaintId\":44,\"department\":\"IT\",\"assignedTo\":\"admin\",\"complaintOwnerUserId\":42,\"complaintOwnerUsername\":\"alice\",\"status\":\"ASSIGNED\"}",
            internalServiceToken);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Assignment assignment = assignmentRepository.findByComplaintId(44L).orElseThrow();
        assertThat(assignment.getComplaintOwnerUserId()).isEqualTo(42L);

        ArgumentCaptor<HttpEntity> requestCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate).postForEntity(eq("http://NOTIFICATION-SERVICE/api/notifications"),
            requestCaptor.capture(), eq(Object.class));
        HttpEntity<?> notificationRequest = requestCaptor.getValue();
        assertThat(notificationRequest.getHeaders().getFirst("X-Internal-Service-Token")).isEqualTo(internalServiceToken);
        Map<?, ?> notificationBody = (Map<?, ?>) notificationRequest.getBody();
        assertThat(notificationBody.get("recipientUserId")).isEqualTo(42L);
        assertThat(notificationBody.get("complaintId")).isEqualTo(44L);
        assertThat(notificationBody.get("type")).isEqualTo("COMPLAINT_ASSIGNED");
        }

    @Test
    void userCanOnlyViewOwnAssignments() throws Exception {
        saveAssignment(7L, 11L, "alice", "IT", "admin", AssignmentStatus.ASSIGNED);
        saveAssignment(8L, 22L, "bob", "HR", "support", AssignmentStatus.ASSIGNED);

        String aliceToken = generateToken("alice", 11L, "USER");
        ResponseEntity<String> response = exchange("/api/assignments", HttpMethod.GET, aliceToken, null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode root = objectMapper.readTree(response.getBody());
        assertThat(root).hasSize(1);
        assertThat(root.get(0).path("complaintId").asLong()).isEqualTo(7L);
    }

    @Test
    void missingAndInvalidTokensAreUnauthorized() {
        ResponseEntity<String> missingTokenResponse = exchange("/api/assignments", HttpMethod.GET, null, null);
        ResponseEntity<String> invalidTokenResponse = exchange("/api/assignments", HttpMethod.GET, "not-a-valid-jwt", null);

        assertThat(missingTokenResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(invalidTokenResponse.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void validReassignmentSucceedsForStaff() throws Exception {
        Assignment assignment = saveAssignment(7L, 11L, "alice", "IT", "admin", AssignmentStatus.ASSIGNED);
        String staffToken = generateToken("support", 45L, "STAFF");

        ResponseEntity<String> response = exchange("/api/assignments/" + assignment.getId(), HttpMethod.PATCH, staffToken,
                "{\"assignedTo\":\"support\",\"status\":\"IN_PROGRESS\"}");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.path("assignedTo").asText()).isEqualTo("support");
        assertThat(body.path("status").asText()).isEqualTo("IN_PROGRESS");
    }

    @Test
    void unauthorizedUserCannotReassignAssignment() throws Exception {
        Assignment assignment = saveAssignment(7L, 11L, "alice", "IT", "admin", AssignmentStatus.ASSIGNED);
        String userToken = generateToken("alice", 11L, "USER");

        ResponseEntity<String> response = exchange("/api/assignments/" + assignment.getId(), HttpMethod.PATCH, userToken,
                "{\"assignedTo\":\"support\"}");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(assignmentRepository.findById(assignment.getId()).orElseThrow().getAssignedTo()).isEqualTo("admin");
    }

    @Test
    void nonexistentAssigneeFallsBackToDefaultConfiguredAssignee() throws Exception {
        String token = generateToken("admin", 99L, "ADMIN");

        ResponseEntity<String> response = exchange("/api/assignments", HttpMethod.POST, token,
                "{\"complaintId\":15,\"department\":\"IT\",\"assignedTo\":\"unknown-user\",\"complaintOwnerUserId\":80,\"complaintOwnerUsername\":\"mallory\",\"status\":\"ASSIGNED\"}");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.path("assignedTo").asText()).isEqualTo("admin");
    }

    @Test
    void assignmentCreationSucceedsWhenNotificationServiceIsUnavailable() throws Exception {
        when(restTemplate.postForEntity(anyString(), any(), eq(Object.class)))
                .thenThrow(new ResourceAccessException("notification unavailable"));

        String token = generateToken("admin", 99L, "ADMIN");
        ResponseEntity<String> response = exchange("/api/assignments", HttpMethod.POST, token,
                "{\"complaintId\":77,\"department\":\"HR\",\"assignedTo\":\"admin\",\"complaintOwnerUserId\":12,\"complaintOwnerUsername\":\"carol\",\"status\":\"ASSIGNED\"}");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(assignmentRepository.existsByComplaintId(77L)).isTrue();
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.path("complaintId").asLong()).isEqualTo(77L);
        assertThat(body.path("assignedTo").asText()).isEqualTo("admin");
        assertThat(body.path("status").asText()).isEqualTo("ASSIGNED");
    }

    @Test
    void outboxEventPersistedAndRetriedOnNotificationRecovery() throws Exception {
        when(restTemplate.postForEntity(anyString(), any(), eq(Object.class)))
                .thenThrow(new ResourceAccessException("notification unavailable"));

        String token = generateToken("admin", 99L, "ADMIN");
        ResponseEntity<String> response = exchange("/api/assignments", HttpMethod.POST, token,
                "{\"complaintId\":88,\"department\":\"IT\",\"assignedTo\":\"admin\",\"complaintOwnerUserId\":15,\"complaintOwnerUsername\":\"david\",\"status\":\"ASSIGNED\"}");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(outboxRepository.count()).isEqualTo(1L);

        var pendingList = outboxRepository.findAll();
        assertThat(pendingList.get(0).getStatus()).isEqualTo(com.resolvenow.assignment.outbox.AssignmentOutboxEvent.STATUS_PENDING);
        assertThat(pendingList.get(0).getRetryCount()).isEqualTo(1);
        assertThat(pendingList.get(0).getLastError()).contains("notification unavailable");

        // Simulate notification service recovery
        when(restTemplate.postForEntity(anyString(), any(), eq(Object.class)))
                .thenReturn(new org.springframework.http.ResponseEntity<>(org.springframework.http.HttpStatus.OK));

        // Adjust nextAttemptAt so retry picks it up immediately
        var event = pendingList.get(0);
        event.setNextAttemptAt(java.time.Instant.now().minusSeconds(1));
        outboxRepository.save(event);

        notificationDispatcher.retryPendingNotifications();

        var recovered = outboxRepository.findById(event.getId()).orElseThrow();
        assertThat(recovered.getStatus()).isEqualTo(com.resolvenow.assignment.outbox.AssignmentOutboxEvent.STATUS_DELIVERED);
        assertThat(recovered.getDeliveredAt()).isNotNull();
    }

    @Test
    void outboxTransitionsToDeadLetterWhenRetriesExhausted() {
        var event = new com.resolvenow.assignment.outbox.AssignmentOutboxEvent(
                "evt-dead-letter-test", 15L, 88L, "IT", "Test message", "COMPLAINT_ASSIGNED");
        event.setRetryCount(4); // 4 retries already done, 5th failure exhausts retries
        event.setNextAttemptAt(java.time.Instant.now().minusSeconds(1));
        outboxRepository.save(event);

        when(restTemplate.postForEntity(anyString(), any(), eq(Object.class)))
                .thenThrow(new ResourceAccessException("fatal network fault"));

        notificationDispatcher.retryPendingNotifications();

        var exhausted = outboxRepository.findByEventId("evt-dead-letter-test").orElseThrow();
        assertThat(exhausted.getStatus()).isEqualTo(com.resolvenow.assignment.outbox.AssignmentOutboxEvent.STATUS_DEAD_LETTER);
        assertThat(exhausted.getRetryCount()).isEqualTo(5);
        assertThat(exhausted.getLastError()).contains("fatal network fault");
    }

    private Assignment saveAssignment(Long complaintId, Long ownerId, String ownerName, String department, String assignee, AssignmentStatus status) {
        Assignment assignment = new Assignment(complaintId, ownerId, ownerName, department, assignee, status);
        return assignmentRepository.save(assignment);
    }

    private ResponseEntity<String> exchange(String path, HttpMethod method, String token, String body) {
        return exchange(path, method, token, body, null);
    }

    private ResponseEntity<String> exchange(String path, HttpMethod method, String token, String body, String internalToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (token != null) {
            headers.setBearerAuth(token);
        }
        if (internalToken != null) {
            headers.set("X-Internal-Service-Token", internalToken);
        }
        HttpEntity<String> request = body == null ? new HttpEntity<>(headers) : new HttpEntity<>(body, headers);
        try {
            return client.exchange("http://localhost:" + port + path, method, request, String.class);
        } catch (HttpStatusCodeException exception) {
            return ResponseEntity.status(exception.getStatusCode())
                    .body(exception.getResponseBodyAsString());
        }
    }

    private String generateToken(String username, Long userId, String role) {
        SecretKey key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(jwtSecret));
        Date issuedAt = new Date();
        return Jwts.builder()
                .subject(username)
                .claim("userId", userId)
                .claim("role", role)
                .issuedAt(issuedAt)
                .expiration(new Date(issuedAt.getTime() + jwtExpiration))
                .signWith(key)
                .compact();
    }
}
