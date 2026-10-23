package com.semesterRegistration.dto;

import com.semesterRegistration.entity.RegistrationDocument;

import java.time.LocalDateTime;

public record RegistrationDocumentResponse(
        Long id,
        RegistrationDocument.DocumentType documentType,
        String originalFileName,
        String contentType,
        Long fileSizeBytes,
        LocalDateTime uploadedAt
) {
    public static RegistrationDocumentResponse from(
            RegistrationDocument document
    ) {
        return new RegistrationDocumentResponse(
                document.getId(),
                document.getDocumentType(),
                document.getOriginalFileName(),
                document.getContentType(),
                document.getFileSizeBytes(),
                document.getUploadedAt()
        );
    }
}
