package com.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SetStaffPasswordRequest(
        @NotBlank
        @Size(min = 8, max = 72)
        String password
) {
}