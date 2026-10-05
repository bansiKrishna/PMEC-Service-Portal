package com.bonafide.controller;

import com.bonafide.dto.BonafideApplicationResponseDto;
import com.bonafide.dto.RejectBonafideRequestDto;
import com.bonafide.service.BonafideService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/principal/bonafide")
@RequiredArgsConstructor
public class PrincipalBonafideController {

    private final BonafideService bonafideService;

    @GetMapping("/applications")
    public ResponseEntity<List<BonafideApplicationResponseDto>> getApplications() {
        return ResponseEntity.ok(
                bonafideService.getPendingForPrincipal()
        );
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
    @GetMapping("/test")
    public ResponseEntity<String> test(Authentication authentication) {
        return ResponseEntity.ok(
                "Principal authenticated: " + authentication.getName()
                        + " | authorities: " + authentication.getAuthorities()
        );
    }
}