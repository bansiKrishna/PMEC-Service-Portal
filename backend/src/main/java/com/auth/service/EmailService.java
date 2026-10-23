package com.auth.service;

public interface EmailService {

    void sendOtpEmail(String toEmail, String otp);

    void sendTestEmail(String recipientEmail);

}
