package com.bonafide.controller;

import com.bonafide.dto.*;
import com.bonafide.service.BonafideService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bonafide")
@RequiredArgsConstructor
public class BonafideController {

    private final BonafideService bonafideService;


    // =====================================================
    // STUDENT
    // =====================================================

    @PostMapping
        @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<BonafideApplicationResponseDto>
    create(
            @Valid
            @RequestBody
            BonafideApplicationRequestDto request) {

        return ResponseEntity.ok(
                bonafideService.create(request)
        );
    }


    @GetMapping("/my")
        @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<
            List<BonafideApplicationResponseDto>>
    getMyApplications() {

        return ResponseEntity.ok(
                bonafideService.getMyApplications()
        );
    }


    @GetMapping("/{id}")
        @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<
            BonafideApplicationResponseDto>
    getById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                bonafideService.getById(id)
        );
    }

    @GetMapping("/{id}/status")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<BonafideStatusResponseDto> getStatus(
            @PathVariable Long id) {
        return ResponseEntity.ok(bonafideService.getStatus(id));
    }


    @PostMapping("/{id}/submit")
        @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void>
    submit(
            @PathVariable Long id) {

        bonafideService.submit(id);

        return ResponseEntity.ok().build();
    }


    // =====================================================
    // DSW
    // =====================================================

    @GetMapping("/dsw/pending")
        @PreAuthorize("hasRole('DSW')")
    public ResponseEntity<
            List<BonafideApplicationResponseDto>>
    dswPending() {

        return ResponseEntity.ok(
                bonafideService.getPendingForDsw()
        );
    }

    @GetMapping("/dsw/{id}")
    @PreAuthorize("hasRole('DSW')")
    public ResponseEntity<BonafideApplicationResponseDto> getDswApplication(
        @PathVariable Long id) {

    return ResponseEntity.ok(
            bonafideService.getDswApplicationById(id)
    );
}

    @PutMapping("/dsw/{id}/approve")
        @PreAuthorize("hasRole('DSW')")
    public ResponseEntity<Void>
    dswApprove(
            @PathVariable Long id) {

        bonafideService.approveByDsw(id);

        return ResponseEntity.ok().build();
    }


    @PutMapping("/dsw/{id}/reject")
        @PreAuthorize("hasRole('DSW')")
    public ResponseEntity<Void>
    dswReject(
            @PathVariable Long id,

            @Valid
            @RequestBody
            RejectBonafideRequestDto request) {

        bonafideService.rejectByDsw(
                id,
                request
        );

        return ResponseEntity.ok().build();
    }


    // =====================================================
    // PRINCIPAL
    // =====================================================

    @GetMapping("/principal/pending")
        @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<
            List<BonafideApplicationResponseDto>>
    principalPending() {

        return ResponseEntity.ok(
                bonafideService
                        .getPendingForPrincipal()
        );
    }


    @GetMapping("/principal/{id}")
    @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<BonafideApplicationResponseDto> getPrincipalApplication(
        @PathVariable Long id) {

    return ResponseEntity.ok(
            bonafideService.getById(id)
    );
}

    @PutMapping("/principal/{id}/approve")
        @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<Void>
    principalApprove(
            @PathVariable Long id) {

        bonafideService
                .approveByPrincipal(id);

        return ResponseEntity.ok().build();
    }


    @PutMapping("/principal/{id}/reject")
        @PreAuthorize("hasRole('PRINCIPAL')")
    public ResponseEntity<Void>
    principalReject(
            @PathVariable Long id,

            @Valid
            @RequestBody
            RejectBonafideRequestDto request) {

        bonafideService
                .rejectByPrincipal(
                        id,
                        request
                );

        return ResponseEntity.ok().build();
    }


    // =====================================================
    // DOWNLOAD
    // =====================================================

    @GetMapping("/{id}/certificate")
        @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<byte[]>
    downloadCertificate(
            @PathVariable Long id) {

        byte[] pdf =
                bonafideService
                        .downloadCertificate(id);

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=bonafide-certificate.pdf"
                )
                .contentType(
                        MediaType.APPLICATION_PDF
                )
                .body(pdf);
    }
}