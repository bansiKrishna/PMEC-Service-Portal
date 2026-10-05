package com.bonafide.repository;

import com.bonafide.entity.CertificateSignature;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CertificateSignatureRepository
        extends JpaRepository<CertificateSignature, Long> {

    Optional<CertificateSignature>
    findFirstByActiveTrueOrderByUploadedAtDesc();
}