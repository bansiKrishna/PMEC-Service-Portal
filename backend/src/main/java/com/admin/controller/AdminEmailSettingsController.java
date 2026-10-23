package com.admin.controller;

import com.admin.dto.EmailServiceSettingsResponse;
import com.admin.dto.SaveEmailServiceSettingsRequest;
import com.admin.dto.TestEmailRequest;
import com.admin.service.EmailServiceSettingsService;
import com.auth.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/email-settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminEmailSettingsController {

    private final EmailServiceSettingsService settingsService;
    private final EmailService emailService;

    @GetMapping
    public ResponseEntity<EmailServiceSettingsResponse> getSettings() {
        return ResponseEntity.ok(settingsService.getSettings());
    }

    @PutMapping
    public ResponseEntity<EmailServiceSettingsResponse> saveSettings(
            @Valid @RequestBody SaveEmailServiceSettingsRequest request) {
        return ResponseEntity.ok(settingsService.saveSettings(request));
    }

    @PostMapping("/test")
    public ResponseEntity<Map<String, String>> sendTestEmail(
            @Valid @RequestBody(required = false) TestEmailRequest request) {
        String recipientEmail = request == null ? null : request.recipientEmail();
        emailService.sendTestEmail(recipientEmail);
        return ResponseEntity.ok(Map.of("message", "Test email sent successfully."));
    }
}
