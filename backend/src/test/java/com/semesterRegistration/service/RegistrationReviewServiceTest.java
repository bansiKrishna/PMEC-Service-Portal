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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RegistrationReviewServiceTest {

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
