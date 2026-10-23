
package com.semesterRegistration.repository;

import com.semesterRegistration.entity.RegistrationReview;
import com.semesterRegistration.enums.ReviewDecision;
import com.semesterRegistration.enums.ReviewRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegistrationReviewRepository
        extends JpaRepository<RegistrationReview, Long> {

    List<RegistrationReview>
    findByRegistration_IdOrderByCreatedAtDesc(Long registrationId);

    List<RegistrationReview>
    findByRegistration_IdAndReviewerRoleOrderByCreatedAtDesc(
            Long registrationId,
            ReviewRole reviewerRole
    );

    Optional<RegistrationReview>
    findFirstByRegistration_IdAndReviewerRoleOrderByCreatedAtDesc(
            Long registrationId,
            ReviewRole reviewerRole
    );

    boolean existsByRegistration_IdAndReviewerRoleAndDecision(
            Long registrationId,
            ReviewRole reviewerRole,
            ReviewDecision decision
    );
}


//What this repository does
//Method	Purpose
//findByRegistration_IdOrderByCreatedAtDesc()	Retrieves all review records for an application, newest first.
//findByRegistration_IdAndReviewerRoleOrderByCreatedAtDesc()	Retrieves the history for either the Librarian or DSW.
//findFirstByRegistration_IdAndReviewerRoleOrderByCreatedAtDesc()	Retrieves the latest review for a particular reviewer role.
//existsByRegistration_IdAndReviewerRoleAndDecision()	Checks whether a reviewer has recorded a particular decision.