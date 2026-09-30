package com.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(

        @NotBlank(message = "College email is required")
        @Email(message = "Invalid email format")
        @jakarta.validation.constraints.Pattern(
                regexp = ".+@pmec\\.ac\\.in$",
                message = "Use your college email ending with @pmec.ac.in"
        )
        String email,

        @NotBlank(message = "Password is required")
        String password
) {
}