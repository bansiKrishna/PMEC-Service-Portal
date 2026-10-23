
package com.semesterRegistration.repository;

import com.semesterRegistration.entity.RegistrationSubject;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface RegistrationSubjectRepository
        extends JpaRepository<RegistrationSubject, Long> {

    @EntityGraph(attributePaths = {"subject", "subject.branch"})
    List<RegistrationSubject>
    findByRegistration_IdOrderBySubject_CodeAsc(Long registrationId);

    @EntityGraph(attributePaths = {"subject", "subject.branch"})
    List<RegistrationSubject>
    findByRegistration_IdInOrderBySubject_CodeAsc(
            Collection<Long> registrationIds
    );

    boolean existsByRegistration_IdAndSubject_Id(
            Long registrationId,
            Long subjectId
    );

    long countByRegistration_Id(Long registrationId);

    @Modifying(flushAutomatically = true)
    @Query("delete from RegistrationSubject rs where rs.registration.id = :registrationId")
    void deleteByRegistrationId(@Param("registrationId") Long registrationId);
}


//What these methods do
//Method	                                                                            Purpose
//findByRegistration_IdOrderBySubject_CodeAsc()     	Lists a registration's selected subjects in subject-code order.
//existsByRegistration_IdAndSubject_Id()	            Checks whether a subject has already been selected.
//countByRegistration_Id()	                            Counts selected subjects.
//deleteByRegistrationId()	                            Flushes and removes a registration's subject links
//                                                      before replacement rows are inserted.