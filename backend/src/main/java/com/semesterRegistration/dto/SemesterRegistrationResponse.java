package com.semesterRegistration.dto;

import com.semesterRegistration.entity.RegistrationDocument;
import com.semesterRegistration.entity.RegistrationSubject;
import com.semesterRegistration.entity.SemesterRegistration;
import com.semesterRegistration.repository.RegistrationDocumentRepository;
import com.semesterRegistration.repository.RegistrationSubjectRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record SemesterRegistrationResponse(
        Long id,
        String applicationNumber,
        Long studentId,
        String studentName,
        String studentEmail,
        String rollNumber,
        Long branchId,
        String branchCode,
        String branchName,
        String academicYear,
        Integer semester,
        String section,
        String hostelName,
        String hostelRoom,
        BigDecimal collegeFeeDue,
        BigDecimal collegeFeePaid,
        BigDecimal collegeAdvance,
        BigDecimal hostelFeeDue,
        BigDecimal hostelFeePaid,
        BigDecimal hostelAdvance,
        BigDecimal messFeeDue,
        BigDecimal messFeePaid,
        BigDecimal messAdvance,
        String status,
        LocalDateTime submittedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<AcademicSubjectResponse> selectedSubjects,
        List<RegistrationDocumentResponse> documents
) {
    public static SemesterRegistrationResponse from(
            SemesterRegistration registration,
            RegistrationSubjectRepository subjectRepository,
            RegistrationDocumentRepository documentRepository
    ) {
        return from(
                registration,
                subjectRepository.findByRegistration_IdOrderBySubject_CodeAsc(
                        registration.getId()
                ),
                documentRepository.findByRegistration_IdOrderByUploadedAtDesc(
                        registration.getId()
                )
        );
    }

    public static SemesterRegistrationResponse from(
            SemesterRegistration registration,
            List<RegistrationSubject> subjectLinks,
            List<RegistrationDocument> registrationDocuments
    ) {
        return new SemesterRegistrationResponse(
                registration.getId(),
                registration.getApplicationNumber(),
                registration.getStudent().getId(),
                registration.getStudent().getFullName(),
                registration.getStudent().getEmail(),
                registration.getStudent().getRollNumber(),
                registration.getBranch().getId(),
                registration.getBranch().getCode(),
                registration.getBranch().getName(),
                registration.getAcademicYear(),
                registration.getSemester(),
                registration.getSection(),
                registration.getHostelName(),
                registration.getHostelRoom(),
                registration.getCollegeFeeDue(),
                registration.getCollegeFeePaid(),
                registration.getCollegeAdvance(),
                registration.getHostelFeeDue(),
                registration.getHostelFeePaid(),
                registration.getHostelAdvance(),
                registration.getMessFeeDue(),
                registration.getMessFeePaid(),
                registration.getMessAdvance(),
                registration.getStatus().name(),
                registration.getSubmittedAt(),
                registration.getCreatedAt(),
                registration.getUpdatedAt(),
                subjectLinks.stream()
                        .map(link -> AcademicSubjectResponse.from(
                                link.getSubject()
                        ))
                        .toList(),
                registrationDocuments.stream()
                        .map(RegistrationDocumentResponse::from)
                        .toList()
        );
    }
}
