package com.admin.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class EmailCredentialEncryptionServiceTest {

    @Test
    void encryptsAndDecryptsTheAppPassword() {
        EmailCredentialEncryptionService encryptionService = encryptionService(new byte[32]);

        String encrypted = encryptionService.encrypt("gmail-app-password");

        assertNotEquals("gmail-app-password", encrypted);
        assertEquals("gmail-app-password", encryptionService.decrypt(encrypted));
    }

    @Test
    void rejectsCiphertextWhenEncryptedWithAnotherKey() {
        EmailCredentialEncryptionService first = encryptionService(new byte[32]);
        byte[] otherKey = new byte[32];
        otherKey[0] = 1;
        EmailCredentialEncryptionService second = encryptionService(otherKey);
        String encrypted = first.encrypt("gmail-app-password");

        assertThrows(IllegalStateException.class, () -> second.decrypt(encrypted));
    }

    private EmailCredentialEncryptionService encryptionService(byte[] key) {
        EmailCredentialEncryptionService service = new EmailCredentialEncryptionService();
        ReflectionTestUtils.setField(service, "encryptionKey", Base64.getEncoder().encodeToString(key));
        return service;
    }
}
