
package com.semesterRegistration.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for creating a branch staff account.
 */
public record CreateBranchStaffRequest(

        @NotBlank(message = "Full name is required.")
        @Size(max = 150, message = "Full name is too long.")
        String fullName,

        @NotBlank(message = "Email is required.")
        @Email(message = "Enter a valid email address.")
        @Size(max = 254)
        String email,

        @NotBlank(message = "Password is required.")
        @Size(
                min = 12,
                max = 72,
                message = "Password must contain 12 to 72 characters."
        )
        String password

) {
}
