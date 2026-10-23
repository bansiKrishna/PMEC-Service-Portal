package com.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record TestEmailRequest(
        @Email(message = "Enter a valid recipient email address")
        @Size(max = 254)
        String recipientEmail
) {
}
