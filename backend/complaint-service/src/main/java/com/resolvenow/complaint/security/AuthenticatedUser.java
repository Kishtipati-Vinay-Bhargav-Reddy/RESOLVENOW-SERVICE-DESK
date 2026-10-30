package com.resolvenow.complaint.security;

public record AuthenticatedUser(Long userId, String username, String role) {
}
