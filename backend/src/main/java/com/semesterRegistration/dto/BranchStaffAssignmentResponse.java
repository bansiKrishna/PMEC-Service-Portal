
package com.semesterRegistration.dto;

import java.time.LocalDateTime;

/**
 * Safe response containing staff and branch assignment details.
 * Passwords and other private account fields are never included.
 */
public record BranchStaffAssignmentResponse(
        Long assignmentId,
        Long branchId,
        String branchCode,
        String branchName,
        Long userId,
        String fullName,
        String email,
        String role,
        boolean active,
        LocalDateTime createdAt
) {
}
