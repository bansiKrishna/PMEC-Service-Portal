package com.config;

import com.bonafide.entity.CertificateTemplate;
import com.bonafide.repository.CertificateTemplateRepository;
import com.file.FileStorageService;
import com.user.entity.Role;
import com.user.entity.User;
import com.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.context.annotation.Profile;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile("!test")
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CertificateTemplateRepository templateRepository;
    private final FileStorageService fileStorageService;

    @Value("${INITIAL_ADMIN_PASSWORD:}")
    private String initialAdminPassword;

    @Override
    public void run(String... args) {

        if (userRepository.findByEmail("admin@pmec.ac.in").isEmpty()) {
            if (initialAdminPassword == null || initialAdminPassword.isBlank()) {
                log.warn(
                        "System admin initialization skipped; "
                                + "INITIAL_ADMIN_PASSWORD is not configured."
                );
            } else {
                User admin = new User();
                admin.setFullName("System Administrator");
                admin.setEmail("admin@pmec.ac.in");
                admin.setPassword(passwordEncoder.encode(initialAdminPassword));
                admin.setRole(Role.ADMIN);
                admin.setEnabled(true);
                admin.setEmailVerified(true);
                admin.setFirstLogin(false);
                admin.setFailedLoginAttempts(0);
                userRepository.save(admin);
                log.info("System admin account initialized.");
            }
        }

        seedDefaultCertificateTemplate();
    }

    private void seedDefaultCertificateTemplate() {
        if (templateRepository
                .findFirstByActiveTrueOrderByVersionDesc()
                .isPresent()) {
            return;
        }

        try (var templateStream = new ClassPathResource(
                "bonafide-template.html"
        ).getInputStream()) {
            byte[] templateContent = templateStream.readAllBytes();

            String templatePath = fileStorageService.saveTemplate(
                    templateContent,
                    "bonafide-template.html"
            );

            int nextVersion = templateRepository.findAll().stream()
                    .map(CertificateTemplate::getVersion)
                    .max(Integer::compareTo)
                    .orElse(0) + 1;

            templateRepository.save(CertificateTemplate.builder()
                    .templateName("PMEC Bonafide Certificate")
                    .fileName("bonafide-template.html")
                    .filePath(templatePath)
                    .contentType("text/html")
                    .version(nextVersion)
                    .active(true)
                    .uploadedAt(LocalDateTime.now())
                    .build());
        } catch (IOException exception) {
            throw new IllegalStateException(
                    "Unable to initialize the default bonafide certificate template",
                    exception
            );
        }
    }
}