package com.semesterRegistration.controller;

import com.semesterRegistration.dto.AcademicSubjectResponse;
import com.semesterRegistration.entity.AcademicSubject;
import com.semesterRegistration.service.AcademicSubjectService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/semester-registration/subjects")
public class AcademicSubjectController {

    private final AcademicSubjectService subjectService;

    public AcademicSubjectController(
            AcademicSubjectService subjectService
    ) {
        this.subjectService = subjectService;
    }

    // Get active subjects for the student registration form.
    @GetMapping
    public ResponseEntity<List<AcademicSubjectResponse>> getActiveSubjects(
            @RequestParam Long branchId,
            @RequestParam String academicYear,
            @RequestParam Integer semester
    ) {
        return ResponseEntity.ok(
                subjectService.getActiveSubjects(
                        branchId,
                        academicYear,
                        semester
                )
        );
    }

    // Get all subjects, including inactive ones, for management.
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AcademicSubjectResponse>> getAllSubjects(
            @RequestParam Long branchId,
            @RequestParam String academicYear,
            @RequestParam Integer semester
    ) {
        return ResponseEntity.ok(
                subjectService.getAllSubjects(
                        branchId,
                        academicYear,
                        semester
                )
        );
    }

    // Create a subject or lab.
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AcademicSubjectResponse> createSubject(
            @RequestBody CreateSubjectRequest request
    ) {
        AcademicSubject subject = subjectService.createSubject(
                request.branchId(),
                request.academicYear(),
                request.semester(),
                request.code(),
                request.name(),
                request.subjectType(),
                request.credits(),
                request.compulsory()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(AcademicSubjectResponse.from(subject));
    }

    // Activate or deactivate a subject.
    @PatchMapping("/{subjectId}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AcademicSubjectResponse> setSubjectActive(
            @PathVariable Long subjectId,
            @RequestBody SetActiveRequest request
    ) {
        AcademicSubject subject = subjectService.setSubjectActive(
                subjectId,
                request.active()
        );

        return ResponseEntity.ok(
                AcademicSubjectResponse.from(subject)
        );
    }

    // Request payload for creating a subject.
    public record CreateSubjectRequest(
            Long branchId,
            String academicYear,
            Integer semester,
            String code,
            String name,
            AcademicSubject.SubjectType subjectType,
            BigDecimal credits,
            boolean compulsory
    ) {
    }

    // Request payload for activating or deactivating a subject.
    public record SetActiveRequest(
            boolean active
    ) {
    }
}
