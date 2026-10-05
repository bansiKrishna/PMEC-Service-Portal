package com.bonafide.repository;

import com.bonafide.entity.CertificateTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CertificateTemplateRepository
        extends JpaRepository<CertificateTemplate, Long> {

    Optional<CertificateTemplate>
    findFirstByActiveTrueOrderByVersionDesc();

    List<CertificateTemplate>
    findAllByOrderByVersionDesc();
}