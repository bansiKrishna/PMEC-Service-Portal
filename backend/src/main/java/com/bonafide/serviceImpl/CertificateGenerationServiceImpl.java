package com.bonafide.serviceImpl;

import com.bonafide.entity.BonafideApplication;
import com.bonafide.entity.CertificateSignature;
import com.bonafide.entity.CertificateTemplate;
import com.bonafide.entity.GeneratedCertificate;
import com.bonafide.repository.CertificateSignatureRepository;
import com.bonafide.repository.CertificateTemplateRepository;
import com.bonafide.repository.GeneratedCertificateRepository;
import com.bonafide.service.CertificateGenerationService;
import com.exception.BadRequestException;
import com.file.FileStorageService;
import com.user.entity.User;
import com.user.service.CurrentUserService;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.nio.file.Paths;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CertificateGenerationServiceImpl
        implements CertificateGenerationService {

    private final CertificateTemplateRepository
            templateRepository;

    private final CertificateSignatureRepository
            signatureRepository;

    private final GeneratedCertificateRepository
            generatedCertificateRepository;

    private final FileStorageService fileStorageService;

    private final TemplateEngine templateEngine;

        private final CurrentUserService currentUserService;

    @Override
    public GeneratedCertificate generate(
            BonafideApplication application) {

        /*
         * 1. Get active HTML template
         */

        CertificateTemplate template =
                templateRepository
                        .findFirstByActiveTrueOrderByVersionDesc()
                        .orElseThrow(() ->
                                new BadRequestException(
                                        "No active certificate template found"
                                )
                        );

        /*
         * 2. Get active signature
         */

        CertificateSignature signature =
                signatureRepository
                        .findFirstByActiveTrueOrderByUploadedAtDesc()
                        .orElseThrow(() ->
                                new BadRequestException(
                                        "No active principal signature found"
                                )
                        );

        try {

            /*
             * 3. Read HTML template
             */

            byte[] templateBytes =
                    fileStorageService.readFile(
                            template.getFilePath()
                    );

            String templateHtml =
                    new String(templateBytes, StandardCharsets.UTF_8);

            String certificateNumber =
                    generateCertificateNumber(application.getId());
            User principal = currentUserService.getCurrentUser();

            /*
             * 4. Create Thymeleaf context
             */

            Context context = new Context();

            var student =
                    application.getStudent();

            context.setVariable(
                    "studentName",
                    student.getFullName()
            );

            context.setVariable(
                    "rollNumber",
                    student.getRollNumber()
            );

            context.setVariable(
                    "email",
                    student.getEmail()
            );

            context.setVariable(
                    "department",
                    student.getDepartment()
            );

            context.setVariable(
                    "semester",
                    student.getSemester()
            );

            context.setVariable(
                    "phoneNumber",
                    application.getPhoneNumber()
            );

            context.setVariable(
                    "hostelName",
                    application.getHostelName()
            );

            context.setVariable(
                    "roomNumber",
                    application.getRoomNumber()
            );

            context.setVariable(
                    "reason",
                    application.getReason()
            );

            context.setVariable(
                    "purpose",
                    application.getReason()
            );

            context.setVariable(
                    "parentName",
                    application.getParentName()
            );

            context.setVariable(
                    "academicYear",
                    application.getAcademicYear()
            );

            context.setVariable(
                    "certificateNumber",
                    certificateNumber
            );

            context.setVariable(
                    "principalName",
                    principal.getFullName()
            );

            context.setVariable(
                    "issueDate",
                    LocalDateTime.now()
                            .format(
                                    DateTimeFormatter.ofPattern(
                                            "dd-MM-yyyy"
                                    )
                            )
            );

            /*
             * 5. Give Thymeleaf the signature path
             */

            String signaturePath =
                    Paths.get(
                                    signature.getFilePath()
                            )
                            .toAbsolutePath()
                            .toUri()
                            .toString();

            context.setVariable(
                    "principalSignature",
                    signaturePath
            );

            /*
             * 6. Process HTML
             */

            String processedHtml =
                    templateEngine.process(
                            templateHtml,
                            context
                    );

            /*
             * 7. Convert HTML -> PDF
             */

            ByteArrayOutputStream outputStream =
                    new ByteArrayOutputStream();

            PdfRendererBuilder builder =
                    new PdfRendererBuilder();

            builder
                    .useFastMode()
                    .withHtmlContent(
                            processedHtml,
                            new File(
                                    template.getFilePath()
                            )
                                    .getParentFile()
                                    .toURI()
                                    .toString()
                    )
                    .toStream(outputStream)
                    .run();

            byte[] pdf =
                    outputStream.toByteArray();

            /*
             * 8. Generate filename
             */

            String fileName =
                    certificateNumber + ".pdf";

            /*
             * 9. Save PDF
             */

            String pdfPath =
                    fileStorageService.saveCertificate(
                            pdf,
                            fileName
                    );

            /*
             * 10. Save database record
             */

            GeneratedCertificate certificate =
                    GeneratedCertificate.builder()
                            .application(application)
                            .certificateNumber(
                                    certificateNumber
                            )
                            .fileName(fileName)
                            .filePath(pdfPath)
                            .generatedBy(principal.getId())
                            .generatedAt(
                                    LocalDateTime.now()
                            )
                            .build();

            return generatedCertificateRepository.save(
                    certificate
            );

        } catch (Exception e) {

            throw new RuntimeException(
                    "Certificate generation failed",
                    e
            );
        }
    }

    private String generateCertificateNumber(
            Long applicationId) {

        return "PMEC-BONAFIDE-"
                + LocalDateTime.now()
                .getYear()
                + "-"
                + String.format(
                "%06d",
                applicationId
        );
    }
}