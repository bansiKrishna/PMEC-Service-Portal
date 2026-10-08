package com.auth.serviceImpl;

import com.auth.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(
                "PMEC Student Service Portal- OTP Verification"
        );
        message.setText(
                "Your OTP for Login is : " + otp +
                        "\n\n  This OTP is only valid for 5 minutes."
        );
        mailSender.send(message);
    }
}
