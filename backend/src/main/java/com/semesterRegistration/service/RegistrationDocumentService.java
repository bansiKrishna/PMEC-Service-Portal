package com.semesterRegistration.service;

import com.semesterRegistration.dto.RegistrationDocumentResponse;
import com.semesterRegistration.entity.RegistrationDocument;
import com.semesterRegistration.entity.RegistrationDocument.DocumentType;
import com.semesterRegistration.entity.SemesterRegistration;
import com.semesterRegistration.repository.RegistrationDocumentRepository;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;

@Service
public class RegistrationDocumentService {

    private final SemesterRegistrationService registrationService;
    private final RegistrationDocumentRepository documentRepository;
    private final RegistrationDocumentStorageService storageService;

    public RegistrationDocumentService(
            SemesterRegistrationService registrationService,
            RegistrationDocumentRepository documentRepository,
            RegistrationDocumentStorageService storageService
    ) {
        this.registrationService = registrationService;
        this.documentRepository = documentRepository;
        this.storageService = storageService;
    }

    public RegistrationDocumentResponse upload(
            String authenticatedEmail,
            Long registrationId,
            DocumentType documentType,
            MultipartFile file
    ) {
        if (documentType == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Document type is required."
            );
        }

        SemesterRegistration registration =
                registrationService.getOwnedEditableRegistration(
                        authenticatedEmail,
                        registrationId
                );

        String originalFileName = safeFileName(file);
        RegistrationDocumentStorageService.StoredFile storedFile;
        try {
            storedFile = storageService.store(file);
        } catch (IOException ex) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "The receipt could not be stored.",
                    ex
            );
        }

        try {
            RegistrationDocument document =
                    documentRepository.saveAndFlush(
                            RegistrationDocument.builder()
                                    .registration(registration)
                                    .documentType(documentType)
                                    .originalFileName(originalFileName)
                                    .storagePath(storedFile.storagePath())
                                    .contentType(storedFile.contentType())
                                    .fileSizeBytes(storedFile.sizeBytes())
                                    .build()
                    );
            return RegistrationDocumentResponse.from(document);
        } catch (DataAccessException ex) {
            try {
                storageService.delete(storedFile.storagePath());
            } catch (IOException cleanupException) {
                ex.addSuppressed(cleanupException);
            }
            throw ex;
        }
    }

    @Transactional(readOnly = true)
    public List<RegistrationDocumentResponse> getDocuments(
            String authenticatedEmail,
            Long registrationId
    ) {
        registrationService.getOwnedRegistration(
                authenticatedEmail,
                registrationId
        );
        return documentRepository
                .findByRegistration_IdOrderByUploadedAtDesc(registrationId)
                .stream()
                .map(RegistrationDocumentResponse::from)
                .toList();
    }

    private String safeFileName(MultipartFile file) {
        if (file == null || file.getOriginalFilename() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A valid receipt filename is required."
            );
        }
        String suppliedName = file.getOriginalFilename().replace('\\', '/');
        String fileName = suppliedName.substring(
                suppliedName.lastIndexOf('/') + 1
        );
        if (fileName.isBlank() || fileName.length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Receipt filename must contain between 1 and 255 characters."
            );
        }
        return fileName;
    }
}
