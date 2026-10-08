package com.auth.service;


public interface OtpService {
    void generateAndSendOtp(String mail);
    void verifyOtp(String mail , String otp);
}
