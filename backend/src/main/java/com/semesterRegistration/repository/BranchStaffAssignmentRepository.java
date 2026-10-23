
package com.semesterRegistration.repository;

import com.semesterRegistration.entity.BranchStaffAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BranchStaffAssignmentRepository
        extends JpaRepository<BranchStaffAssignment, Long> {

    boolean existsByUser_IdAndBranch_IdAndActiveTrue(
            Long userId,
            Long branchId
    );

    Optional<BranchStaffAssignment> findByUser_IdAndBranch_Id(
            Long userId,
            Long branchId
    );

    List<BranchStaffAssignment> findByUser_IdAndActiveTrue(
            Long userId
    );

    List<BranchStaffAssignment> findByBranch_IdAndActiveTrue(
            Long branchId
    );
}
