package com.bonafide.controller;

import com.bonafide.dto.CertificateTemplateResponseDto;
import com.bonafide.service.CertificateTemplateService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/certificate-templates")
@RequiredArgsConstructor
public class CertificateTemplateController {

    private final CertificateTemplateService templateService;

    @PostMapping(
            value = "/upload",
            consumes = "multipart/form-data"
    )
    public ResponseEntity<CertificateTemplateResponseDto>
    uploadTemplate(
            @RequestParam("file")
            MultipartFile file,

            @RequestParam("templateName")
            String templateName) {

        return ResponseEntity.ok(
                templateService.uploadTemplate(
                        file,
                        templateName
                )
        );
    }

    @GetMapping
    public ResponseEntity<List<CertificateTemplateResponseDto>>
    getTemplates() {

        return ResponseEntity.ok(
                templateService.getAllTemplates()
        );
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<CertificateTemplateResponseDto>
    activateTemplate(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                templateService.activateTemplate(id)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void>
    deleteTemplate(
            @PathVariable Long id) {

        templateService.deleteTemplate(id);

        return ResponseEntity.noContent().build();
    }

    @PostMapping(
            value = "/signature",
            consumes = "multipart/form-data"
    )
    public ResponseEntity<CertificateTemplateResponseDto>
    uploadSignature(
            @RequestParam("file")
            MultipartFile file) {

        return ResponseEntity.ok(
                templateService.uploadSignature(file)
        );
    }
}