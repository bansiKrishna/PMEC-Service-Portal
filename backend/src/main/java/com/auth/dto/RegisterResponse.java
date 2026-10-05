package com.auth.dto;

public record RegisterResponse(
        Long id,
        String fullName,
        String email,
        String rollNumber,
        String role,
        String message
) {
}