package com.resolvenow.notification.security;

public record AuthenticatedUser(Long userId, String username, String role) {
}