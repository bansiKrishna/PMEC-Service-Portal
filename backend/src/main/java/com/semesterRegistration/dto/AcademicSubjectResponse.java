package com.semesterRegistration.dto;

import com.semesterRegistration.entity.AcademicSubject;
import java.math.BigDecimal;

public record AcademicSubjectResponse(
        Long id,
        Long branchId,
        String branchCode,
        String branchName,
        String academicYear,
        Integer semester,
        String code,
        String name,
        String subjectType,
        BigDecimal credits,
        Boolean compulsory,
        Boolean active
) {
    public static AcademicSubjectResponse from(
            AcademicSubject subject
    ) {
        return new AcademicSubjectResponse(
                subject.getId(),
                subject.getBranch().getId(),
                subject.getBranch().getCode(),
                subject.getBranch().getName(),
                subject.getAcademicYear(),
                subject.getSemester(),
                subject.getCode(),
                subject.getName(),
                subject.getSubjectType().name(),
                subject.getCredits(),
                subject.isCompulsory(),
                subject.isActive()
        );
    }
}