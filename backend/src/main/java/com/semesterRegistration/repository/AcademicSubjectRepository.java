package com.semesterRegistration.repository;

import com.semesterRegistration.entity.AcademicSubject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AcademicSubjectRepository
        extends JpaRepository<AcademicSubject, Long> {

    List<AcademicSubject>
    findByBranch_IdAndAcademicYearAndSemesterAndActiveTrueOrderByCodeAsc(
            Long branchId,
            String academicYear,
            Integer semester
    );

    List<AcademicSubject>
    findByBranch_IdAndAcademicYearAndSemesterOrderByCodeAsc(
            Long branchId,
            String academicYear,
            Integer semester
    );

    Optional<AcademicSubject>
    findByBranch_IdAndAcademicYearAndSemesterAndCodeIgnoreCase(
            Long branchId,
            String academicYear,
            Integer semester,
            String code
    );

    boolean
    existsByBranch_IdAndAcademicYearAndSemesterAndCodeIgnoreCase(
            Long branchId,
            String academicYear,
            Integer semester,
            String code
    );
}

//
//What this repository does
//Method	                    Purpose
//First method	-Gets active subjects for a branch, year, and semester.
//Second method	-Gets all subjects, including inactive ones, for department management.
//Third method	-Finds a subject by its code within the selected branch, year, and semester.
//Fourth method	-Checks whether that subject code already exists.