
package com.semesterRegistration.entity;

import com.semesterRegistration.enums.RegistrationStatus;
import com.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "semester_registrations",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_registration_student_year_semester",
                        columnNames = {
                                "student_id",
                                "academic_year",
                                "semester"
                        }
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SemesterRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(
            name = "application_number",
            unique = true,
            length = 40
    )
    private String applicationNumber;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "academic_year", nullable = false, length = 9)
    private String academicYear;

    @Column(nullable = false)
    private Integer semester;

    @Column(nullable = false, length = 20)
    private String section;

    @Column(name = "hostel_name", length = 100)
    private String hostelName;

    @Column(name = "hostel_room", length = 30)
    private String hostelRoom;

    @Column(name = "college_fee_due", precision = 12, scale = 2)
    private BigDecimal collegeFeeDue;

    @Column(name = "college_fee_paid", precision = 12, scale = 2)
    private BigDecimal collegeFeePaid;

    @Column(name = "college_advance", precision = 12, scale = 2)
    private BigDecimal collegeAdvance;

    @Column(name = "hostel_fee_due", precision = 12, scale = 2)
    private BigDecimal hostelFeeDue;

    @Column(name = "hostel_fee_paid", precision = 12, scale = 2)
    private BigDecimal hostelFeePaid;

    @Column(name = "hostel_advance", precision = 12, scale = 2)
    private BigDecimal hostelAdvance;

    @Column(name = "mess_fee_due", precision = 12, scale = 2)
    private BigDecimal messFeeDue;

    @Column(name = "mess_fee_paid", precision = 12, scale = 2)
    private BigDecimal messFeePaid;

    @Column(name = "mess_advance", precision = 12, scale = 2)
    private BigDecimal messAdvance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private RegistrationStatus status = RegistrationStatus.DRAFT;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
