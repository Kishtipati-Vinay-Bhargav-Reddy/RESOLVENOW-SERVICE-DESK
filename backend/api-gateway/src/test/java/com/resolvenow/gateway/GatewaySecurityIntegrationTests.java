package com.resolvenow.gateway;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.client.HttpServerErrorException;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "eureka.client.register-with-eureka=false",
        "eureka.client.fetch-registry=false",
        "jwt.secret=dGVzdC1yZXNvbHZlbm93LWtleS1mb3ItaW50ZWdyYXRpb24tdGVzdHM=",
        "jwt.expiration=3600000"
})
@AutoConfigureMockMvc
class GatewaySecurityIntegrationTests {

    private static final String TEST_SECRET =
            "dGVzdC1yZXNvbHZlbm93LWtleS1mb3ItaW50ZWdyYXRpb24tdGVzdHM=";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void onlyLoginAndRegistrationArePublic() throws Exception {
        assertPublicAuthRequest(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"));

        assertPublicAuthRequest(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"));

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

        @Test
        void authenticatedUserCanReachProfileRoute() throws Exception {
                assertThatThrownBy(() -> mockMvc.perform(get("/api/auth/me")
                                .header("Authorization", "Bearer " + createToken())))
                        .isInstanceOf(ServletException.class)
                        .hasRootCauseInstanceOf(HttpServerErrorException.class)
                        .hasMessageContaining("503");
        }

    @Test
    void businessEndpointsRejectMissingAndInvalidTokens() throws Exception {
        mockMvc.perform(get("/api/complaints"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/assignments").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/not-routed")
                        .header("Authorization", "Bearer " + createToken()))
                .andExpect(status().isNotFound());
    }

    @Test
    void corsPreflightRemainsAvailableWithoutAuthentication() throws Exception {
        mockMvc.perform(options("/api/complaints")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    private String createToken() {
        byte[] keyBytes = Base64.getDecoder().decode(TEST_SECRET);
        SecretKey key = Keys.hmacShaKeyFor(keyBytes);
        Date now = new Date();
        return Jwts.builder()
                .subject("alice")
                .claim("userId", 7L)
                .claim("role", "USER")
                .issuedAt(now)
                .expiration(new Date(now.getTime() + 60_000))
                .signWith(key)
                .compact();
    }

        private void assertPublicAuthRequest(MockHttpServletRequestBuilder request) throws Exception {
                try {
                        int responseStatus = mockMvc.perform(request).andReturn().getResponse().getStatus();
                        assertThat(responseStatus).isEqualTo(503);
                } catch (ServletException exception) {
                        assertThatThrownBy(() -> {
                                throw exception;
                        }).hasRootCauseInstanceOf(HttpServerErrorException.class);
                }
        }
}