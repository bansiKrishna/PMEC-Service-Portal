
package com.semesterRegistration.service;

import com.semesterRegistration.entity.RegistrationReview;
import com.semesterRegistration.entity.SemesterRegistration;
import com.semesterRegistration.dto.RegistrationReviewResponse;
import com.semesterRegistration.dto.RegistrationReviewListItem;
import com.semesterRegistration.dto.RegistrationReviewSummary;
import com.semesterRegistration.enums.RegistrationStatus;
import com.semesterRegistration.enums.ReviewDecision;
import com.semesterRegistration.enums.ReviewRole;
import com.semesterRegistration.enums.ReviewTab;
import com.semesterRegistration.enums.ReviewViewer;
import com.semesterRegistration.repository.RegistrationReviewRepository;
import com.semesterRegistration.repository.SemesterRegistrationRepository;
import com.user.entity.User;
import com.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class RegistrationReviewService {
    private static final int LIST_LIMIT = 1_000;

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

    public static ReviewTab classify(
            ReviewDecision decision,
            RegistrationStatus status
    ) {
        if (decision == ReviewDecision.APPROVED) {
            return ReviewTab.APPROVED;
        }
        if (decision == ReviewDecision.REJECTED
                || decision == ReviewDecision.REVISION_REQUESTED) {
            return ReviewTab.REJECTED;
        }
        if (decision == ReviewDecision.PENDING
                && (status == RegistrationStatus.SUBMITTED
                || status == RegistrationStatus.UNDER_REVIEW)) {
            return ReviewTab.PENDING;
        }
        return null;
    }

    public static ReviewTab principalTab(RegistrationStatus status) {
        return switch (status) {
            case SUBMITTED, UNDER_REVIEW -> ReviewTab.PENDING;
            case APPROVED -> ReviewTab.APPROVED;
            case REVISION_REQUIRED -> ReviewTab.REJECTED;
            default -> null;
        };
    }

    @Transactional(readOnly = true)
    public List<RegistrationReviewListItem> getReviewList(
            ReviewViewer viewer,
            ReviewTab tab
    ) {
        if (viewer == ReviewViewer.PRINCIPAL) {
            return registrationRepository
                    .findByStatusInOrderByUpdatedAtDesc(
                            statusesFor(tab),
                            PageRequest.of(0, LIST_LIMIT)
                    )
                    .stream()
                    .map(registration -> {
                        ReviewTab classified = principalTab(
                                registration.getStatus()
                        );
                        return classified == null
                                || (tab != ReviewTab.ALL && classified != tab)
                                ? null
                                : toListItem(
                                        registration,
                                        null,
                                        classified
                                );
                    })
                    .filter(java.util.Objects::nonNull)
                    .toList();
        }

        ReviewRole role = viewer == ReviewViewer.LIBRARIAN
                ? ReviewRole.LIBRARIAN
                : ReviewRole.DSW;
        return reviewRepository.findLatestByRole(role, PageRequest.of(0, LIST_LIMIT))
                .stream()
                .map(review -> {
                    SemesterRegistration registration = review.getRegistration();
                    ReviewTab classified = classify(
                            review.getDecision(),
                            registration.getStatus()
                    );
                    return classified == null
                            || (tab != ReviewTab.ALL && classified != tab)
                            ? null
                            : toListItem(registration, review, classified);
                })
                .filter(java.util.Objects::nonNull)
                .toList();
    }

    @Transactional(readOnly = true)
    public RegistrationReviewSummary getReviewSummary(ReviewViewer viewer) {
        Map<ReviewTab, Long> counts = new EnumMap<>(ReviewTab.class);
        counts.put(ReviewTab.PENDING, 0L);
        counts.put(ReviewTab.APPROVED, 0L);
        counts.put(ReviewTab.REJECTED, 0L);

        if (viewer == ReviewViewer.PRINCIPAL) {
            for (Object[] row : registrationRepository.countGroupedByStatus(
                    statusesFor(ReviewTab.ALL)
            )) {
                ReviewTab tab = principalTab((RegistrationStatus) row[0]);
                addCount(counts, tab, (Number) row[1]);
            }
        } else {
            ReviewRole role = viewer == ReviewViewer.LIBRARIAN
                    ? ReviewRole.LIBRARIAN
                    : ReviewRole.DSW;
            for (Object[] row : reviewRepository.countLatestByRole(role)) {
                RegistrationStatus status = (RegistrationStatus) row[1];
                if (status == RegistrationStatus.DRAFT) {
                    continue;
                }
                ReviewTab tab = classify(
                        (ReviewDecision) row[0],
                        status
                );
                addCount(counts, tab, (Number) row[2]);
            }
        }

        long pending = counts.get(ReviewTab.PENDING);
        long approved = counts.get(ReviewTab.APPROVED);
        long rejected = counts.get(ReviewTab.REJECTED);
        return new RegistrationReviewSummary(
                pending,
                approved,
                rejected,
                pending + approved + rejected
        );
    }

    private void addCount(
            Map<ReviewTab, Long> counts,
            ReviewTab tab,
            Number count
    ) {
        if (tab != null) {
            counts.merge(tab, count.longValue(), Long::sum);
        }
    }

    private Set<RegistrationStatus> statusesFor(ReviewTab tab) {
        return switch (tab) {
            case ALL -> EnumSet.of(
                    RegistrationStatus.SUBMITTED,
                    RegistrationStatus.UNDER_REVIEW,
                    RegistrationStatus.APPROVED,
                    RegistrationStatus.REVISION_REQUIRED
            );
            case PENDING -> EnumSet.of(
                    RegistrationStatus.SUBMITTED,
                    RegistrationStatus.UNDER_REVIEW
            );
            case APPROVED -> EnumSet.of(RegistrationStatus.APPROVED);
            case REJECTED -> EnumSet.of(RegistrationStatus.REVISION_REQUIRED);
        };
    }

    private RegistrationReviewListItem toListItem(
            SemesterRegistration registration,
            RegistrationReview review,
            ReviewTab tab
    ) {
        return new RegistrationReviewListItem(
                registration.getId(),
                registration.getApplicationNumber(),
                registration.getStudent().getId(),
                registration.getStudent().getFullName(),
                registration.getStudent().getEmail(),
                registration.getStudent().getRollNumber(),
                registration.getBranch().getCode(),
                registration.getBranch().getName(),
                registration.getAcademicYear(),
                registration.getSemester(),
                registration.getSection(),
                registration.getStatus().name(),
                review == null ? null : review.getDecision().name(),
                tab.name(),
                registration.getSubmittedAt(),
                review == null ? null : review.getReviewedAt()
        );
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

    @Transactional(readOnly = true)
    public List<RegistrationReviewResponse> getReviewHistoryResponse(
            Long registrationId
    ) {
        if (!registrationRepository.existsById(registrationId)) {
            throw new IllegalArgumentException(
                    "Registration not found: " + registrationId
            );
        }
        return reviewRepository
                .findByRegistration_IdOrderByCreatedAtDesc(registrationId)
                .stream()
                .map(RegistrationReviewResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SemesterRegistration> getPendingRegistrations(
            ReviewRole reviewerRole
    ) {
        return uniqueRegistrations(
                reviewRepository
                        .findByReviewerRoleAndDecisionOrderByCreatedAtDesc(
                                reviewerRole,
                                ReviewDecision.PENDING
                        )
                        .stream()
                        .filter(review -> review.getRegistration().getStatus()
                                == RegistrationStatus.SUBMITTED
                                || review.getRegistration().getStatus()
                                == RegistrationStatus.UNDER_REVIEW)
                        .toList()
        );
    }

    @Transactional(readOnly = true)
    public List<SemesterRegistration> getCompletedRegistrations(
            ReviewRole reviewerRole
    ) {
        return uniqueRegistrations(
                reviewRepository
                        .findByReviewerRoleAndDecisionNotOrderByCreatedAtDesc(
                                reviewerRole,
                                ReviewDecision.PENDING
                        )
        );
    }

    private List<SemesterRegistration> uniqueRegistrations(
            List<RegistrationReview> reviews
    ) {
        Map<Long, SemesterRegistration> registrations = new LinkedHashMap<>();
        for (RegistrationReview review : reviews) {
            SemesterRegistration registration = review.getRegistration();
            registrations.putIfAbsent(registration.getId(), registration);
        }
        return List.copyOf(registrations.values());
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
