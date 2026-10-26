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
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class OtpServiceImpl implements OtpService {

    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int OTP_EXPIRY_MINUTES = 5;

    private final EmailValidationService emailValidationService;
    private final OtpVerificationRepository otpRepository;
    private final EmailService emailService;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public void generateAndSendOtp(String email) {

        // Normalize the email address.
        email = normalizeEmail(email);

        // Validate the college email address.
        if (!emailValidationService.isCollegeEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Only PMEC college email addresses are allowed."
            );
        }

        LocalDateTime now = LocalDateTime.now();

        // Check the latest OTP for this email.
        // A verified OTP must not trigger the resend cooldown.
        otpRepository.findTopByEmailOrderByIdDesc(email)
                .filter(previous -> previous.getCreatedAt() != null)
                .filter(previous ->
                        !Boolean.TRUE.equals(previous.getVerified())
                )
                .filter(previous ->
                        previous.getCreatedAt()
                                .plusSeconds(RESEND_COOLDOWN_SECONDS)
                                .isAfter(now)
                )
                .ifPresent(previous -> {

                    LocalDateTime allowedAt = previous.getCreatedAt()
                            .plusSeconds(RESEND_COOLDOWN_SECONDS);

                    long secondsRemaining = Duration.between(
                            now,
                            allowedAt
                    ).toSeconds();

                    throw new ResponseStatusException(
                            HttpStatus.TOO_MANY_REQUESTS,
                            "Please wait "
                                    + (secondsRemaining + 1)
                                    + " seconds before requesting another OTP."
                    );
                });

        // Generate a cryptographically secure six-digit OTP.
        String otp = String.format(
                Locale.ROOT,
                "%06d",
                secureRandom.nextInt(1_000_000)
        );

        // Prepare the OTP record.
        OtpVerification verification = new OtpVerification();

        verification.setEmail(email);
        verification.setOtp(otp);
        verification.setCreatedAt(now);
        verification.setExpiresAt(
                now.plusMinutes(OTP_EXPIRY_MINUTES)
        );
        verification.setVerified(false);

        // Send the email before saving the new OTP record.
        emailService.sendOtpEmail(email, otp);

        otpRepository.save(verification);
    }

    @Override
    public void verifyOtp(String email, String otp) {

        // Normalize the email address.
        email = normalizeEmail(email);

        // Validate the supplied OTP.
        if (otp == null || otp.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please enter the OTP."
            );
        }

        // Find the latest OTP associated with this email.
        OtpVerification verification = otpRepository
                .findTopByEmailOrderByIdDesc(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "OTP not found. Please request a new OTP."
                ));

        // Prevent reuse of an already verified OTP.
        if (Boolean.TRUE.equals(verification.getVerified())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP already verified."
            );
        }

        LocalDateTime now = LocalDateTime.now();

        // Check whether the OTP has expired.
        if (verification.getExpiresAt() == null
                || !now.isBefore(verification.getExpiresAt())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "OTP expired!"
            );
        }

        // Compare the supplied OTP with the stored OTP.
        if (verification.getOtp() == null
                || !verification.getOtp().equals(otp.trim())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid OTP!"
            );
        }

        // Mark the OTP as verified.
        verification.setVerified(true);

        otpRepository.save(verification);
    }

    private String normalizeEmail(String email) {
        return email == null
                ? ""
                : email.trim().toLowerCase(Locale.ROOT);
    }
}
