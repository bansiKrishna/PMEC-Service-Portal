package com.auth.serviceImpl;

import com.auth.service.EmailValidationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailValidationServiceImpl implements EmailValidationService {

    @Value("${college.email.domain}")
    private String collegeDomain;

    @Override
    public boolean isCollegeEmail(String email) {

        if (email == null || email.isBlank()) {
            return false;
        }

        email = email.trim().toLowerCase();

        return email.endsWith("@" + collegeDomain.toLowerCase());
    }
}