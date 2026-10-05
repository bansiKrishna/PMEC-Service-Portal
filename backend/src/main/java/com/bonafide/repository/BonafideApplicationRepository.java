package com.bonafide.repository;

import com.bonafide.entity.BonafideApplication;
import com.bonafide.entity.BonafideStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BonafideApplicationRepository
        extends JpaRepository<BonafideApplication, Long> {

    List<BonafideApplication> findAllByOrderByCreatedAtDesc();

    List<BonafideApplication> findByStatus(BonafideStatus status);

    List<BonafideApplication> findByStudentId(Long studentId);
}