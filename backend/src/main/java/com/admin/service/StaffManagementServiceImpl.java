package com.admin.service;

import com.admin.dto.CreateStaffRequest;
import com.admin.dto.StaffResponse;
import com.exception.BadRequestException;
import com.user.entity.Role;
import com.user.entity.User;
import com.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class StaffManagementServiceImpl
        implements StaffManagementService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;


    // =========================================================
    // CREATE STAFF
    // =========================================================

    @Override
    public StaffResponse createStaff(
            CreateStaffRequest request) {

        String email = request.getEmail().trim().toLowerCase(Locale.ROOT);

        // Check duplicate email
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException(
                    "Email already registered"
            );
        }

        if (request.getRole() != Role.DSW
                && request.getRole() != Role.PRINCIPAL
                && request.getRole() != Role.LIBRARIAN) {
            throw new IllegalArgumentException(
                    "Only DSW, PRINCIPAL, or LIBRARIAN accounts can be created here"
            );
        }

        User user = new User();

        user.setFullName(request.getFullName());
        user.setEmail(email);
        user.setRole(request.getRole());

        user.setPassword(
                passwordEncoder.encode(request.getPassword())
        );

        user.setEnabled(true);
        user.setEmailVerified(false);
        user.setFirstLogin(true);

        User saved = userRepository.save(user);

        return mapToResponse(saved);
    }


    // =========================================================
    // GET STAFF BY ID
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public StaffResponse getStaff(Long id) {
        return mapToResponse(findStaffUser(id));
    }


    // =========================================================
    // GET ALL STAFF
    // =========================================================

    @Override
    @Transactional(readOnly = true)
    public List<StaffResponse> getAllStaff() {

        return userRepository.findAll()
                .stream()
                .filter(user ->
                        user.getRole() != null
                                && (user.getRole() == Role.DSW
                                || user.getRole() == Role.PRINCIPAL
                                || user.getRole() == Role.LIBRARIAN)
                )
                .map(this::mapToResponse)
                .toList();
    }


    // =========================================================
    // DISABLE STAFF
    // =========================================================

    @Override
    public void disableStaff(Long id) {
        User user = findStaffUser(id);
        user.setEnabled(false);

        userRepository.save(user);
    }


    // =========================================================
    // ENABLE STAFF
    // =========================================================

    @Override
    public void enableStaff(Long id) {
        User user = findStaffUser(id);
        user.setEnabled(true);

        userRepository.save(user);
    }

    @Override
    public void changeStaffPassword(Long id, String password) {
        User user = findStaffUser(id);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstLogin(true);
        userRepository.save(user);
    }

    @Override
    public StaffResponse changeStaffRole(Long id, Role role) {
        if (role != Role.DSW
                && role != Role.PRINCIPAL
                && role != Role.LIBRARIAN) {
            throw new BadRequestException(
                    "Role must be DSW, PRINCIPAL, or LIBRARIAN"
            );
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "User not found with id: " + id
                ));
        user.setRole(role);
        return mapToResponse(userRepository.save(user));
    }

        private User findStaffUser(Long id) {
                User user = userRepository.findById(id)
                                .orElseThrow(() ->
                                                new RuntimeException("Staff not found with id: " + id)
                                );
                if (user.getRole() != Role.DSW
                                && user.getRole() != Role.PRINCIPAL
                                && user.getRole() != Role.LIBRARIAN) {
                        throw new IllegalArgumentException("User is not a staff account");
                }
                return user;
        }


    // =========================================================
    // ENTITY -> RESPONSE DTO
    // =========================================================

    private StaffResponse mapToResponse(User user) {

        return new StaffResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.isEnabled(),
                user.isEmailVerified()
        );
    }
}