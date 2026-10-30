package com.resolvenow.auth.dto;

public record LoginResponse(
        String token,
        Long userId,
        String username,
        String email,
        String role) {
}