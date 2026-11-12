
package com.semesterRegistration.repository;

import com.semesterRegistration.entity.RegistrationReview;
import com.semesterRegistration.enums.ReviewDecision;
import com.semesterRegistration.enums.ReviewRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RegistrationReviewRepository
        extends JpaRepository<RegistrationReview, Long> {

    @EntityGraph(attributePaths = "reviewer")
    List<RegistrationReview>
    findByRegistration_IdOrderByCreatedAtDesc(Long registrationId);

    List<RegistrationReview>
    findByRegistration_IdAndReviewerRoleOrderByCreatedAtDesc(
            Long registrationId,
            ReviewRole reviewerRole
    );

    @EntityGraph(attributePaths = "registration")
    List<RegistrationReview>
    findByReviewerRoleAndDecisionOrderByCreatedAtDesc(
            ReviewRole reviewerRole,
            ReviewDecision decision
    );

    @EntityGraph(attributePaths = "registration")
    List<RegistrationReview>
    findByReviewerRoleAndDecisionNotOrderByCreatedAtDesc(
            ReviewRole reviewerRole,
            ReviewDecision decision
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

    boolean existsByRegistration_IdAndReviewerRole(
            Long registrationId,
            ReviewRole reviewerRole
    );

    @Query("""
            select r from RegistrationReview r
              join fetch r.registration reg
              join fetch reg.student
              join fetch reg.branch
            where r.reviewerRole = :role
              and reg.status <> com.semesterRegistration.enums.RegistrationStatus.DRAFT
              and r.id = (select max(r2.id) from RegistrationReview r2
                          where r2.registration.id = reg.id and r2.reviewerRole = :role)
            order by r.id desc
            """)
    List<RegistrationReview> findLatestByRole(
            @Param("role") ReviewRole role,
            Pageable pageable
    );

    @Query("""
            select r.decision, reg.status, count(r) from RegistrationReview r
              join r.registration reg
            where r.reviewerRole = :role
              and r.id = (select max(r2.id) from RegistrationReview r2
                          where r2.registration.id = reg.id and r2.reviewerRole = :role)
            group by r.decision, reg.status
            """)
    List<Object[]> countLatestByRole(@Param("role") ReviewRole role);
}


//What this repository does
//Method	Purpose
//findByRegistration_IdOrderByCreatedAtDesc()	Retrieves all review records for an application, newest first.
//findByRegistration_IdAndReviewerRoleOrderByCreatedAtDesc()	Retrieves the history for either the Librarian or DSW.
//findFirstByRegistration_IdAndReviewerRoleOrderByCreatedAtDesc()	Retrieves the latest review for a particular reviewer role.
//existsByRegistration_IdAndReviewerRoleAndDecision()	Checks whether a reviewer has recorded a particular decision.