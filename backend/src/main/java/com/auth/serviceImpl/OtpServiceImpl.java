package com.auth.serviceImpl;

import com.auth.entity.OtpVerification;
import com.auth.repository.OtpVerificationRepository;
import com.auth.service.EmailService;
import com.auth.service.EmailValidationService;
import com.auth.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private final EmailValidationService emailValidationService;
    private final OtpVerificationRepository otpRepository;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public void generateAndSendOtp(String email) {

        if (!emailValidationService.isCollegeEmail(email)) {
            throw new IllegalArgumentException(
                    "Only PMEC college email addresses are allowed."
            );
        }

        String otp = String.format(
                "%06d",
                secureRandom.nextInt(1_000_000)
        );

        OtpVerification verification = new OtpVerification();

        verification.setEmail(email);
        verification.setOtp(otp);
        verification.setExpiresAt(
                LocalDateTime.now().plusMinutes(5)
        );
        verification.setVerified(false);

        emailService.sendOtpEmail(email, otp);

        otpRepository.save(verification);
    }

    @Override
    public void verifyOtp(
            String email,
            String otp
    ) {

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