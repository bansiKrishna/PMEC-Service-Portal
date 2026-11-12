package com.semesterRegistration.dto;

import java.time.LocalDateTime;

public record RegistrationReviewListItem(
        Long id,
        String applicationNumber,
        Long studentId,
        String studentName,
        String studentEmail,
        String rollNumber,
        String branchCode,
        String branchName,
        String academicYear,
        Integer semester,
        String section,
        String status,
        String reviewDecision,
        String reviewTab,
        LocalDateTime submittedAt,
        LocalDateTime reviewedAt
) { }
