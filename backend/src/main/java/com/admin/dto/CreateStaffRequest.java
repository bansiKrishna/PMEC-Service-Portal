package com.admin.dto;

import com.user.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateStaffRequest {

    @NotBlank
    private String fullName;

    @NotBlank
    @Email
    @Pattern(regexp = ".+@pmec\\.ac\\.in$")
    private String email;

    @NotNull
    private Role role;

    @NotBlank
    @Size(min = 8, max = 72)
    private String password;
}

