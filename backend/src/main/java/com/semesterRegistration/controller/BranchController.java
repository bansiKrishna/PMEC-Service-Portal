
package com.semesterRegistration.controller;

import com.semesterRegistration.entity.Branch;
import com.semesterRegistration.service.BranchService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/semester-registration/branches")
public class BranchController {

    private final BranchService branchService;

    public BranchController(BranchService branchService) {
        this.branchService = branchService;
    }

    // List active branches for student forms
    @GetMapping
    public ResponseEntity<List<Branch>> getActiveBranches() {
        return ResponseEntity.ok(
                branchService.getActiveBranches()
        );
    }

    // List all branches, including inactive ones
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Branch>> getAllBranches() {
        return ResponseEntity.ok(
                branchService.getAllBranches()
        );
    }

    // Create a new branch
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Branch> createBranch(
            @RequestBody CreateBranchRequest request
    ) {
        Branch branch = branchService.createBranch(
                request.code(),
                request.name(),
                request.degreeLevel()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(branch);
    }

    // Activate or deactivate a branch
    @PatchMapping("/{branchId}/active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Branch> setBranchActive(
            @PathVariable Long branchId,
            @RequestBody SetActiveRequest request
    ) {
        Branch branch = branchService.setBranchActive(
                branchId,
                request.active()
        );

        return ResponseEntity.ok(branch);
    }

    public record CreateBranchRequest(
            String code,
            String name,
            Branch.DegreeLevel degreeLevel
    ) {}

    public record SetActiveRequest(
            boolean active
    ) {}
}

//
//API endpoints introduced

//Method	            Endpoint	                                      Purpose
//GET	    /api/semester-registration/branches	                    List active branches
//GET	    /api/semester-registration/branches/all	                List all branches
//POST	    /api/semester-registration/branches	                    Create a branch
//PATCH	    /api/semester-registration/branches/{branchId}/active	Activate or deactivate a branch