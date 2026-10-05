package com.admin.dto;

import com.user.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class StaffResponse {

    private Long id;
    private String fullName;
    private String email;
    private Role role;
    private boolean enabled;
    private boolean emailVerified;
}