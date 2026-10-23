
package com.semesterRegistration.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

/**
 * Subject selections required when submitting a registration.
 * The authenticated student must be determined by the backend,
 * not by a studentId supplied in this request.
 */
public record SubmitRegistrationRequest(

        @NotNull(message = "Registration ID is required.")
        @Positive(message = "Registration ID must be positive.")
        Long registrationId,

        @NotEmpty(message = "Select at least one subject.")
        List<
                @NotNull(message = "Subject ID cannot be null.")
                @Positive(message = "Subject ID must be positive.")
                        Long
                > subjectIds

) {
}
