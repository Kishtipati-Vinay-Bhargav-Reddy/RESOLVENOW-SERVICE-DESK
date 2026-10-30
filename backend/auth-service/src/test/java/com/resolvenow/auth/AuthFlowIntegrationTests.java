package com.resolvenow.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolvenow.auth.entity.User;
import com.resolvenow.auth.jwt.JwtService;
import com.resolvenow.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthFlowIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void clearUsers() {
        userRepository.deleteAll();
    }

    @Test
    void registrationIgnoresSubmittedRoleAndNeverReturnsPasswordHash() throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"alice","email":"alice@example.com","password":"correct-horse-1","role":"ADMIN"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        assertThat(response).doesNotContain("password");
        User savedUser = userRepository.findByUsername("alice").orElseThrow();
        assertThat(savedUser.getRole()).isEqualTo("USER");
        assertThat(savedUser.getPassword()).isNotEqualTo("correct-horse-1");
        assertThat(passwordEncoder.matches("correct-horse-1", savedUser.getPassword())).isTrue();
    }

    @Test
    void duplicateUsernameAndEmailAreRejected() throws Exception {
        register("alice", "alice@example.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"alice","email":"another@example.com","password":"correct-horse-1"}
                                """))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"another","email":"alice@example.com","password":"correct-horse-1"}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    void loginReturnsIdentityClaimsAndRejectsInvalidCredentials() throws Exception {
        register("alice", "alice@example.com");

        String body = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"alice","password":"correct-horse-1"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").isNumber())
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        JsonNode response = objectMapper.readTree(body);
        var claims = jwtService.extractClaims(response.get("token").asText());
        assertThat(claims.getSubject()).isEqualTo("alice");
        assertThat(((Number) claims.get("userId")).longValue()).isEqualTo(response.get("userId").asLong());
        assertThat(claims.get("role", String.class)).isEqualTo("USER");
        assertThat(claims.getIssuedAt()).isNotNull();
        assertThat(claims.getExpiration()).isNotNull();

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"username":"alice","password":"wrong-password"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void currentProfileRequiresAuthenticationAndReturnsSafeUserData() throws Exception {
        register("alice", "alice@example.com");
        User user = userRepository.findByUsername("alice").orElseThrow();

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());

        String token = jwtService.generateToken(user);
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(user.getId()))
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.email").value("alice@example.com"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

        @Test
        void staffAndAdminCanAccessCurrentProfile() throws Exception {
                for (String role : new String[] { "STAFF", "ADMIN" }) {
                        User user = userRepository.save(new User(
                                        role.toLowerCase(), role.toLowerCase() + "@example.com",
                                        passwordEncoder.encode("correct-horse-1"), role));
                        String token = jwtService.generateToken(user);

                        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$.role").value(role));
                }
        }

    private void register(String username, String email) throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new RegistrationBody(username, email, "correct-horse-1"))))
                .andExpect(status().isOk());
    }

    private record RegistrationBody(String username, String email, String password) {
    }
}