package com.resolvenow.assignment.security;

public record AuthenticatedUser(Long userId, String username, String role) {
}
