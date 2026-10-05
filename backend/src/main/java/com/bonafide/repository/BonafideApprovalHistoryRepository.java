package com.bonafide.repository;

import com.bonafide.entity.BonafideApprovalHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BonafideApprovalHistoryRepository
        extends JpaRepository<BonafideApprovalHistory, Long> {

    List<BonafideApprovalHistory>
    findByApplicationIdOrderByActionAtAsc(
            Long applicationId
    );
}