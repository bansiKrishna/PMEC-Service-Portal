package com.bonafide.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class CertificateTemplateResponseDto {

    private Long id;

    private String templateName;

    private String fileName;

    private Integer version;

    private boolean active;

    private LocalDateTime uploadedAt;
}