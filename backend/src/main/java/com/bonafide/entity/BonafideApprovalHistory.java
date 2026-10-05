package com.bonafide.entity;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "bonafide_approval_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BonafideApprovalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id")
    private BonafideApplication application;

    private Long actionBy;

    private String actionByRole;

    private String action;

    @Column(length = 1000)
    private String remarks;

    private LocalDateTime actionAt;
}