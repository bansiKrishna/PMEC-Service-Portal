package com.auth.service;

import com.auth.dto.RegisterRequest;
import com.auth.repository.OtpVerificationRepository;
import com.security.JwtService;
import com.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthServiceImplTest {

    private UserRepository userRepository;
    private OtpVerificationRepository otpVerificationRepository;
    private AuthServiceImpl authService;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        otpVerificationRepository = mock(OtpVerificationRepository.class);
        authService = new AuthServiceImpl(
                userRepository,
                otpVerificationRepository,
                mock(PasswordEncoder.class),
                mock(JwtService.class)
        );
        ReflectionTestUtils.setField(authService, "collegeDomain", "pmec.ac.in");
    }

    @Test
    void registrationIsRejectedUnlessTheLatestOtpIsVerified() {
        when(otpVerificationRepository.findTopByEmailOrderByIdDesc("student@pmec.ac.in"))
                .thenReturn(Optional.empty());
        RegisterRequest request = new RegisterRequest(
                "Student",
                "student@pmec.ac.in",
                "password123",
                "12345",
                "CSE",
                1
        );

        RuntimeException exception = assertThrows(RuntimeException.class, () -> authService.register(request));

        assertEquals("Verify your college email before registering", exception.getMessage());
        verify(userRepository, never()).save(org.mockito.ArgumentMatchers.any());
    }
}
