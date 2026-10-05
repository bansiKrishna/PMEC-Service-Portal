package com.bonafide.service;

import com.bonafide.entity.BonafideApplication;
import com.bonafide.entity.GeneratedCertificate;

public interface CertificateGenerationService {

    GeneratedCertificate generate(
            BonafideApplication application
    );
}