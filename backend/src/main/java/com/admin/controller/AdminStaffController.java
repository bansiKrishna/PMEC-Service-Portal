package com.admin.controller;

import com.admin.dto.CreateStaffRequest;
import com.admin.dto.StaffResponse;
import com.admin.dto.SetStaffPasswordRequest;
import com.admin.dto.SetStaffRoleRequest;
import com.admin.service.StaffManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStaffController {

    private final StaffManagementService staffManagementService;

    @PostMapping("/staff")
    public ResponseEntity<StaffResponse> createStaff(
            @Valid @RequestBody CreateStaffRequest request) {

        return ResponseEntity.ok(
                staffManagementService.createStaff(request)
        );
    }

    @GetMapping("/staff")
    public ResponseEntity<?> getStaff() {

        return ResponseEntity.ok(
                staffManagementService.getAllStaff()
        );
    }

    @GetMapping("/staff/{id}")
    public ResponseEntity<StaffResponse> getStaff(@PathVariable Long id) {
        return ResponseEntity.ok(staffManagementService.getStaff(id));
    }

    @PatchMapping("/staff/{id}/disable")
    public ResponseEntity<Void> disableStaff(@PathVariable Long id) {
        staffManagementService.disableStaff(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/staff/{id}/enable")
    public ResponseEntity<Void> enableStaff(@PathVariable Long id) {
        staffManagementService.enableStaff(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/staff/{id}/password")
    public ResponseEntity<Void> changeStaffPassword(
            @PathVariable Long id,
            @Valid @RequestBody SetStaffPasswordRequest request) {
        staffManagementService.changeStaffPassword(id, request.password());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/staff/{id}/role")
    public ResponseEntity<StaffResponse> changeStaffRole(
            @PathVariable Long id,
            @Valid @RequestBody SetStaffRoleRequest request) {
        return ResponseEntity.ok(
                staffManagementService.changeStaffRole(id, request.role())
        );
    }
}




