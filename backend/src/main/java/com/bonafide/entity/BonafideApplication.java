package com.bonafide.entity;

import com.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bonafide_applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonafideApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(nullable = false)
    private String phoneNumber;

    private String hostelName;

    private String roomNumber;

    @Column(length = 500)
    private String reason;

    private String parentName;

    private LocalDate hostelAdmissionDate;

    private LocalDate collegeAdmissionDate;

    private String academicYear;

    @Enumerated(EnumType.STRING)
    private BonafideStatus status;

    @Column(length = 1000)
    private String rejectionReason;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}