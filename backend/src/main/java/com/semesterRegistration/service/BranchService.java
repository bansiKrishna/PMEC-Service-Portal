
package com.semesterRegistration.service;

import com.semesterRegistration.entity.Branch;
import com.semesterRegistration.repository.BranchRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class BranchService {

    private final BranchRepository branchRepository;

    public BranchService(BranchRepository branchRepository) {
        this.branchRepository = branchRepository;
    }

    @Transactional
    public Branch createBranch(
            String code,
            String name,
            Branch.DegreeLevel degreeLevel
    ) {
        String normalizedCode = normalizeCode(code);
        String normalizedName = normalizeName(name);

        if (branchRepository.existsByCodeIgnoreCase(normalizedCode)) {
            throw new IllegalArgumentException(
                    "A branch with code " + normalizedCode + " already exists."
            );
        }

        if (degreeLevel == null) {
            throw new IllegalArgumentException(
                    "Degree level is required."
            );
        }

        Branch branch = Branch.builder()
                .code(normalizedCode)
                .name(normalizedName)
                .degreeLevel(degreeLevel)
                .active(true)
                .build();

        return branchRepository.save(branch);
    }

    @Transactional(readOnly = true)
    public List<Branch> getActiveBranches() {
        return branchRepository.findByActiveTrueOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public List<Branch> getAllBranches() {
        return branchRepository.findAllByOrderByNameAsc();
    }

    @Transactional
    public Branch setBranchActive(Long branchId, boolean active) {
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Branch not found with ID: " + branchId
                ));

        branch.setActive(active);

        return branchRepository.save(branch);
    }

    private String normalizeCode(String code) {
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException(
                    "Branch code is required."
            );
        }

        return code.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException(
                    "Branch name is required."
            );
        }

        return name.trim();
    }
}


//What this service handles
//    - Creates a branch with a unique code.
//    - Supports BTECH and MTECH degree levels.
//    - Lists active branches for student forms.
//    - Lists all branches for administration.
//    - Activates or deactivates a branch without deleting its historical records.