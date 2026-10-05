package com.admin.dto;

import com.user.entity.Role;
import jakarta.validation.constraints.NotNull;

public record SetStaffRoleRequest(
        @NotNull Role role
) {
}
