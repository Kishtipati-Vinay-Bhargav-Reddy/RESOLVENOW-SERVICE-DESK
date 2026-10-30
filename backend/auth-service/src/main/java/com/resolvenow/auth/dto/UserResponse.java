package com.resolvenow.auth.dto;

public record UserResponse(Long userId, String username, String email, String role) {
}