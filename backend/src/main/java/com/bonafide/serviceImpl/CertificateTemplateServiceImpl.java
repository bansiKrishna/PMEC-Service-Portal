package com.bonafide.serviceImpl;

import com.bonafide.dto.CertificateTemplateResponseDto;
import com.bonafide.entity.CertificateSignature;
import com.bonafide.entity.CertificateTemplate;
import com.bonafide.repository.CertificateSignatureRepository;
import com.bonafide.repository.CertificateTemplateRepository;
import com.bonafide.service.CertificateTemplateService;
import com.exception.BadRequestException;
import com.exception.ResourceNotFoundException;
import com.file.FileStorageService;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CertificateTemplateServiceImpl
        implements CertificateTemplateService {

    private final CertificateTemplateRepository
            templateRepository;

    private final CertificateSignatureRepository
            signatureRepository;

    private final FileStorageService
            fileStorageService;

    @Override
    public CertificateTemplateResponseDto uploadTemplate(
            MultipartFile file,
            String templateName) {

        if (file.isEmpty()) {

            throw new BadRequestException(
                    "Template file is empty"
            );
        }

        String contentType =
                file.getContentType();

        if (contentType == null ||
                !(
                        contentType.equals("text/html")
                                ||
                                contentType.equals("text/plain")
                )) {

            throw new BadRequestException(
                    "Only HTML template files are allowed"
            );
        }

        try {

            String path =
                    fileStorageService.saveTemplate(
                            file
                    );

            Integer version =
                    templateRepository
                            .findAll()
                            .stream()
                            .map(CertificateTemplate::getVersion)
                            .max(Integer::compareTo)
                            .orElse(0)
                            + 1;

            boolean activateOnUpload =
                    templateRepository
                            .findFirstByActiveTrueOrderByVersionDesc()
                            .isEmpty();

            CertificateTemplate template =
                    CertificateTemplate.builder()
                            .templateName(templateName)
                            .fileName(
                                    file.getOriginalFilename()
                            )
                            .filePath(path)
                            .contentType(contentType)
                            .version(version)
                            .active(activateOnUpload)
                            .uploadedAt(
                                    LocalDateTime.now()
                            )
                            .build();

            CertificateTemplate saved =
                    templateRepository.save(template);

            return mapToResponse(saved);

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to upload template",
                    e
            );
        }
    }

    @Override
    public CertificateTemplateResponseDto
    activateTemplate(Long id) {

        CertificateTemplate selected =
                templateRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Template not found"
                                )
                        );

        /*
         * Deactivate all templates
         */

        List<CertificateTemplate> templates =
                templateRepository.findAll();

        for (CertificateTemplate template :
                templates) {

            template.setActive(false);
        }

        /*
         * Activate selected template
         */

        selected.setActive(true);

        templateRepository.saveAll(templates);

        return mapToResponse(selected);
    }

    @Override
    public List<CertificateTemplateResponseDto>
    getAllTemplates() {

        return templateRepository
                .findAllByOrderByVersionDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public void deleteTemplate(Long id) {

        CertificateTemplate template =
                templateRepository.findById(id)
                        .orElseThrow(() ->
                                new ResourceNotFoundException(
                                        "Template not found"
                                )
                        );

        if (template.isActive()) {

            throw new BadRequestException(
                    "Active template cannot be deleted"
            );
        }

        fileStorageService.deleteFile(
                template.getFilePath()
        );

        templateRepository.delete(template);
    }

    @Override
    public CertificateTemplateResponseDto
    uploadSignature(MultipartFile file) {

        if (file.isEmpty()) {

            throw new BadRequestException(
                    "Signature file is empty"
            );
        }

        String contentType =
                file.getContentType();

        if (contentType == null ||
                !contentType.startsWith("image/")) {

            throw new BadRequestException(
                    "Signature must be an image"
            );
        }

        try {

            /*
             * Deactivate previous signatures
             */

            signatureRepository
                    .findAll()
                    .forEach(signature -> {
                        signature.setActive(false);
                    });

            /*
             * Save new signature
             */

            String path =
                    fileStorageService.saveSignature(
                            file
                    );

            CertificateSignature signature =
                    CertificateSignature.builder()
                            .fileName(
                                    file.getOriginalFilename()
                            )
                            .filePath(path)
                            .contentType(contentType)
                            .active(true)
                            .uploadedAt(
                                    LocalDateTime.now()
                            )
                            .build();

            signatureRepository.save(signature);

            /*
             * We don't want to expose signature
             * as a template DTO.
             */

            return CertificateTemplateResponseDto
                    .builder()
                    .fileName(
                            file.getOriginalFilename()
                    )
                    .active(true)
                    .uploadedAt(
                            LocalDateTime.now()
                    )
                    .build();

        } catch (Exception e) {

            throw new RuntimeException(
                    "Failed to upload signature",
                    e
            );
        }
    }

    private CertificateTemplateResponseDto
    mapToResponse(
            CertificateTemplate template) {

        return CertificateTemplateResponseDto
                .builder()
                .id(template.getId())
                .templateName(
                        template.getTemplateName()
                )
                .fileName(
                        template.getFileName()
                )
                .version(
                        template.getVersion()
                )
                .active(
                        template.isActive()
                )
                .uploadedAt(
                        template.getUploadedAt()
                )
                .build();
    }
}