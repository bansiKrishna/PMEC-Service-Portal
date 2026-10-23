
package com.semesterRegistration.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "academic_subjects",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_subject_branch_year_semester_code",
                        columnNames = {
                                "branch_id",
                                "academic_year",
                                "semester",
                                "code"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcademicSubject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "academic_year", nullable = false, length = 9)
    private String academicYear;

    @Column(nullable = false)
    private Integer semester;

    @Column(nullable = false, length = 30)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "subject_type", nullable = false, length = 20)
    private SubjectType subjectType;

    @Column(precision = 4, scale = 2)
    private BigDecimal credits;

    @Builder.Default
    @Column(name = "compulsory", nullable = false)
    private boolean compulsory = true;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum SubjectType {
        THEORY,
        PRACTICAL,
        LAB,
        ELECTIVE
    }
}


//What this file handles
//        - Associates every subject with a branch.
//        - Stores the academic year and semester.
//        - Supports theory, practical, lab and elective subjects.
//        - Prevents duplicate subject codes for the same branch, academic year and semester.
//        - Allows departments to deactivate old subjects without deleting their records.
