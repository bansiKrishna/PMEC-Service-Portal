
package com.semesterRegistration.service;

import com.semesterRegistration.entity.RegistrationReview;
import com.semesterRegistration.entity.SemesterRegistration;
import com.semesterRegistration.enums.RegistrationStatus;
import com.semesterRegistration.enums.ReviewDecision;
import com.semesterRegistration.enums.ReviewRole;
import com.semesterRegistration.repository.RegistrationReviewRepository;
import com.semesterRegistration.repository.SemesterRegistrationRepository;
import com.user.entity.User;
import com.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistrationReviewService {

    private final RegistrationReviewRepository reviewRepository;
    private final SemesterRegistrationRepository registrationRepository;
    private final UserRepository userRepository;

    public RegistrationReviewService(
            RegistrationReviewRepository reviewRepository,
            SemesterRegistrationRepository registrationRepository,
            UserRepository userRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.registrationRepository = registrationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public RegistrationReview submitReview(
            Long registrationId,
            Long reviewerUserId,
            ReviewRole reviewerRole,
            ReviewDecision decision,
            String comments
    ) {
        if (reviewerRole == null || decision == null) {
            throw new IllegalArgumentException(
                    "Reviewer role and decision are required."
            );
        }

        if (decision == ReviewDecision.PENDING) {
            throw new IllegalArgumentException(
                    "A submitted review cannot have PENDING as its decision."
            );
        }

        SemesterRegistration registration =
                registrationRepository.findById(registrationId)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Registration not found: " + registrationId
                        ));

        User reviewer = userRepository.findById(reviewerUserId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Reviewer not found: " + reviewerUserId
                ));

        if (registration.getStatus() != RegistrationStatus.SUBMITTED
                && registration.getStatus()
                != RegistrationStatus.UNDER_REVIEW) {
            throw new IllegalStateException(
                    "This registration is not currently awaiting review."
            );
        }

        String normalizedComments = normalizeComments(comments);
        RegistrationReview review = reviewRepository
                .findFirstByRegistration_IdAndReviewerRoleOrderByCreatedAtDesc(
                        registrationId,
                        reviewerRole
                )
                .filter(latest -> latest.getDecision() == ReviewDecision.PENDING)
                .map(pending -> {
                    pending.setReviewer(reviewer);
                    pending.setDecision(decision);
                    pending.setComments(normalizedComments);
                    pending.setReviewedAt(LocalDateTime.now());
                    return pending;
                })
                .orElseGet(() -> RegistrationReview.builder()
                        .registration(registration)
                        .reviewerRole(reviewerRole)
                        .reviewer(reviewer)
                        .decision(decision)
                        .comments(normalizedComments)
                        .reviewedAt(LocalDateTime.now())
                        .build());

        RegistrationReview savedReview = reviewRepository.save(review);

        registration.setStatus(
                determineRegistrationStatus(registrationId, savedReview)
        );

        registrationRepository.save(registration);

        return savedReview;
    }

    @Transactional(readOnly = true)
    public List<RegistrationReview> getReviewHistory(Long registrationId) {
        if (!registrationRepository.existsById(registrationId)) {
            throw new IllegalArgumentException(
                    "Registration not found: " + registrationId
            );
        }

        return reviewRepository
                .findByRegistration_IdOrderByCreatedAtDesc(registrationId);
    }

    private RegistrationStatus determineRegistrationStatus(
            Long registrationId,
            RegistrationReview currentReview
    ) {
        if (currentReview.getDecision() == ReviewDecision.REVISION_REQUESTED) {
            return RegistrationStatus.REVISION_REQUIRED;
        }

        if (currentReview.getDecision() == ReviewDecision.REJECTED) {
            return RegistrationStatus.REVISION_REQUIRED;
        }

        boolean librarianApproved =
                hasLatestApproval(registrationId, ReviewRole.LIBRARIAN);

        boolean dswApproved =
                hasLatestApproval(registrationId, ReviewRole.DSW);

        if (librarianApproved && dswApproved) {
            return RegistrationStatus.APPROVED;
        }

        return RegistrationStatus.UNDER_REVIEW;
    }

    private boolean hasLatestApproval(
            Long registrationId,
            ReviewRole role
    ) {
        return reviewRepository
                .findFirstByRegistration_IdAndReviewerRoleOrderByCreatedAtDesc(
                        registrationId, role
                )
                .map(review -> review.getDecision() == ReviewDecision.APPROVED)
                .orElse(false);
    }

    private String normalizeComments(String comments) {
        if (comments == null || comments.isBlank()) {
            return null;
        }

        String normalized = comments.trim();

        if (normalized.length() > 2000) {
            throw new IllegalArgumentException(
                    "Review comments cannot exceed 2000 characters."
            );
        }

        return normalized;
    }
}
