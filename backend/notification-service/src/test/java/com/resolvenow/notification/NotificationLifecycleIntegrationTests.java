package com.resolvenow.notification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolvenow.notification.repository.NotificationRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class NotificationLifecycleIntegrationTests {

    @LocalServerPort
    private int port;

    private final RestTemplate client = new RestTemplate(new HttpComponentsClientHttpRequestFactory());

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${internal.service-token}")
    private String internalServiceToken;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
    }

    @Test
    void internalCreationTargetsRecipientAndSetsServerTimestamps() throws Exception {
        ResponseEntity<String> response = create(42L, 701L, "COMPLAINT_ASSIGNED");

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode body = objectMapper.readTree(response.getBody());
        assertThat(body.path("notificationId").asLong()).isPositive();
        assertThat(body.path("complaintId").asLong()).isEqualTo(701L);
        assertThat(body.path("type").asText()).isEqualTo("COMPLAINT_ASSIGNED");
        assertThat(body.path("read").asBoolean()).isFalse();
        assertThat(body.path("createdAt").asText()).isNotBlank();
        assertThat(body.path("readAt").isNull()).isTrue();
        assertThat(body.has("userId")).isFalse();

        Notification stored = notificationRepository.findById(body.path("notificationId").asLong()).orElseThrow();
        assertThat(stored.getUserId()).isEqualTo(42L);
        assertThat(stored.getCreatedAt()).isNotNull();
        assertThat(stored.getReadAt()).isNull();
    }

    @Test
    void listAndDetailAreScopedToAuthenticatedUser() throws Exception {
        ResponseEntity<String> aliceCreate = create(42L, 701L, "COMPLAINT_ASSIGNED");
        Long aliceId = notificationId(aliceCreate);
        ResponseEntity<String> bobCreate = create(43L, 702L, "COMPLAINT_ASSIGNED");
        Long bobId = notificationId(bobCreate);

        ResponseEntity<String> list = exchange("/api/notifications?userId=43", HttpMethod.GET, token("alice", 42L, "USER"), null, null);
        assertThat(list.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode entries = objectMapper.readTree(list.getBody());
        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).path("notificationId").asLong()).isEqualTo(aliceId);
        assertThat(exchange("/api/notifications/" + aliceId, HttpMethod.GET, token("alice", 42L, "USER"), null, null)
                .getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(exchange("/api/notifications/" + bobId, HttpMethod.GET, token("alice", 42L, "USER"), null, null)
                .getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(exchange("/api/notifications/999999", HttpMethod.GET, token("alice", 42L, "USER"), null, null)
                .getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void markReadIsOwnedIdempotentAndSetsReadAt() throws Exception {
        Long notificationId = notificationId(create(42L, 701L, "COMPLAINT_ASSIGNED"));
        String aliceToken = token("alice", 42L, "USER");

        ResponseEntity<String> marked = exchange("/api/notifications/" + notificationId + "/read", HttpMethod.PATCH,
                aliceToken, "{}", null);
        assertThat(marked.getStatusCode()).isEqualTo(HttpStatus.OK);
        JsonNode markedBody = objectMapper.readTree(marked.getBody());
        assertThat(markedBody.path("read").asBoolean()).isTrue();
        String readAt = markedBody.path("readAt").asText();
        assertThat(readAt).isNotBlank();
        var persistedReadAt = notificationRepository.findById(notificationId).orElseThrow().getReadAt();

        ResponseEntity<String> repeated = exchange("/api/notifications/" + notificationId + "/read", HttpMethod.PATCH,
                aliceToken, "{}", null);
        assertThat(objectMapper.readTree(repeated.getBody()).path("readAt").asText()).isNotBlank();
        assertThat(notificationRepository.findById(notificationId).orElseThrow().getReadAt()).isEqualTo(persistedReadAt);

        ResponseEntity<String> unauthorized = exchange("/api/notifications/" + notificationId + "/read", HttpMethod.PATCH,
                token("bob", 43L, "USER"), "{}", null);
        assertThat(unauthorized.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void readAllAndUnreadCountOnlyAffectCurrentUser() throws Exception {
        Long firstId = notificationId(create(42L, 701L, "COMPLAINT_ASSIGNED"));
        create(42L, 702L, "ASSIGNMENT_UPDATED");
        Long bobId = notificationId(create(43L, 703L, "COMPLAINT_ASSIGNED"));
        String aliceToken = token("alice", 42L, "USER");

        exchange("/api/notifications/" + firstId + "/read", HttpMethod.PATCH, aliceToken, "{}", null);
        JsonNode unreadBefore = objectMapper.readTree(exchange("/api/notifications/unread-count", HttpMethod.GET,
                aliceToken, null, null).getBody());
        assertThat(unreadBefore.path("count").asLong()).isEqualTo(1L);

        ResponseEntity<String> result = exchange("/api/notifications/read-all", HttpMethod.PATCH, aliceToken, "{}", null);
        assertThat(objectMapper.readTree(result.getBody()).path("count").asInt()).isEqualTo(1);
        assertThat(notificationRepository.countByUserIdAndReadStatusFalse(42L)).isZero();
        assertThat(notificationRepository.findById(bobId).orElseThrow().isReadStatus()).isFalse();

        ResponseEntity<String> bobCount = exchange("/api/notifications/unread-count", HttpMethod.GET,
                token("bob", 43L, "USER"), null, null);
        assertThat(objectMapper.readTree(bobCount.getBody()).path("count").asLong()).isEqualTo(1L);
        assertThat(objectMapper.readTree(exchange("/api/notifications/read-all", HttpMethod.PATCH, aliceToken, "{}", null)
                .getBody()).path("count").asInt()).isZero();
    }

    @Test
    void duplicateNotificationEventIdReturnsExistingWithoutCreatingDuplicate() throws Exception {
        String eventId = "evt-test-unique-12345";
        String body = "{\"recipientUserId\":42,\"complaintId\":701,\"type\":\"COMPLAINT_ASSIGNED\",\"message\":\"Assigned to tier 1\",\"eventId\":\"" + eventId + "\"}";

        ResponseEntity<String> firstResponse = exchange("/api/notifications", HttpMethod.POST, null, body, internalServiceToken);
        assertThat(firstResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode firstBody = objectMapper.readTree(firstResponse.getBody());
        Long createdId = firstBody.path("notificationId").asLong();
        assertThat(createdId).isNotNull();

        // Second call with identical eventId
        ResponseEntity<String> secondResponse = exchange("/api/notifications", HttpMethod.POST, null, body, internalServiceToken);
        assertThat(secondResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        JsonNode secondBody = objectMapper.readTree(secondResponse.getBody());
        Long secondId = secondBody.path("notificationId").asLong();

        // Must return the exact same notification ID and total count in repository must still be 1
        assertThat(secondId).isEqualTo(createdId);
        assertThat(notificationRepository.findAllByUserIdOrderByCreatedAtDesc(42L)).hasSize(1);
    }

    @Test
    void jwtAndInternalCreationBoundariesAreEnforced() {
        assertThat(exchange("/api/notifications", HttpMethod.GET, null, null, null).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(exchange("/api/notifications", HttpMethod.GET, "not-a-jwt", null, null).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(exchange("/api/notifications", HttpMethod.POST, token("admin", 1L, "ADMIN"),
                "{\"recipientUserId\":42,\"message\":\"hello\",\"type\":\"SYSTEM\"}", null).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);
        assertThat(exchange("/api/notifications", HttpMethod.POST, null, "{}", internalServiceToken)
                .getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    private ResponseEntity<String> create(Long recipientUserId, Long complaintId, String type) {
        String body = "{\"recipientUserId\":" + recipientUserId + ",\"complaintId\":" + complaintId
                + ",\"type\":\"" + type + "\",\"message\":\"Complaint " + complaintId + " assigned\"}";
        return exchange("/api/notifications", HttpMethod.POST, null, body, internalServiceToken);
    }

    private Long notificationId(ResponseEntity<String> response) throws Exception {
        return objectMapper.readTree(response.getBody()).path("notificationId").asLong();
    }

    private ResponseEntity<String> exchange(String path, HttpMethod method, String jwt, String body, String internalToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        if (jwt != null) {
            headers.setBearerAuth(jwt);
        }
        if (internalToken != null) {
            headers.set("X-Internal-Service-Token", internalToken);
        }
        HttpEntity<String> request = body == null ? new HttpEntity<>(headers) : new HttpEntity<>(body, headers);
        try {
            return client.exchange("http://localhost:" + port + path, method, request, String.class);
        } catch (HttpStatusCodeException exception) {
            return ResponseEntity.status(exception.getStatusCode()).body(exception.getResponseBodyAsString());
        }
    }

    private String token(String username, Long userId, String role) {
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