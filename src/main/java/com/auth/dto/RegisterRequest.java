package com.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import jakarta.validation.constraints.Size;


public record RegisterRequest(

        @NotBlank(message = "Full name is required")
        @Size(max = 180)
        String fullName,

        @NotBlank(message = "College email is required")
        @Email(message = "Invalid email format")
        @jakarta.validation.constraints.Pattern(
                regexp = ".+@pmec\\.ac\\.in$",
                message = "Use your college email ending with @pmec.ac.in"
        )
        @Size(max = 254)
        String email,

        @NotBlank(message = "Password is required")
        @Size(min = 8, max = 72)
        String password,

        @NotBlank(message = "Roll number is required")
        @Size(max = 50)
        String rollNumber,

        @Size(max = 100)
        String department,

        Integer semester
) {
}