
package com.semesterRegistration.entity;

import com.semesterRegistration.entity.AcademicSubject;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "registration_subjects",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_registration_selected_subject",
                        columnNames = {
                                "registration_id",
                                "subject_id"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "registration_id", nullable = false)
    private SemesterRegistration registration;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private AcademicSubject subject;

    @Column(name = "selected_at", nullable = false, updatable = false)
    private LocalDateTime selectedAt;

    @PrePersist
    protected void onCreate() {
        selectedAt = LocalDateTime.now();
    }
}
