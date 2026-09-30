package com.auth.service;

import com.auth.dto.LoginRequest;
import com.auth.dto.LoginResponse;
import com.auth.dto.RegisterRequest;
import com.auth.dto.RegisterResponse;
import com.auth.dto.ChangePasswordRequest;
import com.security.JwtService;
import com.user.entity.Role;
import com.user.entity.User;
import com.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    @Value("${college.email.domain:@pmec.ac.in}")
    private String collegeDomain;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    @Transactional
    public RegisterResponse register(RegisterRequest request) {

        String email = normalizeEmail(request.email());
        validateCollegeEmail(email);

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already registered");
        }

        if (userRepository.existsByRollNumber(request.rollNumber().trim())) {
            throw new RuntimeException("Roll number already registered");
        }

        User user = User.builder()
                .fullName(request.fullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .rollNumber(request.rollNumber().trim())
                .department(request.department() == null ? null : request.department().trim())
                .semester(request.semester())
                .role(Role.STUDENT)
                .enabled(true)
                .emailVerified(true)
                .build();

        User savedUser = userRepository.save(user);

        return new RegisterResponse(
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                savedUser.getRollNumber(),
                savedUser.getRole().name(),
                "Registration successful. You can now sign in with your college email."
        );
    }

    @Override
    public LoginResponse login(LoginRequest request) {

        String email = normalizeEmail(request.email());
        validateCollegeEmail(email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!user.isEnabled()) {
            throw new RuntimeException("Account is disabled");
        }

        String token = jwtService.generateToken(user.getEmail());

        return new LoginResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    @Override
    @Transactional
    public void changePassword(String authenticatedEmail, ChangePasswordRequest request) {
        String email = normalizeEmail(authenticatedEmail);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User account not found"));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }
        if (passwordEncoder.matches(request.newPassword(), user.getPassword())) {
            throw new RuntimeException("New password must be different from the current password");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private void validateCollegeEmail(String email) {
        if (email == null || email.isBlank() || !email.endsWith(collegeDomain)) {
            throw new RuntimeException("Only college email is allowed");
        }
    }

}