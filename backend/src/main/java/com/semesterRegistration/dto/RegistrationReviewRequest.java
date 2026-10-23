
package com.semesterRegistration.dto;

import com.semesterRegistration.enums.ReviewDecision;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Reviewer's decision on an application.
 * Reviewer identity and review role must come from authentication,
 * never from client-supplied user or role IDs.
 */
public record RegistrationReviewRequest(

        @NotNull(message = "A review decision is required.")
        ReviewDecision decision,

        @Size(max = 2000, message = "Comments cannot exceed 2000 characters.")
        String comments

) {
}
