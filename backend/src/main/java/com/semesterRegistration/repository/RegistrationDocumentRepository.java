
package com.semesterRegistration.repository;

import com.semesterRegistration.entity.RegistrationDocument;
import com.semesterRegistration.entity.RegistrationDocument.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface RegistrationDocumentRepository
        extends JpaRepository<RegistrationDocument, Long> {

    List<RegistrationDocument>
    findByRegistration_IdOrderByUploadedAtDesc(Long registrationId);

    List<RegistrationDocument>
    findByRegistration_IdInOrderByUploadedAtDesc(
            Collection<Long> registrationIds
    );

    List<RegistrationDocument>
    findByRegistration_IdAndDocumentTypeOrderByUploadedAtDesc(
            Long registrationId,
            DocumentType documentType
    );

    boolean existsByRegistration_IdAndDocumentType(
            Long registrationId,
            DocumentType documentType
    );

    long countByRegistration_Id(Long registrationId);
}


//Method	Purpose
//findByRegistration_IdOrderByUploadedAtDesc()	Lists all documents for a registration, newest first.
//findByRegistration_IdAndDocumentTypeOrderByUploadedAtDesc()	Finds documents of a specific type, such as college fee receipts.
//existsByRegistration_IdAndDocumentType()	Checks whether a document of a particular type exists.
//countByRegistration_Id()	Counts documents attached to an application.