package com.semesterRegistration.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public record SubjectSelectionRequest(
        @NotEmpty(message = "Select at least one subject.")
        List<
                @NotNull(message = "Subject ID cannot be null.")
                @Positive(message = "Subject ID must be positive.")
                        Long
                > subjectIds
) {
}
