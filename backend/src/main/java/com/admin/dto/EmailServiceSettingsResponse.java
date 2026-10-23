package com.admin.dto;

public record EmailServiceSettingsResponse(
        String gmailAddress,
        boolean configured
) {
}
