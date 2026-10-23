
package com.semesterRegistration.controller;

import com.semesterRegistration.dto.BranchStaffAssignmentResponse;
import com.semesterRegistration.service.BranchStaffAssignmentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only endpoints for managing branch staff assignments.
 */
@RestController
@RequestMapping("/api/semester-registration/admin/branches")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class BranchStaffAssignmentController {

    private final BranchStaffAssignmentService assignmentService;

    public record AssignStaffRequest(
            @NotNull(message = "User ID is required.")
            Long userId
    ) {
    }

    /**
     * Assign a staff user to a branch.
     * POST /api/semester-registration/admin/branches/{branchId}/staff
     */
    @PostMapping("/{branchId}/staff")
    @ResponseStatus(HttpStatus.CREATED)
    public BranchStaffAssignmentResponse assignStaff(
            @PathVariable Long branchId,
            @Valid @RequestBody AssignStaffRequest request
    ) {
        return assignmentService.assignStaff(
                branchId,
                request.userId()
        );
    }

    /**
     * List active staff assigned to a branch.
     * GET /api/semester-registration/admin/branches/{branchId}/staff
     */
    @GetMapping("/{branchId}/staff")
    public List<BranchStaffAssignmentResponse> getBranchStaff(
            @PathVariable Long branchId
    ) {
        return assignmentService.getBranchStaff(branchId);
    }

    /**
     * Deactivate a branch assignment while retaining its record.
     * DELETE /api/semester-registration/admin/branches/{branchId}/staff/{userId}
     */
    @DeleteMapping("/{branchId}/staff/{userId}")
    public BranchStaffAssignmentResponse deactivateAssignment(
            @PathVariable Long branchId,
            @PathVariable Long userId
    ) {
        return assignmentService.deactivateAssignment(
                branchId,
                userId
        );
    }
}
