package com.user.service;

import com.user.entity.User;
import com.user.repository.UserRepository;
import com.exception.UnauthorizedException;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;


//  This assumes your JWT authentication sets the authenticated username to the user's email.

@Service
@RequiredArgsConstructor
public class CurrentUserService {

    private final UserRepository userRepository;

    public User getCurrentUser() {

        var authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            throw new UnauthorizedException(
                    "User is not authenticated"
            );
        }

        String email =
                authentication.getName();

        RequestAttributes attributes =
                RequestContextHolder.getRequestAttributes();
        String requestAttributeKey =
                CurrentUserService.class.getName() + ".USER";
        if (attributes != null) {
            Object cached = attributes.getAttribute(
                    requestAttributeKey,
                    RequestAttributes.SCOPE_REQUEST
            );
            if (cached instanceof User cachedUser
                    && email.equals(cachedUser.getEmail())) {
                return cachedUser;
            }
        }

        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() ->
                        new UnauthorizedException(
                                "Current user not found"
                        )
                );
        if (attributes != null) {
            attributes.setAttribute(
                    requestAttributeKey,
                    user,
                    RequestAttributes.SCOPE_REQUEST
            );
        }
        return user;
    }
}