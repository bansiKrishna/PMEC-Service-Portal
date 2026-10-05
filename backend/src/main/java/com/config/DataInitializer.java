package com.config;

import com.bonafide.entity.CertificateTemplate;
import com.bonafide.repository.CertificateTemplateRepository;
import com.file.FileStorageService;
import com.user.entity.Role;
import com.user.entity.User;
import com.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.core.io.ClassPathResource;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
        private final CertificateTemplateRepository templateRepository;
        private final FileStorageService fileStorageService;

    @Override
    public void run(String... args) {

        String email = "admin@pmec.ac.in";

        if (userRepository.findByEmail(email).isEmpty()) {

            User admin = new User();

            admin.setFullName("System Administrator");
            admin.setEmail(email);

            admin.setPassword(
                    passwordEncoder.encode("Admin@123")
            );

            admin.setRole(Role.ADMIN);

            admin.setEnabled(true);
            admin.setEmailVerified(true);
            admin.setFirstLogin(false);
            admin.setFailedLoginAttempts(0);

            userRepository.save(admin);

            System.out.println(
                    "======================================"
            );
            System.out.println(
                    "SYSTEM ADMIN CREATED"
            );
            System.out.println(
                    "Email: " + email
            );
            System.out.println(
                    "Password: Admin@123"
            );
            System.out.println(
                    "======================================"
            );

        } else {

            System.out.println(
                    "System Admin already exists."
            );
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