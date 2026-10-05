package com.bonafide.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BonafideApplicationRequestDto {

    @NotBlank
    private String phoneNumber;

    private String hostelName;

    private String roomNumber;

    @NotBlank
    private String reason;

    @NotBlank
    private String parentName;

    private LocalDate hostelAdmissionDate;

    @NotNull
    private LocalDate collegeAdmissionDate;

    @NotBlank
    private String academicYear;
}