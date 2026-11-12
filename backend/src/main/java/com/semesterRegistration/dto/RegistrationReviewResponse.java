package com.semesterRegistration.dto;

import com.semesterRegistration.entity.RegistrationReview;
import com.semesterRegistration.enums.ReviewDecision;
import com.semesterRegistration.enums.ReviewRole;

import java.time.LocalDateTime;

public record RegistrationReviewResponse(
        Long id,
        ReviewRole reviewerRole,
        String reviewerName,
        ReviewDecision decision,
        String comments,
        LocalDateTime reviewedAt
) {
    public static RegistrationReviewResponse from(
            RegistrationReview review
    ) {
        return new RegistrationReviewResponse(
                review.getId(),
                review.getReviewerRole(),
                review.getReviewer() == null
                        ? null
                        : review.getReviewer().getFullName(),
                review.getDecision(),
                review.getComments(),
                review.getReviewedAt()
        );
    }
}
