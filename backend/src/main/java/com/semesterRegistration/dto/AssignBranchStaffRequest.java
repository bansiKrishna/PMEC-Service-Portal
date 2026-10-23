
package com.semesterRegistration.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * Request body for assigning an existing user to a branch.
 */
public record AssignBranchStaffRequest(

        @NotNull(message = "User ID is required.")
        @Positive(message = "User ID must be positive.")
        Long userId

) {
}
