package com.semesterRegistration.service;

import com.semesterRegistration.entity.RegistrationReview;
import com.semesterRegistration.entity.SemesterRegistration;
import com.semesterRegistration.enums.RegistrationStatus;
import com.semesterRegistration.enums.ReviewDecision;
import com.semesterRegistration.enums.ReviewRole;
import com.semesterRegistration.repository.RegistrationReviewRepository;
import com.semesterRegistration.repository.SemesterRegistrationRepository;
import com.user.entity.Role;
import com.user.entity.User;
import com.user.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RegistrationReviewServiceTest {

    @Test
    void pendingQueueExcludesApplicationsNotAwaitingReview() {
        RegistrationReviewRepository reviewRepository =
                mock(RegistrationReviewRepository.class);
        RegistrationReviewService service = new RegistrationReviewService(
                reviewRepository,
                mock(SemesterRegistrationRepository.class),
                mock(UserRepository.class)
        );
        SemesterRegistration submitted = SemesterRegistration.builder()
                .id(1L)
                .status(RegistrationStatus.SUBMITTED)
                .build();
        SemesterRegistration needsRevision = SemesterRegistration.builder()
                .id(2L)
                .status(RegistrationStatus.REVISION_REQUIRED)
                .build();

        when(reviewRepository
                .findByReviewerRoleAndDecisionOrderByCreatedAtDesc(
                        ReviewRole.LIBRARIAN,
                        ReviewDecision.PENDING
                ))
                .thenReturn(List.of(
                        RegistrationReview.builder()
                                .registration(submitted)
                                .reviewerRole(ReviewRole.LIBRARIAN)
                                .decision(ReviewDecision.PENDING)
                                .build(),
                        RegistrationReview.builder()
                                .registration(needsRevision)
                                .reviewerRole(ReviewRole.LIBRARIAN)
                                .decision(ReviewDecision.PENDING)
                                .build()
                ));

        List<SemesterRegistration> result =
                service.getPendingRegistrations(ReviewRole.LIBRARIAN);

        assertEquals(List.of(1L), result.stream()
                .map(SemesterRegistration::getId)
                .toList());
    }

    @Test
    void completedReviewHistoryDoesNotDuplicateApplications() {
        RegistrationReviewRepository reviewRepository =
                mock(RegistrationReviewRepository.class);
        RegistrationReviewService service = new RegistrationReviewService(
                reviewRepository,
                mock(SemesterRegistrationRepository.class),
                mock(UserRepository.class)
        );
        SemesterRegistration registration = SemesterRegistration.builder()
                .id(3L)
                .status(RegistrationStatus.UNDER_REVIEW)
                .build();

        when(reviewRepository
                .findByReviewerRoleAndDecisionNotOrderByCreatedAtDesc(
                        ReviewRole.DSW,
                        ReviewDecision.PENDING
                ))
                .thenReturn(List.of(
                        RegistrationReview.builder()
                                .registration(registration)
                                .reviewerRole(ReviewRole.DSW)
                                .decision(ReviewDecision.APPROVED)
                                .build(),
                        RegistrationReview.builder()
                                .registration(registration)
                                .reviewerRole(ReviewRole.DSW)
                                .decision(ReviewDecision.REVISION_REQUESTED)
                                .build()
                ));

        List<SemesterRegistration> result =
                service.getCompletedRegistrations(ReviewRole.DSW);

        assertEquals(1, result.size());
        assertEquals(3L, result.get(0).getId());
    }

    @Test
    void reviewUpdatesPendingRecordInsteadOfLeavingItInTheQueue() {
        RegistrationReviewRepository reviewRepository =
                mock(RegistrationReviewRepository.class);
        SemesterRegistrationRepository registrationRepository =
                mock(SemesterRegistrationRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        RegistrationReviewService service = new RegistrationReviewService(
                reviewRepository,
                registrationRepository,
                userRepository
        );

        SemesterRegistration registration = SemesterRegistration.builder()
                .id(5L)
                .status(RegistrationStatus.SUBMITTED)
                .build();
        User reviewer = User.builder()
                .id(7L)
                .email("librarian@pmec.ac.in")
                .role(Role.LIBRARIAN)
                .build();
        RegistrationReview pendingReview = RegistrationReview.builder()
                .id(14L)
                .registration(registration)
                .reviewerRole(ReviewRole.LIBRARIAN)
                .decision(ReviewDecision.PENDING)
                .build();

        when(registrationRepository.findById(5L))
                .thenReturn(Optional.of(registration));
        when(userRepository.findById(7L)).thenReturn(Optional.of(reviewer));
        when(reviewRepository
                .findFirstByRegistration_IdAndReviewerRoleOrderByCreatedAtDesc(
                        5L,
                        ReviewRole.LIBRARIAN
                ))
                .thenReturn(Optional.of(pendingReview));
        when(reviewRepository.save(pendingReview)).thenReturn(pendingReview);

        RegistrationReview saved = service.submitReview(
                5L,
                7L,
                ReviewRole.LIBRARIAN,
                ReviewDecision.APPROVED,
                "Checked"
        );

        assertSame(pendingReview, saved);
        assertEquals(ReviewDecision.APPROVED, saved.getDecision());
        assertSame(reviewer, saved.getReviewer());
        assertNotNull(saved.getReviewedAt());
        verify(reviewRepository).save(pendingReview);
    }
}
