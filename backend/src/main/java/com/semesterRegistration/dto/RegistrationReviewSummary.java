package com.semesterRegistration.dto;

public record RegistrationReviewSummary(
        long pending,
        long approved,
        long rejected,
        long total
) { }
