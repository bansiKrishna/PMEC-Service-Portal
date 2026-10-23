package com.admin.service;

import com.admin.dto.SaveEmailServiceSettingsRequest;
import com.admin.entity.EmailServiceSettings;
import com.admin.repository.EmailServiceSettingsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailServiceSettingsServiceTest {

    @Mock
    private EmailServiceSettingsRepository settingsRepository;

    @Mock
    private EmailCredentialEncryptionService credentialEncryptionService;

    @InjectMocks
    private EmailServiceSettingsService settingsService;

    @Test
    void encryptsAppPasswordAndDoesNotIncludeItInTheResponse() {
        when(settingsRepository.findById(1)).thenReturn(Optional.empty());
        when(credentialEncryptionService.encrypt("app-password")).thenReturn("encrypted-value");

        var response = settingsService.saveSettings(
                new SaveEmailServiceSettingsRequest("PORTAL@gmail.com", "app-password")
        );

        ArgumentCaptor<EmailServiceSettings> settingsCaptor = ArgumentCaptor.forClass(EmailServiceSettings.class);
        verify(settingsRepository).save(settingsCaptor.capture());
        assertEquals("portal@gmail.com", settingsCaptor.getValue().getGmailAddress());
        assertEquals("encrypted-value", settingsCaptor.getValue().getEncryptedAppPassword());
        assertEquals("portal@gmail.com", response.gmailAddress());
        assertFalse(response.toString().contains("app-password"));
    }

    @Test
    void keepsTheExistingSecretWhenPasswordIsOmitted() {
        EmailServiceSettings existing = new EmailServiceSettings();
        existing.setId(1);
        existing.setGmailAddress("old@gmail.com");
        existing.setEncryptedAppPassword("saved-ciphertext");
        when(settingsRepository.findById(1)).thenReturn(Optional.of(existing));

        settingsService.saveSettings(new SaveEmailServiceSettingsRequest("new@gmail.com", ""));

        verify(credentialEncryptionService, never()).encrypt(org.mockito.ArgumentMatchers.anyString());
        verify(settingsRepository).save(existing);
        assertEquals("saved-ciphertext", existing.getEncryptedAppPassword());
    }
}
