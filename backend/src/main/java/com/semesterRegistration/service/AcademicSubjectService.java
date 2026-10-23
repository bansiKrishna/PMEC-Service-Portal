package com.semesterRegistration.service;

import com.semesterRegistration.dto.AcademicSubjectResponse;
import com.semesterRegistration.entity.AcademicSubject;
import com.semesterRegistration.entity.Branch;
import com.semesterRegistration.repository.AcademicSubjectRepository;
import com.semesterRegistration.repository.BranchRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Service
public class AcademicSubjectService {

    private final AcademicSubjectRepository subjectRepository;
    private final BranchRepository branchRepository;

    public AcademicSubjectService(
            AcademicSubjectRepository subjectRepository,
            BranchRepository branchRepository
    ) {
        this.subjectRepository = subjectRepository;
        this.branchRepository = branchRepository;
    }

    // Creates a subject for a particular branch and semester.
    @Transactional
    public AcademicSubject createSubject(
            Long branchId,
            String academicYear,
            Integer semester,
            String code,
            String name,
            AcademicSubject.SubjectType subjectType,
            BigDecimal credits,
            boolean compulsory
    ) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Branch not found with ID: " + branchId
                ));

        if (!branch.isActive()) {
            throw new IllegalArgumentException(
                    "Cannot add subjects to an inactive branch."
            );
        }

        String normalizedYear =
                normalizeRequired(academicYear, "Academic year");

        String normalizedCode =
                normalizeRequired(code, "Subject code")
                        .toUpperCase(Locale.ROOT);

        String normalizedName =
                normalizeRequired(name, "Subject name");

        validateAcademicYear(normalizedYear);

        if (semester == null || semester < 1 || semester > 10) {
            throw new IllegalArgumentException(
                    "Semester must be between 1 and 10."
            );
        }

        if (subjectType == null) {
            throw new IllegalArgumentException(
                    "Subject type is required."
            );
        }

        if (credits != null
                && credits.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Credits cannot be negative."
            );
        }

        if (subjectRepository
                .existsByBranch_IdAndAcademicYearAndSemesterAndCodeIgnoreCase(
                        branchId,
                        normalizedYear,
                        semester,
                        normalizedCode
                )) {
            throw new IllegalArgumentException(
                    "This subject code already exists for the selected "
                            + "branch, academic year, and semester."
            );
        }

        AcademicSubject subject = AcademicSubject.builder()
                .branch(branch)
                .academicYear(normalizedYear)
                .semester(semester)
                .code(normalizedCode)
                .name(normalizedName)
                .subjectType(subjectType)
                .credits(credits)
                .compulsory(compulsory)
                .active(true)
                .build();

        return subjectRepository.save(subject);
    }

    // Returns active subjects as DTOs to avoid lazy-loading
    // errors when Spring serializes the HTTP response.
    @Transactional(readOnly = true)
    public List<AcademicSubjectResponse> getActiveSubjects(
            Long branchId,
            String academicYear,
            Integer semester
    ) {
        validateSelection(branchId, academicYear, semester);

        return subjectRepository
                .findByBranch_IdAndAcademicYearAndSemesterAndActiveTrueOrderByCodeAsc(
                        branchId,
                        academicYear.trim(),
                        semester
                )
                .stream()
                .map(AcademicSubjectResponse::from)
                .toList();
    }

    // Returns active and inactive subjects for authorized management users.
    @Transactional(readOnly = true)
    public List<AcademicSubjectResponse> getAllSubjects(
            Long branchId,
            String academicYear,
            Integer semester
    ) {
        validateSelection(branchId, academicYear, semester);

        return subjectRepository
                .findByBranch_IdAndAcademicYearAndSemesterOrderByCodeAsc(
                        branchId,
                        academicYear.trim(),
                        semester
                )
                .stream()
                .map(AcademicSubjectResponse::from)
                .toList();
    }

    // Activates or deactivates a subject without deleting its history.
    @Transactional
    public AcademicSubject setSubjectActive(
            Long subjectId,
            boolean active
    ) {
        AcademicSubject subject = subjectRepository.findById(subjectId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Subject not found with ID: " + subjectId
                ));

        if (active && !subject.getBranch().isActive()) {
            throw new IllegalArgumentException(
                    "Cannot activate a subject for an inactive branch."
            );
        }

        subject.setActive(active);

        return subjectRepository.save(subject);
    }

    private void validateSelection(
            Long branchId,
            String academicYear,
            Integer semester
    ) {
        if (branchId == null
                || !branchRepository.existsById(branchId)) {
            throw new IllegalArgumentException(
                    "A valid branch ID is required."
            );
        }

        String normalizedYear =
                normalizeRequired(academicYear, "Academic year");

        validateAcademicYear(normalizedYear);

        if (semester == null || semester < 1 || semester > 10) {
            throw new IllegalArgumentException(
                    "Semester must be between 1 and 10."
            );
        }
    }

    private void validateAcademicYear(String academicYear) {
        if (!academicYear.matches("\\d{4}-\\d{4}")) {
            throw new IllegalArgumentException(
                    "Academic year must use the format YYYY-YYYY."
            );
        }

        String[] years = academicYear.split("-");

        if (Integer.parseInt(years[1])
                != Integer.parseInt(years[0]) + 1) {
            throw new IllegalArgumentException(
                    "The academic year must cover consecutive years."
            );
        }
    }

    private String normalizeRequired(
            String value,
            String fieldName
    ) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(
                    fieldName + " is required."
            );
        }

        return value.trim();
    }
}
