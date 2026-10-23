package com.admin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveEmailServiceSettingsRequest(
        @NotBlank(message = "Gmail address is required")
        @Email(message = "Enter a valid Gmail address")
        @Size(max = 254)
        String gmailAddress,

        @Size(max = 256, message = "App Password must be no longer than 256 characters")
        String appPassword
) {
}
