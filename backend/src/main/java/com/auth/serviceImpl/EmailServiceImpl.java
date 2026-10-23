package com.auth.serviceImpl;

import com.admin.entity.EmailServiceSettings;
import com.admin.service.EmailCredentialEncryptionService;
import com.admin.service.EmailServiceSettingsService;
import com.auth.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Service;

import java.util.Properties;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final String SMTP_HOST = "smtp.gmail.com";
    private static final int SMTP_PORT = 587;

    private final EmailServiceSettingsService settingsService;
    private final EmailCredentialEncryptionService credentialEncryptionService;

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        send(toEmail, "PMEC Student Service Portal - OTP Verification",
                "Your verification code is: " + otp + "\n\nThis code is valid for 5 minutes.");
    }

    @Override
    public void sendTestEmail(String recipientEmail) {
        EmailServiceSettings settings = settingsService.getConfiguredSettings();
        String recipient = recipientEmail == null || recipientEmail.isBlank()
                ? settings.getGmailAddress()
                : recipientEmail.trim();
        send(recipient, "PMEC Student Service Portal - Test Email",
                "Your email service settings are working correctly.");
    }

    private void send(String toEmail, String subject, String body) {
        EmailServiceSettings settings = settingsService.getConfiguredSettings();
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(SMTP_HOST);
        mailSender.setPort(SMTP_PORT);
        mailSender.setUsername(settings.getGmailAddress());
        mailSender.setPassword(credentialEncryptionService.decrypt(settings.getEncryptedAppPassword()));

        Properties mailProperties = mailSender.getJavaMailProperties();
        mailProperties.put("mail.smtp.auth", "true");
        mailProperties.put("mail.smtp.starttls.enable", "true");

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(settings.getGmailAddress());
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);
        try {
            mailSender.send(message);
        } catch (MailException exception) {
            throw new IllegalStateException(
                    "Email could not be sent. Check the Gmail address and App Password."
            );
        }
    }
}
