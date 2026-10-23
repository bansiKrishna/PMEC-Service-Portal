package com.auth.serviceImpl;

import com.auth.entity.OtpVerification;
import com.auth.repository.OtpVerificationRepository;
import com.auth.service.EmailService;
import com.auth.service.EmailValidationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OtpServiceImplTest {

    @Mock
    private EmailValidationService emailValidationService;

    @Mock
    private OtpVerificationRepository otpRepository;

    @Mock
    private EmailService emailService;

    @InjectMocks
    private OtpServiceImpl otpService;

    @Test
    void sendsOtpAndStoresFiveMinuteExpiry() {
        when(emailValidationService.isCollegeEmail("student@pmec.ac.in")).thenReturn(true);

        otpService.generateAndSendOtp(" Student@PMEC.ac.in ");

        ArgumentCaptor<OtpVerification> verificationCaptor = ArgumentCaptor.forClass(OtpVerification.class);
        verify(emailService).sendOtpEmail(org.mockito.ArgumentMatchers.eq("student@pmec.ac.in"), any());
        verify(otpRepository).save(verificationCaptor.capture());
        OtpVerification saved = verificationCaptor.getValue();
        assertFalse(saved.getVerified());
        assertTrue(saved.getOtp().matches("\\d{6}"));
        assertTrue(saved.getExpiresAt().isAfter(LocalDateTime.now().plusMinutes(4)));
        assertTrue(saved.getExpiresAt().isBefore(LocalDateTime.now().plusMinutes(6)));
    }

    @Test
    void rejectsResendDuringCooldown() {
        OtpVerification previous = new OtpVerification();
        previous.setCreatedAt(LocalDateTime.now().minusSeconds(10));
        when(emailValidationService.isCollegeEmail("student@pmec.ac.in")).thenReturn(true);
        when(otpRepository.findTopByEmailOrderByIdDesc("student@pmec.ac.in")).thenReturn(Optional.of(previous));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> otpService.generateAndSendOtp("student@pmec.ac.in")
        );

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatusCode());
        verify(emailService, never()).sendOtpEmail(any(), any());
    }

    @Test
    void rejectsIncorrectOtp() {
        OtpVerification verification = validOtp();
        when(otpRepository.findTopByEmailOrderByIdDesc("student@pmec.ac.in")).thenReturn(Optional.of(verification));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> otpService.verifyOtp("student@pmec.ac.in", "654321")
        );

        assertEquals("Invalid OTP!", exception.getMessage());
        verify(otpRepository, never()).save(any());
    }

    @Test
    void rejectsExpiredOtp() {
        OtpVerification verification = validOtp();
        verification.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(otpRepository.findTopByEmailOrderByIdDesc("student@pmec.ac.in")).thenReturn(Optional.of(verification));

        RuntimeException exception = assertThrows(
                RuntimeException.class,
                () -> otpService.verifyOtp("student@pmec.ac.in", "123456")
        );

        assertEquals("OTP expired!", exception.getMessage());
        verify(otpRepository, never()).save(any());
    }

    @Test
    void acceptsCorrectOtpAndMarksItVerified() {
        OtpVerification verification = validOtp();
        when(otpRepository.findTopByEmailOrderByIdDesc("student@pmec.ac.in")).thenReturn(Optional.of(verification));

        otpService.verifyOtp("student@pmec.ac.in", "123456");

        assertTrue(verification.getVerified());
        verify(otpRepository).save(verification);
    }

    private OtpVerification validOtp() {
        OtpVerification verification = new OtpVerification();
        verification.setEmail("student@pmec.ac.in");
        verification.setOtp("123456");
        verification.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        verification.setVerified(false);
        return verification;
    }
}
