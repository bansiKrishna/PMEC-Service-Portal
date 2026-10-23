package com.admin.service;

import com.admin.dto.EmailServiceSettingsResponse;
import com.admin.dto.SaveEmailServiceSettingsRequest;
import com.admin.entity.EmailServiceSettings;
import com.admin.repository.EmailServiceSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
public class EmailServiceSettingsService {

    private static final int SETTINGS_ID = 1;

    private final EmailServiceSettingsRepository settingsRepository;
    private final EmailCredentialEncryptionService credentialEncryptionService;

    public EmailServiceSettingsResponse getSettings() {
        return settingsRepository.findById(SETTINGS_ID)
                .map(settings -> new EmailServiceSettingsResponse(settings.getGmailAddress(), true))
                .orElseGet(() -> new EmailServiceSettingsResponse(null, false));
    }

    @Transactional
    public EmailServiceSettingsResponse saveSettings(SaveEmailServiceSettingsRequest request) {
        String gmailAddress = request.gmailAddress().trim().toLowerCase();
        if (!gmailAddress.matches("(?i)^[a-z0-9._%+-]+@(gmail\\.com|googlemail\\.com)$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid Gmail address.");
        }
        EmailServiceSettings settings = settingsRepository.findById(SETTINGS_ID)
                .orElseGet(() -> {
                    EmailServiceSettings newSettings = new EmailServiceSettings();
                    newSettings.setId(SETTINGS_ID);
                    return newSettings;
                });

        String appPassword = request.appPassword() == null ? "" : request.appPassword().trim();
        if (appPassword.isEmpty() && settings.getEncryptedAppPassword() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Gmail App Password is required for the initial setup."
            );
        }
        if (!appPassword.isEmpty()) {
            settings.setEncryptedAppPassword(credentialEncryptionService.encrypt(appPassword));
        }
        settings.setGmailAddress(gmailAddress);
        settings.setUpdatedAt(OffsetDateTime.now());
        settingsRepository.save(settings);
        return new EmailServiceSettingsResponse(gmailAddress, true);
    }

    public EmailServiceSettings getConfiguredSettings() {
        return settingsRepository.findById(SETTINGS_ID)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.SERVICE_UNAVAILABLE,
                        "Email service is not configured. Ask an administrator to configure it."
                ));
    }
}
