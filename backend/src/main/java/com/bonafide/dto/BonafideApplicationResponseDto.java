package com.bonafide.dto;


import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class BonafideApplicationResponseDto {

    private Long id;

    private Long studentId;

    private String studentName;

    private String studentEmail;

    private String rollNumber;

    private String department;

    private Integer semester;

    private String phoneNumber;

    private String hostelName;

    private String roomNumber;

    private String reason;

    private String parentName;

    private LocalDate hostelAdmissionDate;

    private LocalDate collegeAdmissionDate;

    private String academicYear;

    private String status;

    private String rejectionReason;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}