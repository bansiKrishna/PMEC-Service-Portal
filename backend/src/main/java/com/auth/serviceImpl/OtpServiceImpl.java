package com.auth.serviceImpl;

import com.auth.entity.OtpVerification;
import com.auth.repository.OtpVerificationRepository;
import com.auth.service.EmailService;
import com.auth.service.EmailValidationService;
import com.auth.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private static final int RESEND_COOLDOWN_SECONDS = 60;

    private final EmailValidationService emailValidationService;
    private final OtpVerificationRepository otpRepository;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public void generateAndSendOtp(String email) {
        email = email == null ? "" : email.trim().toLowerCase();

        if (!emailValidationService.isCollegeEmail(email)) {
            throw new IllegalArgumentException(
                    "Only PMEC college email addresses are allowed."
            );
        }

        LocalDateTime now = LocalDateTime.now();
        otpRepository.findTopByEmailOrderByIdDesc(email)
                .filter(previous -> previous.getCreatedAt() != null)
                .filter(previous -> previous.getCreatedAt()
                        .plusSeconds(RESEND_COOLDOWN_SECONDS).isAfter(now))
                .ifPresent(previous -> {
                    long secondsRemaining = java.time.Duration.between(
                            now,
                            previous.getCreatedAt().plusSeconds(RESEND_COOLDOWN_SECONDS)
                    ).toSeconds();
                    throw new ResponseStatusException(
                            HttpStatus.TOO_MANY_REQUESTS,
                            "Please wait " + (secondsRemaining + 1) + " seconds before requesting another OTP."
                    );
                });

        String otp = String.format(
                "%06d",
                secureRandom.nextInt(1_000_000)
        );

        OtpVerification verification = new OtpVerification();

        verification.setEmail(email);
        verification.setOtp(otp);
        verification.setExpiresAt(
                now.plusMinutes(5)
        );
        verification.setVerified(false);
        verification.setCreatedAt(now);

        emailService.sendOtpEmail(email, otp);

        otpRepository.save(verification);
    }

    @Override
    public void verifyOtp(
            String email,
            String otp
    ) {
        email = email == null ? "" : email.trim().toLowerCase();

        OtpVerification verification =
                otpRepository
                        .findTopByEmailOrderByIdDesc(email)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "OTP not found!"
                                )
                        );

        if (Boolean.TRUE.equals(
                verification.getVerified()
        )) {
            throw new RuntimeException(
                    "OTP already verified!"
            );
        }

        if (LocalDateTime.now()
                .isAfter(verification.getExpiresAt())) {

            throw new RuntimeException(
                    "OTP expired!"
            );
        }

        if (!verification.getOtp().equals(otp)) {

            throw new RuntimeException(
                    "Invalid OTP!"
            );
        }

        verification.setVerified(true);

        otpRepository.save(verification);
    }
}