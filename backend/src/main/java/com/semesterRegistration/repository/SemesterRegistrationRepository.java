
package com.semesterRegistration.repository;

import com.semesterRegistration.entity.SemesterRegistration;
import com.semesterRegistration.enums.RegistrationStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

public interface SemesterRegistrationRepository
        extends JpaRepository<SemesterRegistration, Long> {

    List<SemesterRegistration> findByStudent_IdOrderByCreatedAtDesc(
            Long studentId
    );

    @EntityGraph(attributePaths = {"student", "branch"})
    List<SemesterRegistration> findByIdIn(Collection<Long> ids);

    List<SemesterRegistration>
    findByStudent_IdAndBranch_IdOrderByCreatedAtDesc(
            Long studentId,
            Long branchId
    );

    Optional<SemesterRegistration>
    findByStudent_IdAndAcademicYearAndSemester(
            Long studentId,
            String academicYear,
            Integer semester
    );

    List<SemesterRegistration>
    findByBranch_IdAndAcademicYearAndSemesterOrderByCreatedAtDesc(
            Long branchId,
            String academicYear,
            Integer semester
    );

    List<SemesterRegistration>
    findByBranch_IdAndStatusOrderByCreatedAtDesc(
            Long branchId,
            RegistrationStatus status
    );

    List<SemesterRegistration>
    findByBranch_IdAndAcademicYearAndSemesterAndStatusOrderByCreatedAtDesc(
            Long branchId,
            String academicYear,
            Integer semester,
            RegistrationStatus status
    );

    boolean existsByStudent_IdAndAcademicYearAndSemester(
            Long studentId,
            String academicYear,
            Integer semester
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select registration
            from SemesterRegistration registration
            where registration.id = :registrationId
            """)
    Optional<SemesterRegistration> findByIdForUpdate(
            @Param("registrationId") Long registrationId
    );
}
//
//
//What these methods do
//              Method	                                                                         Purpose
//findByStudent_IdOrderByCreatedAtDesc()	                                Lists a student's applications, newest first.
//findByStudent_IdAndAcademicYearAndSemester()	                            Finds a student's registration for a particular semester.
//findByBranch_IdAndAcademicYearAndSemesterOrderByCreatedAtDesc()	        Lists registrations for a department, year and semester.
//findByBranch_IdAndStatusOrderByCreatedAtDesc()	                        Filters a department's registrations by status.
//findByBranch_IdAndAcademicYearAndSemesterAndStatusOrderByCreatedAtDesc()	Filters by department, year, semester and status.
//existsByStudent_IdAndAcademicYearAndSemester()	                        Checks whether the student already has a registration for that semester.