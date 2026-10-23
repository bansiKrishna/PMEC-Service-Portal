package com.admin.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

@Service
public class EmailCredentialEncryptionService {

    private static final int NONCE_LENGTH = 12;
    private static final int TAG_LENGTH_BITS = 128;

    @Value("${EMAIL_SETTINGS_ENCRYPTION_KEY:}")
    private String encryptionKey;

    private final SecureRandom secureRandom = new SecureRandom();

    public String encrypt(String value) {
        byte[] nonce = new byte[NONCE_LENGTH];
        secureRandom.nextBytes(nonce);

        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, getKey(), new GCMParameterSpec(TAG_LENGTH_BITS, nonce));
            byte[] ciphertext = cipher.doFinal(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            byte[] encrypted = Arrays.copyOf(nonce, nonce.length + ciphertext.length);
            System.arraycopy(ciphertext, 0, encrypted, nonce.length, ciphertext.length);
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to encrypt the email service credential.");
        }
    }

    public String decrypt(String value) {
        try {
            byte[] encrypted = Base64.getDecoder().decode(value);
            if (encrypted.length <= NONCE_LENGTH) {
                throw new IllegalStateException("Stored email service credential is invalid.");
            }

            byte[] nonce = Arrays.copyOfRange(encrypted, 0, NONCE_LENGTH);
            byte[] ciphertext = Arrays.copyOfRange(encrypted, NONCE_LENGTH, encrypted.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, getKey(), new GCMParameterSpec(TAG_LENGTH_BITS, nonce));
            return new String(cipher.doFinal(ciphertext), java.nio.charset.StandardCharsets.UTF_8);
        } catch (GeneralSecurityException | IllegalArgumentException exception) {
            throw new IllegalStateException("Unable to decrypt the email service credential.");
        }
    }

    private SecretKeySpec getKey() {
        try {
            byte[] key = Base64.getDecoder().decode(encryptionKey);
            if (key.length != 32) {
                throw new IllegalArgumentException();
            }
            return new SecretKeySpec(key, "AES");
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Email credential encryption is not configured. Set EMAIL_SETTINGS_ENCRYPTION_KEY on the backend."
            );
        }
    }
}
