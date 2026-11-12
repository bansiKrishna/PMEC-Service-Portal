package com.bonafide.repository;

import com.bonafide.entity.BonafideApplication;
import com.bonafide.entity.BonafideStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface BonafideApplicationRepository
        extends JpaRepository<BonafideApplication, Long> {

    List<BonafideApplication> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "student")
    List<BonafideApplication> findByStatus(BonafideStatus status);

    @EntityGraph(attributePaths = "student")
    List<BonafideApplication> findByStatusInOrderByUpdatedAtDesc(
            List<BonafideStatus> statuses
    );

    @EntityGraph(attributePaths = "student")
    List<BonafideApplication> findByStudentId(Long studentId);

    @EntityGraph(attributePaths = "student")
    List<BonafideApplication> findByStatusInOrderByUpdatedAtDesc(
            Collection<BonafideStatus> statuses,
            Pageable pageable
    );

    @EntityGraph(attributePaths = "student")
    List<BonafideApplication> findByStudentIdOrderByCreatedAtDesc(
            Long studentId
    );

    @EntityGraph(attributePaths = "student")
    Optional<BonafideApplication> findWithStudentById(Long id);

    @Query("""
            select a.status, count(a)
            from BonafideApplication a
            where a.status in :statuses
            group by a.status
            """)
    List<Object[]> countGroupedByStatus(
            @Param("statuses") Collection<BonafideStatus> statuses
    );
}