
package com.semesterRegistration.service;

import com.semesterRegistration.dto.BranchStaffAssignmentResponse;
import com.semesterRegistration.dto.CreateBranchStaffRequest;
import com.semesterRegistration.entity.Branch;
import com.semesterRegistration.entity.BranchStaffAssignment;
import com.semesterRegistration.repository.BranchRepository;
import com.semesterRegistration.repository.BranchStaffAssignmentRepository;
import com.user.entity.Role;
import com.user.entity.User;
import com.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * Creates branch staff accounts, manages branch assignments,
 * and lists or deactivates existing assignments.
 *
 * Controller endpoints must restrict these operations to ADMIN.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class BranchStaffAssignmentService {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final BranchStaffAssignmentRepository assignmentRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Assigns an existing staff account to an active branch.
     */
    public BranchStaffAssignmentResponse assignStaff(
            Long branchId,
            Long userId
    ) {
        Branch branch = findActiveBranch(branchId);

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found.")
                );

        if (user.getRole() == null
                || user.getRole() == Role.STUDENT) {
            throw new IllegalArgumentException(
                    "Only staff accounts can be assigned to a branch."
            );
        }

        BranchStaffAssignment assignment =
                assignmentRepository.findByUser_IdAndBranch_Id(
                        userId, branchId
                ).orElse(null);

        if (assignment != null) {
            if (assignment.isActive()) {
                throw new IllegalArgumentException(
                        "This user is already assigned to the branch."
                );
            }

            // Reactivate the existing assignment instead of creating
            // a duplicate branch/user pair.
            assignment.setActive(true);
        } else {
            assignment = BranchStaffAssignment.builder()
                    .branch(branch)
                    .user(user)
                    .active(true)
                    .build();
        }

        return toResponse(assignmentRepository.save(assignment));
    }

    /**
     * Creates a new BRANCH_STAFF account and assigns it to a branch.
     * The transaction rolls back if the assignment cannot be saved.
     */
    public BranchStaffAssignmentResponse createAndAssignStaff(
            Long branchId,
            CreateBranchStaffRequest request
    ) {
        Branch branch = findActiveBranch(branchId);

        String email = request.email()
                .trim()
                .toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException(
                    "An account with this email already exists."
            );
        }

        User staff = User.builder()
                .fullName(request.fullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .role(Role.BRANCH_STAFF)
                .department(branch.getCode())
                .enabled(true)
                .emailVerified(false)
                .firstLogin(true)
                .failedLoginAttempts(0)
                .build();

        User savedStaff = userRepository.save(staff);

        BranchStaffAssignment assignment =
                BranchStaffAssignment.builder()
                        .branch(branch)
                        .user(savedStaff)
                        .active(true)
                        .build();

        BranchStaffAssignment savedAssignment =
                assignmentRepository.save(assignment);

        return toResponse(savedAssignment);
    }

    /**
     * Returns active staff assignments for the requested branch.
     */
    @Transactional(readOnly = true)
    public List<BranchStaffAssignmentResponse> getBranchStaff(
            Long branchId
    ) {
        if (!branchRepository.existsById(branchId)) {
            throw new IllegalArgumentException("Branch not found.");
        }

        return assignmentRepository
                .findByBranch_IdAndActiveTrue(branchId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Deactivates an assignment without deleting its record.
     */
    public BranchStaffAssignmentResponse deactivateAssignment(
            Long branchId,
            Long userId
    ) {
        BranchStaffAssignment assignment =
                assignmentRepository.findByUser_IdAndBranch_Id(
                        userId, branchId
                ).orElseThrow(() ->
                        new IllegalArgumentException(
                                "Branch staff assignment not found."
                        )
                );

        assignment.setActive(false);

        return toResponse(assignmentRepository.save(assignment));
    }

    /**
     * Loads a branch and ensures it is active.
     */
    private Branch findActiveBranch(Long branchId) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() ->
                        new IllegalArgumentException("Branch not found.")
                );

        if (!branch.isActive()) {
            throw new IllegalArgumentException(
                    "Cannot assign staff to an inactive branch."
            );
        }

        return branch;
    }

    /**
     * Maps entities to a safe response without exposing passwords.
     */
    private BranchStaffAssignmentResponse toResponse(
            BranchStaffAssignment assignment
    ) {
        Branch branch = assignment.getBranch();
        User user = assignment.getUser();

        return new BranchStaffAssignmentResponse(
                assignment.getId(),
                branch.getId(),
                branch.getCode(),
                branch.getName(),
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name(),
                assignment.isActive(),
                assignment.getCreatedAt()
        );
    }
}
