package com.bonafide.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RejectBonafideRequestDto {
    @NotBlank
    private String reason;
}
