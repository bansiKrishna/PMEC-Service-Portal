package com.bonafide.repository;

import com.bonafide.entity.GeneratedCertificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GeneratedCertificateRepository
        extends JpaRepository<GeneratedCertificate, Long> {

    Optional<GeneratedCertificate>
    findByApplicationId(Long applicationId);
}
