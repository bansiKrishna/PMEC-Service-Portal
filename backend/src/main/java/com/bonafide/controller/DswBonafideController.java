package com.bonafide.controller;

import com.bonafide.dto.BonafideApplicationResponseDto;
import com.bonafide.dto.RejectBonafideRequestDto;
import com.bonafide.service.BonafideService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/dsw/bonafide")
@RequiredArgsConstructor
@PreAuthorize("hasRole('DSW')")
public class DswBonafideController {

    private final BonafideService bonafideService;

    @GetMapping("/applications")
    public ResponseEntity<List<BonafideApplicationResponseDto>> getApplications() {
        return ResponseEntity.ok(
                bonafideService.getApplicationsForDsw()
        );
    }

    @PostMapping({"/applications/{id}/approve", "/{id}/approve"})
        public ResponseEntity<BonafideApplicationResponseDto> approve(
            @PathVariable Long id,
            @RequestParam(required = false) String remarks,
            Authentication authentication) {
        return ResponseEntity.ok(
            bonafideService.approveByDsw(
                id,
                authentication.getName(),
                remarks
            )
        );
    }

    @PostMapping({"/applications/{id}/reject", "/{id}/reject"})
    public ResponseEntity<Void> reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectBonafideRequestDto request) {
        bonafideService.rejectByDsw(id, request);
        return ResponseEntity.ok().build();
    }
}
