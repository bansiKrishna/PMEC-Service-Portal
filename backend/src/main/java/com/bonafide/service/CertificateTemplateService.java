package com.bonafide.service;

import com.bonafide.dto.CertificateTemplateResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CertificateTemplateService {

    CertificateTemplateResponseDto uploadTemplate(
            MultipartFile file,
            String templateName
    );

    CertificateTemplateResponseDto activateTemplate(
            Long id
    );

    List<CertificateTemplateResponseDto>
    getAllTemplates();

    void deleteTemplate(Long id);

    CertificateTemplateResponseDto uploadSignature(
            MultipartFile file
    );
}