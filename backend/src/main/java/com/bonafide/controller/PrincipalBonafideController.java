package com.bonafide.controller;

import com.bonafide.dto.BonafideApplicationResponseDto;
import com.bonafide.dto.BonafideSummaryDto;
import com.bonafide.dto.RejectBonafideRequestDto;
import com.bonafide.service.BonafideService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/principal/bonafide")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PRINCIPAL')")
public class PrincipalBonafideController {

    private final BonafideService bonafideService;

    @GetMapping("/applications")
    public ResponseEntity<List<BonafideApplicationResponseDto>> getApplications(
            @RequestParam(defaultValue = "PENDING") String status) {
        return ResponseEntity.ok(
                bonafideService.getPrincipalApplications(status)
        );
    }

    @GetMapping("/applications/summary")
    public ResponseEntity<BonafideSummaryDto> getSummary() {
        return ResponseEntity.ok(bonafideService.getPrincipalSummary());
    }

    @GetMapping("/applications/{id}")
    public ResponseEntity<BonafideApplicationResponseDto> getApplication(
            @PathVariable Long id) {
        return ResponseEntity.ok(bonafideService.getPrincipalApplicationById(id));
    }

    @PostMapping({"/applications/{id}/approve", "/{id}/approve"})
    public ResponseEntity<Void> approve(@PathVariable Long id) {
        bonafideService.approveByPrincipal(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping({"/applications/{id}/reject", "/{id}/reject"})
    public ResponseEntity<Void> reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectBonafideRequestDto request) {
        bonafideService.rejectByPrincipal(id, request);
        return ResponseEntity.ok().build();
    }
}